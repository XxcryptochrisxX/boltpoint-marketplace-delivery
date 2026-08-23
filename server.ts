import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';
import { calculateQuote } from './src/lib/pricing';
import type { BookingDetails, QuoteInput } from './src/types';
import { isFullStreetAddress } from './src/lib/addressValidation';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 3000);
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
type CheckoutBooking = Omit<BookingDetails, 'id' | 'createdAt' | 'status'>;

function required(value: unknown, label: string) {
  const clean = typeof value === 'string' ? value.trim() : '';
  if (!clean) throw new Error(`${label} is required.`);
  return clean.slice(0, 500);
}

function driverPayout(vehicle: string, miles: number) {
  const base = vehicle === 'Box Truck' ? 75 : vehicle === 'Cargo Van' ? 60 : 55;
  return Math.round(base + Math.max(0, miles - 10) * 1.25);
}

function toMetadata(payload: unknown) {
  const value = JSON.stringify(payload);
  const metadata: Record<string, string> = {};
  for (let i = 0; i * 450 < value.length; i += 1) {
    if (i >= 40) throw new Error('Order details are too large for checkout.');
    metadata[`booking_${i}`] = value.slice(i * 450, (i + 1) * 450);
  }
  return metadata;
}

function fromMetadata(metadata: Stripe.Metadata): CheckoutBooking {
  const value = Object.keys(metadata).filter(k => k.startsWith('booking_'))
    .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
    .map(k => metadata[k]).join('');
  if (!value) throw new Error('Checkout is missing booking details.');
  return JSON.parse(value);
}

async function sendEmail(to: string, subject: string, text: string, key: string) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`Email failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
}

async function dispatchToShipday(booking: CheckoutBooking, orderNumber: string, amount: number) {
  if (!process.env.SHIPDAY_API_KEY) throw new Error('SHIPDAY_API_KEY is not configured.');
  const response = await fetch('https://api.shipday.com/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber,
      customerName: booking.customerName,
      customerAddress: booking.deliveryAddress,
      customerEmail: booking.customerEmail,
      customerPhoneNumber: booking.customerPhone,
      restaurantName: booking.sellerName,
      restaurantAddress: booking.pickupAddress,
      restaurantPhoneNumber: booking.sellerPhone || process.env.BUSINESS_PHONE,
      expectedDeliveryDate: booking.preferredDeliveryDate,
      orderItem: [{ name: booking.itemDescription || booking.quote.itemType, unitPrice: amount, quantity: 1 }],
      deliveryFee: amount,
      totalOrderCost: amount,
      paymentMethod: 'credit_card',
      pickupInstruction: booking.specialNotes || '',
      deliveryInstruction: `Vehicle: ${booking.quoteResult.vehicleTypeRecommended}. Paid online.`,
      orderSource: 'Bolt Point Marketplace Delivery',
      additionalId: orderNumber,
    }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Shipday failed (${response.status}): ${body.slice(0, 250)}`);
  return JSON.parse(body);
}

// Must be registered before express.json() so Stripe receives the raw request.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send('Stripe webhook is not configured.');
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).send('Missing Stripe signature.');
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        const booking = fromMetadata(session.metadata || {});
        const orderNumber = `BPL-${session.id.slice(-10).toUpperCase()}`;
        const amount = (session.amount_total || 0) / 100;
        const shipday = await dispatchToShipday(booking, orderNumber, amount);
        const summary = `Delivery ${orderNumber} is paid and sent to dispatch.\nPickup: ${booking.pickupAddress}\nDelivery: ${booking.deliveryAddress}\nDate: ${booking.preferredDeliveryDate}, ${booking.preferredDeliveryTimeSlot}\nTotal: $${amount.toFixed(2)}`;
        await Promise.all([
          sendEmail(booking.customerEmail, `Delivery confirmed: ${orderNumber}`, `${summary}\n\nWe will contact you when a driver is assigned.`, `${event.id}-customer`),
          process.env.BUSINESS_EMAIL ? sendEmail(process.env.BUSINESS_EMAIL, `New paid delivery: ${orderNumber}`, `${summary}\nShipday order: ${shipday.orderId || 'created'}\nDriver payout: $${session.metadata?.driver_payout}`, `${event.id}-business`) : undefined,
        ]);
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook failed:', error);
    res.status(400).send(error instanceof Error ? error.message : 'Webhook failed.');
  }
});

app.use(express.json({ limit: '200kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', maps: process.env.GOOGLE_MAPS_API_KEY ? 'google' : 'not_configured', stripe: Boolean(stripe), shipday: Boolean(process.env.SHIPDAY_API_KEY), email: Boolean(process.env.RESEND_API_KEY), time: new Date().toISOString() }));

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Online checkout is not configured yet.' });
  try {
    const input = req.body as CheckoutBooking;
    const quote = input.quote as QuoteInput;
    if (!isFullStreetAddress(quote.pickupZip) || !isFullStreetAddress(quote.deliveryZip)) {
      throw new Error('A complete street address, city, state, and ZIP code is required for pickup and delivery.');
    }
    const route = await calculateRoadRoute(quote.pickupZip, quote.deliveryZip);
    const verifiedQuote = calculateQuote({ ...quote, accurateMiles: route.miles, drivingDuration: route.duration, isOpenStreetMapVerified: true });
    const booking: CheckoutBooking = {
      ...input,
      customerName: required(input.customerName, 'Customer name'), customerPhone: required(input.customerPhone, 'Customer phone'), customerEmail: required(input.customerEmail, 'Customer email'),
      pickupAddress: required(input.pickupAddress, 'Pickup address'), deliveryAddress: required(input.deliveryAddress, 'Delivery address'),
      sellerName: required(input.sellerName, 'Seller name'), sellerPhone: required(input.sellerPhone, 'Seller phone'),
      itemDescription: required(input.itemDescription, 'Item description'), preferredDeliveryDate: required(input.preferredDeliveryDate, 'Delivery date'), preferredDeliveryTimeSlot: required(input.preferredDeliveryTimeSlot, 'Delivery time'),
      itemPhotos: [], quote, quoteResult: verifiedQuote,
    };
    if (verifiedQuote.totalPrice < 1) throw new Error('The checkout total must be at least $1.');
    const payout = driverPayout(verifiedQuote.vehicleTypeRecommended, verifiedQuote.estimatedMiles);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', customer_email: booking.customerEmail,
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: Math.round(verifiedQuote.totalPrice * 100), product_data: { name: `${booking.quote.itemType} delivery`, description: `${verifiedQuote.estimatedMiles} miles · ${verifiedQuote.vehicleTypeRecommended}` } } }],
      metadata: { ...toMetadata(booking), driver_payout: String(payout) },
      payment_intent_data: { metadata: { service: 'marketplace_delivery', driver_payout: String(payout) } },
      success_url: `${APP_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/?checkout=cancelled`,
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to start checkout.' });
  }
});

app.get('/api/checkout-session/:id', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Checkout is not configured.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({ paid: session.payment_status === 'paid', orderNumber: `BPL-${session.id.slice(-10).toUpperCase()}`, booking: fromMetadata(session.metadata || {}) });
  } catch { res.status(404).json({ error: 'Checkout session not found.' }); }
});

app.post('/api/contact', async (req, res) => {
  try {
    if (!process.env.BUSINESS_EMAIL) throw new Error('Business email is not configured.');
    const name = required(req.body.name, 'Name'); const email = required(req.body.email, 'Email'); const message = required(req.body.message, 'Message');
    await sendEmail(process.env.BUSINESS_EMAIL, `Website inquiry from ${name}`, `From: ${name} <${email}>\nPhone: ${req.body.phone || 'Not provided'}\n\n${message}`, `contact-${Date.now()}`);
    res.json({ success: true });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to send message.' }); }
});

interface GoogleValidatedAddress { lat: number; lng: number; displayName: string; placeId?: string }

async function validateGoogleAddress(query: string): Promise<GoogleValidatedAddress> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Google Maps is not configured. Add GOOGLE_MAPS_API_KEY to the server environment.');
  const response = await fetch('https://addressvalidation.googleapis.com/v1:validateAddress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
    body: JSON.stringify({ address: { regionCode: 'US', addressLines: [query] }, enableUspsCass: true }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'Google could not validate this address.');
  const result = data.result;
  const verdict = result?.verdict;
  const location = result?.geocode?.location;
  const acceptableGranularity = ['PREMISE', 'SUB_PREMISE'].includes(verdict?.geocodeGranularity);
  if (!verdict?.addressComplete || verdict?.hasUnconfirmedComponents || !acceptableGranularity || typeof location?.latitude !== 'number' || typeof location?.longitude !== 'number') {
    throw new Error(`Google could not confirm this exact delivery address: ${query}. Review any missing or corrected address fields.`);
  }
  return { lat: location.latitude, lng: location.longitude, displayName: result.address.formattedAddress, placeId: result.geocode.placeId };
}

async function calculateRoadRoute(origin: string, destination: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Google Maps is not configured. Add GOOGLE_MAPS_API_KEY to the server environment.');
  const [from, to] = await Promise.all([validateGoogleAddress(origin), validateGoogleAddress(destination)]);
  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration' },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
      destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      computeAlternativeRoutes: false,
      units: 'IMPERIAL',
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.routes?.[0]) throw new Error(data?.error?.message || 'Google could not calculate a driving route for these addresses.');
  const miles = Math.round((data.routes[0].distanceMeters / 1609.344) * 10) / 10;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latDistance = toRadians(to.lat - from.lat);
  const lngDistance = toRadians(to.lng - from.lng);
  const haversine = Math.sin(latDistance / 2) ** 2 + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(lngDistance / 2) ** 2;
  const straightLineMiles = 3958.8 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  const maximumPlausibleMiles = Math.max(5, straightLineMiles * 4);
  if (miles > maximumPlausibleMiles) {
    throw new Error('The routing service returned an implausible detour. Please verify both addresses or contact dispatch for a manual quote.');
  }
  const durationSeconds = Number(String(data.routes[0].duration || '0s').replace('s', ''));
  const durationMinutes = Math.max(Math.round(durationSeconds / 60), 1);
  return { miles, durationMinutes, duration: `${durationMinutes} mins`, originFormatted: from.displayName, destinationFormatted: to.displayName };
}

app.post('/api/calculate-distance', async (req, res) => {
  const { origin, destination } = req.body; if (!origin || !destination) return res.status(400).json({ success: false, error: 'Both addresses are required.' });
  if (!isFullStreetAddress(origin) || !isFullStreetAddress(destination)) return res.status(400).json({ success: false, error: 'Enter both full street addresses, including city, state, and ZIP code.' });
  try {
    const route = await calculateRoadRoute(origin, destination);
    return res.json({ success: true, ...route, source: 'google_routes', isOpenStreetMapVerified: true });
  } catch (error) {
    return res.status(422).json({ success: false, error: error instanceof Error ? error.message : 'Unable to verify this route.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') app.use((await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })).middlewares);
  else { const distPath = path.join(process.cwd(), 'dist'); app.use(express.static(distPath)); app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html'))); }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}
startServer();
