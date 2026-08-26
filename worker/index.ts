import Stripe from 'stripe';
import { calculateQuote } from '../src/lib/pricing';
import { isFullStreetAddress } from '../src/lib/addressValidation';
import type { BookingDetails, QuoteInput, SellerDeliveryLink } from '../src/types';

interface D1Result<T = unknown> { results?: T[] }
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<{ meta?: { changes?: number } }>;
}
interface D1Database { prepare(query: string): D1Statement }
interface R2Object { body: ReadableStream; httpEtag?: string; httpMetadata?: { contentType?: string } }
interface R2Bucket {
  put(key: string, value: ArrayBuffer | ArrayBufferView, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
}
interface AssetsBinding { fetch(request: Request): Promise<Response> }

interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ASSETS: AssetsBinding;
  GOOGLE_MAPS_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SHIPDAY_API_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  BUSINESS_EMAIL?: string;
  BUSINESS_PHONE?: string;
  ADMIN_EMAILS?: string;
}

type CheckoutBooking = Omit<BookingDetails, 'id' | 'createdAt' | 'status'>;
const PREFIX = '/marketplacedelivery';
const APP_URL = 'https://boltpointlogistics.com/marketplacedelivery';
const TERMS_VERSION = '2026-08-24';
const PRIVACY_VERSION = '2026-08-24';
const SESSION_COOKIE = 'bpl_seller_session';

function adminEmail(request: Request, env: Env) {
  const url = new URL(request.url);
  const email = request.headers.get('cf-access-authenticated-user-email') || ((url.hostname === '127.0.0.1' || url.hostname === 'localhost') ? request.headers.get('x-bpl-local-admin-email') : null);
  const allowed = String(env.ADMIN_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  return email && allowed.includes(email.toLowerCase()) ? email.toLowerCase() : null;
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Unexpected error.';

function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function publicSellerLink(link: SellerDeliveryLink) {
  const { exactPickupAddress: _address, pickupGateCode: _gate, pickupInstructions: _instructions, sellerPhone: _phone, sellerEmail: _email, ...safe } = link;
  return safe;
}

function cookieValue(request: Request, name: string) {
  const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function authenticatedAccount(request: Request, env: Env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  return env.DB.prepare(`SELECT a.id, a.email, a.name, a.phone FROM seller_sessions s
    JOIN seller_accounts a ON a.id = s.account_id
    WHERE s.token_hash = ?1 AND s.expires_at > ?2`).bind(await hashToken(token), new Date().toISOString()).first<any>();
}

function required(value: unknown, label: string) {
  const clean = typeof value === 'string' ? value.trim() : '';
  if (!clean) throw new Error(`${label} is required.`);
  return clean.slice(0, 500);
}

function stripeClient(env: Env) {
  return env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() }) : null;
}

function driverPayout(vehicle: string, miles: number) {
  const base = vehicle === 'Box Truck' ? 75 : vehicle === 'Cargo Van' ? 60 : 55;
  return Math.round(base + Math.max(0, miles - 10) * 1.25);
}

function toMetadata(payload: unknown) {
  const value = JSON.stringify(payload);
  const metadata: Record<string, string> = {};
  for (let offset = 0, index = 0; offset < value.length; offset += 450, index += 1) {
    if (index >= 40) throw new Error('Order details are too large for checkout.');
    metadata[`booking_${index}`] = value.slice(offset, offset + 450);
  }
  return metadata;
}

function fromMetadata(metadata: Stripe.Metadata): CheckoutBooking {
  const value = Object.keys(metadata).filter((key) => key.startsWith('booking_'))
    .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
    .map((key) => metadata[key]).join('');
  if (!value) throw new Error('Checkout is missing booking details.');
  return JSON.parse(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]!));
}

async function sendEmail(env: Env, to: string, subject: string, text: string, key: string, html?: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return;
  let lastError = 'Unknown email provider error.';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text, ...(html ? { html } : {}) }),
    });
    if (response.ok) return;
    const detail = await response.text().catch(() => '');
    lastError = `Email provider rejected the message (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`;
    console.error(lastError);
    if (response.status < 500 && response.status !== 429) break;
  }
  throw new Error(lastError);
}

async function recordOrderEvent(
  env: Env,
  sessionId: string,
  eventType: string,
  actor: string,
  details: Record<string, unknown>,
  createdAt: string,
  once = true,
) {
  const eventData = JSON.stringify({ actor, ...details });
  if (once) {
    await env.DB.prepare(`INSERT INTO order_events (session_id, event_type, event_data, created_at)
      SELECT ?1, ?2, ?3, ?4 WHERE NOT EXISTS (
        SELECT 1 FROM order_events WHERE session_id = ?1 AND event_type = ?2
      )`).bind(sessionId, eventType, eventData, createdAt).run();
    return;
  }
  await env.DB.prepare('INSERT INTO order_events (session_id, event_type, event_data, created_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(sessionId, eventType, eventData, createdAt).run();
}

async function dispatchToShipday(env: Env, booking: CheckoutBooking, orderNumber: string, amount: number, deliveryWindow?: string) {
  if (!env.SHIPDAY_API_KEY) throw new Error('SHIPDAY_API_KEY is not configured.');
  const normalizePhone = (value?: string) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return value?.startsWith('+') ? value : undefined;
  };
  const sellerPhone = normalizePhone(booking.sellerPhone || env.BUSINESS_PHONE);
  const payload: Record<string, unknown> = {
    orderNumber, customerName: booking.customerName, customerAddress: booking.deliveryAddress,
    customerEmail: booking.customerEmail, customerPhoneNumber: normalizePhone(booking.customerPhone),
    restaurantName: booking.sellerName, restaurantAddress: booking.pickupAddress,
    expectedDeliveryDate: deliveryWindow?.slice(0, 10) || booking.preferredDeliveryDate,
    orderItem: [{ name: booking.itemDescription || booking.quote.itemType, unitPrice: amount, quantity: 1 }],
    deliveryFee: amount, totalOrderCost: amount, paymentMethod: 'credit_card',
    pickupInstruction: booking.specialNotes || '',
    deliveryInstruction: `Vehicle: ${booking.quoteResult.vehicleTypeRecommended}. Paid online. Confirmed delivery window: ${deliveryWindow || 'Dispatch will confirm directly'}.`,
    orderSource: 'Bolt Point Marketplace Delivery', additionalId: orderNumber,
  };
  if (!payload.customerPhoneNumber) throw new Error('Shipday requires a valid buyer phone number with country code.');
  if (sellerPhone) payload.restaurantPhoneNumber = sellerPhone;
  const response = await fetch('https://api.shipday.com/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${env.SHIPDAY_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({})) as { success?: boolean; orderId?: string | number; response?: string; message?: string };
  if (!response.ok || result.success !== true || !result.orderId) {
    throw new Error(`Shipday rejected the order${result.response || result.message ? `: ${result.response || result.message}` : ` (${response.status})`}.`);
  }
  return { ...result, orderId: String(result.orderId) };
}

async function fulfillPaidSession(env: Env, session: Stripe.Checkout.Session) {
  const booking = fromMetadata(session.metadata || {});
  const orderNumber = `BPL-${session.id.slice(-10).toUpperCase()}`;
  const amount = (session.amount_total || 0) / 100;
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT OR IGNORE INTO dispatch_orders (session_id, order_number, status, amount_cents, booking_snapshot, seller_confirmation_status, scheduling_status, created_at, updated_at)
    VALUES (?1, ?2, 'pending', ?3, ?4, ?5, ?6, ?7, ?7)`).bind(session.id, orderNumber, session.amount_total || 0, JSON.stringify(booking), booking.sellerLinkId ? 'pending' : 'not_required', booking.sellerLinkId ? 'awaiting_seller' : 'not_required', now).run();
  await recordOrderEvent(env, session.id, 'payment_confirmed', 'stripe', {
    amountCents: session.amount_total || 0,
    listingSnapshotAccepted: booking.buyerAcceptedListingCondition === true,
    deliveryTermsAccepted: booking.buyerAcceptedDeliveryTerms === true,
  }, now);
  const existing = await env.DB.prepare('SELECT status, shipday_order_id, error, seller_confirmation_status, seller_confirmation_token_hash, scheduling_status, selected_delivery_window FROM dispatch_orders WHERE session_id = ?1').bind(session.id).first<any>();
  if (existing?.status === 'dispatched') return { orderNumber, booking, status: 'dispatched', shipdayOrderId: existing.shipday_order_id };
  if (booking.sellerLinkId && existing?.seller_confirmation_status !== 'confirmed') {
    if (!existing?.seller_confirmation_token_hash) {
      const confirmationToken = randomToken();
      const tokenHash = await hashToken(confirmationToken);
      const saved = await env.DB.prepare(`UPDATE dispatch_orders SET seller_confirmation_token_hash = ?2, updated_at = ?3
        WHERE session_id = ?1 AND seller_confirmation_token_hash IS NULL`).bind(session.id, tokenHash, now).run();
      if (saved.meta?.changes && booking.listingSnapshot?.sellerEmail) {
        const confirmUrl = `${APP_URL}/api/orders/${encodeURIComponent(orderNumber)}/seller-confirm?token=${confirmationToken}`;
        try {
          const item = booking.listingSnapshot.itemTitle;
          await sendEmail(env, booking.listingSnapshot.sellerEmail, `Let’s confirm pickup availability for ${item}`, `A buyer has paid for delivery of ${item}. Confirm the item and give us a few pickup windows here:\n${confirmUrl}\n\nThe buyer will choose from your available windows, then BoltPoint dispatch will confirm the final pickup and delivery time.`, `${session.id}-seller-availability`, `<h2>Let’s confirm pickup availability for <strong>${escapeHtml(item)}</strong></h2><p>A buyer has paid for delivery. Confirm the item is still available and give us a few pickup windows.</p><p><a style="display:inline-block;padding:14px 20px;border-radius:12px;background:#f97316;color:#fff;text-decoration:none;font-weight:700" href="${confirmUrl}">Confirm Item &amp; Pickup Availability</a></p><p>The buyer will choose from your available windows, then BoltPoint dispatch will confirm the final pickup and delivery time.</p>`);
        } catch (error) {
          await env.DB.prepare('UPDATE dispatch_orders SET seller_confirmation_token_hash = NULL, error = ?2, updated_at = ?3 WHERE session_id = ?1').bind(session.id, errorMessage(error).slice(0, 500), new Date().toISOString()).run();
          throw error;
        }
      }
    }
    return { orderNumber, booking, status: 'awaiting_seller' };
  }
  if (booking.sellerLinkId && existing?.scheduling_status !== 'confirmed') {
    return { orderNumber, booking, status: existing?.scheduling_status || 'awaiting_seller' };
  }
  const stale = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const lock = await env.DB.prepare(`UPDATE dispatch_orders SET status = 'processing', error = NULL, updated_at = ?2
    WHERE session_id = ?1 AND (status IN ('pending', 'failed') OR (status = 'processing' AND updated_at < ?3))`).bind(session.id, now, stale).run();
  if (!lock.meta?.changes) return { orderNumber, booking, status: 'processing' };
  try {
    const shipday = await dispatchToShipday(env, booking, orderNumber, amount, existing?.selected_delivery_window);
    const pickupPin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
    await env.DB.prepare(`UPDATE dispatch_orders SET status = 'dispatched', shipday_order_id = ?2, error = NULL, updated_at = ?3 WHERE session_id = ?1`)
      .bind(session.id, shipday.orderId, new Date().toISOString()).run();
    await recordOrderEvent(env, session.id, 'shipday_dispatched', 'system', { shipdayOrderId: shipday.orderId }, new Date().toISOString());
    await env.DB.prepare('UPDATE dispatch_orders SET pickup_pin_hash = ?2 WHERE session_id = ?1 AND pickup_pin_hash IS NULL').bind(session.id, await hashToken(pickupPin)).run();
    if (booking.sellerLinkId) await env.DB.prepare('UPDATE seller_links SET status = ?1 WHERE id = ?2').bind('Booked', booking.sellerLinkId).run();
    const summary = `Delivery ${orderNumber} is paid and sent to dispatch.\nPickup: ${booking.pickupAddress}\nDelivery: ${booking.deliveryAddress}\nTotal: $${amount.toFixed(2)}`;
    await Promise.allSettled([sendEmail(env, booking.customerEmail, `Delivery confirmed: ${orderNumber}`, summary, `${session.id}-customer`), booking.listingSnapshot?.sellerEmail ? sendEmail(env, booking.listingSnapshot.sellerEmail, `Pickup PIN for ${orderNumber}`, `Your item is confirmed for dispatch. Give this one-time pickup PIN to the delivery partner only after you verify the item and are ready for it to be loaded:\n\n${pickupPin}`, `${session.id}-pickup-pin`) : Promise.resolve(), env.BUSINESS_EMAIL ? sendEmail(env, env.BUSINESS_EMAIL, `New paid delivery: ${orderNumber}`, `${summary}\nShipday order: ${shipday.orderId}`, `${session.id}-business`) : Promise.resolve()]);
    console.log(`Shipday dispatch created for ${orderNumber}: ${shipday.orderId}`);
    return { orderNumber, booking, status: 'dispatched', shipdayOrderId: shipday.orderId };
  } catch (error) {
    const message = errorMessage(error).slice(0, 500);
    await env.DB.prepare(`UPDATE dispatch_orders SET status = 'failed', error = ?2, updated_at = ?3 WHERE session_id = ?1`).bind(session.id, message, new Date().toISOString()).run();
    console.error(`Shipday dispatch failed for ${orderNumber}: ${message}`);
    throw error;
  }
}

interface GoogleAddress { lat: number; lng: number; displayName: string; state: string; zip: string }
async function validateGoogleAddress(env: Env, query: string): Promise<GoogleAddress> {
  if (!env.GOOGLE_MAPS_API_KEY) throw new Error('Google Maps is not configured.');
  const response = await fetch('https://addressvalidation.googleapis.com/v1:validateAddress', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY },
    body: JSON.stringify({ address: { regionCode: 'US', addressLines: [query] }, enableUspsCass: true }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || 'Google could not validate this address.');
  const verdict = data.result?.verdict;
  const location = data.result?.geocode?.location;
  if (!verdict?.addressComplete || verdict?.hasUnconfirmedComponents || !['PREMISE', 'SUB_PREMISE'].includes(verdict?.geocodeGranularity) || typeof location?.latitude !== 'number') {
    throw new Error(`Google could not confirm this exact delivery address: ${query}.`);
  }
  const components = data.result?.address?.addressComponents || [];
  const component = (type: string) => components.find((item: any) => item.componentType === type)?.componentName;
  const state = String(component('administrative_area_level_1')?.text || '').toUpperCase();
  const zip = String(component('postal_code')?.text || '').slice(0, 5);
  const requested = query.match(/,\s*([A-Za-z]{2})\s+(\d{5})(?:-\d{4})?\s*$/);
  if (!requested || state !== requested[1].toUpperCase() || zip !== requested[2]) {
    throw new Error('Google matched a different city, state, or ZIP than the address entered. Please select the full address from the suggestions and try again.');
  }
  return { lat: location.latitude, lng: location.longitude, displayName: data.result.address.formattedAddress, state, zip };
}

async function calculateRoadRoute(env: Env, origin: string, destination: string) {
  const [from, to] = await Promise.all([validateGoogleAddress(env, origin), validateGoogleAddress(env, destination)]);
  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY!, 'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration' },
    body: JSON.stringify({ origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } }, destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } }, travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE', units: 'IMPERIAL' }),
  });
  const data = await response.json() as any;
  if (!response.ok || !data.routes?.[0]) throw new Error(data?.error?.message || 'Google could not calculate this route.');
  const miles = Math.round((data.routes[0].distanceMeters / 1609.344) * 10) / 10;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latDistance = radians(to.lat - from.lat), lngDistance = radians(to.lng - from.lng);
  const h = Math.sin(latDistance / 2) ** 2 + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lngDistance / 2) ** 2;
  const straightLineMiles = 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  if (miles > Math.max(5, straightLineMiles * 4)) throw new Error('Google returned an implausible detour. Please verify both addresses.');
  if (miles > 150) throw new Error('This route is outside the local delivery area. No price was calculated. Please verify both full addresses or contact dispatch for a long-distance quote.');
  const durationMinutes = Math.max(Math.round(Number(String(data.routes[0].duration || '0s').replace('s', '')) / 60), 1);
  return { miles, durationMinutes, duration: `${durationMinutes} mins`, originFormatted: from.displayName, destinationFormatted: to.displayName };
}

async function googleAddressSuggestions(env: Env, input: string, sessionToken?: string) {
  if (!env.GOOGLE_MAPS_API_KEY) throw new Error('Google Maps is not configured.');
  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY, 'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text' },
    body: JSON.stringify({ input, sessionToken, includedRegionCodes: ['us'] }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || 'Google could not suggest addresses.');
  return (data.suggestions || []).flatMap((suggestion: any) => suggestion.placePrediction ? [{ placeId: suggestion.placePrediction.placeId, description: suggestion.placePrediction.text?.text }] : []).slice(0, 5);
}

async function googleAddressDetails(env: Env, placeId: string, sessionToken?: string) {
  if (!env.GOOGLE_MAPS_API_KEY) throw new Error('Google Maps is not configured.');
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  if (sessionToken) url.searchParams.set('sessionToken', sessionToken);
  const response = await fetch(url, {
    headers: { 'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY, 'X-Goog-FieldMask': 'formattedAddress,addressComponents' },
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message || 'Google could not load this address.');
  const component = (type: string) => data.addressComponents?.find((item: any) => item.types?.includes(type));
  const streetNumber = component('street_number')?.longText || '';
  const route = component('route')?.longText || '';
  const city = component('locality')?.longText || component('postal_town')?.longText || component('sublocality')?.longText || '';
  return {
    formattedAddress: data.formattedAddress,
    parts: {
      street: [streetNumber, route].filter(Boolean).join(' '),
      unit: component('subpremise')?.longText || '',
      city,
      state: component('administrative_area_level_1')?.shortText || '',
      zip: component('postal_code')?.longText || '',
    },
  };
}

function decodeDataUrl(value: string) {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { contentType: match[1], bytes };
}

async function createSellerLink(request: Request, env: Env) {
  const data = await request.json() as any;
  required(data.sellerName, 'Seller name');
  required(data.sellerPhone, 'Seller phone');
  required(data.sellerEmail, 'Seller email');
  required(data.itemTitle, 'Item title');
  required(data.dimensions, 'Item dimensions');
  if (!['Excellent', 'Good', 'Fair', 'Needs Repair'].includes(data.conditionRating)) throw new Error('Select the current item condition.');
  if (!Array.isArray(data.itemPhotos) || data.itemPhotos.length < 4) throw new Error('Add at least four current item photos.');
  if (!data.conditionCertifiedAt) throw new Error('Seller condition certification is required.');
  const id = `SL-${String(parseInt(randomToken(4), 16) % 1000000).padStart(6, '0')}`;
  const claimToken = randomToken();
  const photos: string[] = [];
  for (const [index, value] of (Array.isArray(data.itemPhotos) ? data.itemPhotos.slice(0, 6) : []).entries()) {
    const image = decodeDataUrl(value);
    if (!image) continue;
    const key = `seller-links/${id}/${index + 1}.jpg`;
    await env.IMAGES.put(key, image.bytes, { httpMetadata: { contentType: image.contentType, cacheControl: 'public, max-age=31536000, immutable' } });
    photos.push(`${APP_URL}/api/images/${key}`);
  }
  const cityState = data.pickupCityState || 'Austin, TX';
  const link: SellerDeliveryLink = {
    ...data, id, itemPhotos: photos, pickupCityState: cityState, payer: data.payer || 'buyer_pays',
    pickupAvailability: data.pickupAvailability || 'Flexible daytime pickup', isAddressMasked: true,
    maskedDisplayLocation: `${cityState} (${String(data.pickupZip || '').slice(0, 5)}) • Verified Seller Location (Exact address protected)`,
    status: 'Active', createdAt: new Date().toISOString(), viewsCount: 0,
  };
  await env.DB.prepare('INSERT INTO seller_links (id, data, status, views_count, created_at, claim_token_hash, claim_expires_at) VALUES (?1, ?2, ?3, 0, ?4, ?5, ?6)')
    .bind(id, JSON.stringify(link), 'Active', link.createdAt, await hashToken(claimToken), '9999-12-31T23:59:59.999Z').run();
  return json({ ...link, claimToken }, 201);
}

async function requestSellerLogin(request: Request, env: Env) {
  const body = await request.json() as any;
  const email = required(body.email, 'Email').toLowerCase().slice(0, 254);
  const claimToken = typeof body.claimToken === 'string' ? body.claimToken : '';
  let claimLinkId: string | null = null;
  if (claimToken) {
    if (body.termsAccepted !== true || body.termsVersion !== TERMS_VERSION || body.privacyVersion !== PRIVACY_VERSION) {
      throw new Error('You must agree to the current Terms and acknowledge the Privacy Policy.');
    }
    const claim = await env.DB.prepare('SELECT id FROM seller_links WHERE claim_token_hash = ?1 AND owner_account_id IS NULL')
      .bind(await hashToken(claimToken)).first<any>();
    if (!claim) throw new Error('This listing has already been saved to an account or the invitation is invalid.');
    claimLinkId = claim.id;
  }
  const token = randomToken();
  const now = new Date().toISOString();
  const expiresAt = claimLinkId ? '9999-12-31T23:59:59.999Z' : new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await env.DB.prepare(`INSERT INTO seller_login_tokens (token_hash, email, claim_link_id, terms_version, privacy_version, expires_at, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`).bind(await hashToken(token), email, claimLinkId, claimLinkId ? TERMS_VERSION : null, claimLinkId ? PRIVACY_VERSION : null, expiresAt, now).run();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error('Seller sign-in email is not configured yet.');
  const action = claimLinkId ? 'save your delivery link and open your seller account' : 'sign in to your seller account';
  const timing = claimLinkId ? 'This one-time account confirmation link does not expire.' : 'This secure sign-in link expires in 30 minutes.';
  await sendEmail(env, email, claimLinkId ? 'Confirm your Bolt Point seller account' : 'Your secure Bolt Point seller sign-in link', `Confirm your email to ${action}:\n\n${APP_URL}/api/seller-auth/verify?token=${token}\n\n${timing} After you click it, we will automatically open your seller workspace with all saved listings.\n\nIf you did not request this, you can ignore this email.`, `seller-login-${await hashToken(token)}`);
  return json({ success: true, message: `Email sent to ${email}. ${claimLinkId ? 'Your one-time account confirmation link will not expire.' : 'Open the secure sign-in link within 30 minutes.'}` });
}

async function verifySellerLogin(request: Request, env: Env) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const tokenHash = await hashToken(token);
  const now = new Date().toISOString();
  const login = await env.DB.prepare('SELECT * FROM seller_login_tokens WHERE token_hash = ?1 AND used_at IS NULL AND expires_at > ?2').bind(tokenHash, now).first<any>();
  if (!login) return Response.redirect(`${APP_URL}/?seller_auth=expired`, 302);
  let account = await env.DB.prepare('SELECT * FROM seller_accounts WHERE email = ?1').bind(login.email).first<any>();
  if (!account) {
    const source = login.claim_link_id ? await env.DB.prepare('SELECT data FROM seller_links WHERE id = ?1').bind(login.claim_link_id).first<any>() : null;
    const link = source ? JSON.parse(source.data) as SellerDeliveryLink : null;
    const id = `SA-${randomToken(12)}`;
    await env.DB.prepare('INSERT INTO seller_accounts (id, email, name, phone, email_verified_at, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5, ?5)')
      .bind(id, login.email, link?.sellerName || '', link?.sellerPhone || '', now).run();
    account = { id, email: login.email, name: link?.sellerName || '', phone: link?.sellerPhone || '' };
  } else {
    await env.DB.prepare('UPDATE seller_accounts SET email_verified_at = ?1, updated_at = ?1 WHERE id = ?2').bind(now, account.id).run();
  }
  if (login.claim_link_id) {
    const source = await env.DB.prepare('SELECT data FROM seller_links WHERE id = ?1').bind(login.claim_link_id).first<any>();
    const claimedLink = source ? JSON.parse(source.data) as SellerDeliveryLink : null;
    if (claimedLink && (!account.name || !account.phone)) {
      const name = account.name || claimedLink.sellerName || '';
      const phone = account.phone || claimedLink.sellerPhone || '';
      await env.DB.prepare('UPDATE seller_accounts SET name = ?1, phone = ?2, updated_at = ?3 WHERE id = ?4').bind(name, phone, now, account.id).run();
      account = { ...account, name, phone };
    }
    await env.DB.prepare('UPDATE seller_links SET owner_account_id = ?1, claim_token_hash = NULL, claim_expires_at = NULL WHERE id = ?2 AND owner_account_id IS NULL').bind(account.id, login.claim_link_id).run();
    await env.DB.prepare('INSERT INTO legal_acceptances (id, account_id, terms_version, privacy_version, accepted_at) VALUES (?1, ?2, ?3, ?4, ?5)')
      .bind(`LA-${randomToken(12)}`, account.id, login.terms_version, login.privacy_version, now).run();
  }
  await env.DB.prepare('UPDATE seller_login_tokens SET used_at = ?1 WHERE token_hash = ?2').bind(now, tokenHash).run();
  const sessionToken = randomToken();
  await env.DB.prepare('INSERT INTO seller_sessions (token_hash, account_id, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(await hashToken(sessionToken), account.id, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), now).run();
  return new Response(null, { status: 302, headers: { location: `${APP_URL}/?seller_account=verified`, 'set-cookie': `${SESSION_COOKIE}=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=${PREFIX}; Max-Age=31536000` } });
}

async function sellerAccountRoutes(request: Request, env: Env, path: string) {
  if (request.method === 'POST' && path === '/api/seller-auth/request-link') return requestSellerLogin(request, env);
  if (request.method === 'GET' && path === '/api/seller-auth/verify') return verifySellerLogin(request, env);
  if (request.method === 'POST' && path === '/api/seller-auth/logout') return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json', 'set-cookie': `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=${PREFIX}; Max-Age=0` } });
  const account = await authenticatedAccount(request, env);
  if (request.method === 'GET' && path === '/api/seller/me') {
    if (!account) return json({ error: 'Sign in required.' }, 401);
    const result = await env.DB.prepare('SELECT data, status, views_count FROM seller_links WHERE owner_account_id = ?1 ORDER BY created_at DESC').bind(account.id).all<any>();
    return json({ ...account, links: (result.results || []).map((row) => ({ ...JSON.parse(row.data), status: row.status, viewsCount: row.views_count })) });
  }
  const match = path.match(/^\/api\/seller\/links\/(SL-\d{6})$/i);
  if (request.method === 'PATCH' && match) {
    if (!account) return json({ error: 'Sign in required.' }, 401);
    const input = await request.json() as any;
    const row = await env.DB.prepare('SELECT data, status FROM seller_links WHERE id = ?1 AND owner_account_id = ?2').bind(match[1].toUpperCase(), account.id).first<any>();
    if (!row) return json({ error: 'Link not found.' }, 404);
    const editableFields = ['itemTitle', 'itemType', 'askingPrice', 'itemDescription', 'sellerName', 'sellerPhone', 'sellerEmail', 'pickupAvailability', 'pickupInstructions', 'pickupGateCode', 'payer'];
    const hasListingEdits = editableFields.some((field) => Object.prototype.hasOwnProperty.call(input, field));
    if (row.status === 'Booked' && (hasListingEdits || input.status)) return json({ error: 'This listing is locked because a buyer has completed checkout.' }, 409);
    const status = input.status === undefined ? row.status : input.status;
    if (!['Active', 'Paused', 'Expired'].includes(status)) return json({ error: 'Invalid link status.' }, 400);
    const current = JSON.parse(row.data) as SellerDeliveryLink;
    const data: any = { ...current, status };
    const requiredText: Record<string, number> = { itemTitle: 140, sellerName: 100, sellerPhone: 30 };
    for (const [field, maxLength] of Object.entries(requiredText)) {
      if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
      const value = String(input[field] || '').trim().slice(0, maxLength);
      if (!value) return json({ error: `${field === 'itemTitle' ? 'Item title' : field === 'sellerName' ? 'Seller name' : 'Seller phone'} is required.` }, 400);
      data[field] = value;
    }
    const optionalText: Record<string, number> = { itemDescription: 1000, sellerEmail: 254, pickupAvailability: 300, pickupInstructions: 500, pickupGateCode: 100 };
    for (const [field, maxLength] of Object.entries(optionalText)) {
      if (Object.prototype.hasOwnProperty.call(input, field)) data[field] = String(input[field] || '').trim().slice(0, maxLength) || undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, 'askingPrice')) {
      const price = input.askingPrice === '' || input.askingPrice == null ? undefined : Number(input.askingPrice);
      if (price !== undefined && (!Number.isFinite(price) || price < 0 || price > 1000000)) return json({ error: 'Enter a valid asking price.' }, 400);
      data.askingPrice = price;
    }
    if (Object.prototype.hasOwnProperty.call(input, 'itemType')) {
      const itemTypes = ['Sofa', 'Sectional', 'Dining Table', 'Mattress', 'Desk', 'Dresser', 'Appliance', 'Exercise Equipment', 'Other'];
      if (!itemTypes.includes(input.itemType)) return json({ error: 'Invalid item category.' }, 400);
      data.itemType = input.itemType;
    }
    if (Object.prototype.hasOwnProperty.call(input, 'payer')) {
      if (!['buyer_pays', 'seller_pays', 'split_50_50'].includes(input.payer)) return json({ error: 'Invalid delivery payment model.' }, 400);
      data.payer = input.payer;
    }
    await env.DB.prepare('UPDATE seller_links SET status = ?1, data = ?2 WHERE id = ?3 AND owner_account_id = ?4').bind(status, JSON.stringify(data), match[1].toUpperCase(), account.id).run();
    return json(data);
  }
  return null;
}

async function sellerRoutes(request: Request, env: Env, path: string) {
  if (request.method === 'POST' && path === '/api/seller-links') return createSellerLink(request, env);
  if (request.method === 'GET' && path === '/api/seller-links') return json({ error: 'Sign in required.' }, 401);
  const routeMatch = path.match(/^\/api\/seller-links\/(SL-\d{6})\/calculate-distance$/i);
  if (request.method === 'POST' && routeMatch) {
    const { destination } = await request.json() as any;
    if (!isFullStreetAddress(destination)) return json({ success: false, error: 'Enter a full delivery street address, including city, state, and ZIP code.' }, 400);
    const stored = await env.DB.prepare('SELECT data, status FROM seller_links WHERE id = ?1').bind(routeMatch[1].toUpperCase()).first<any>();
    if (!stored || stored.status !== 'Active') return json({ error: 'This seller link is not active.' }, 404);
    const link = JSON.parse(stored.data) as SellerDeliveryLink;
    const route = await calculateRoadRoute(env, link.exactPickupAddress!, destination);
    return json({ success: true, miles: route.miles, durationMinutes: route.durationMinutes, duration: route.duration, destinationFormatted: route.destinationFormatted, source: 'google_routes' });
  }
  const match = path.match(/^\/api\/seller-links\/(SL-\d{6})(\/view)?$/i);
  if (!match) return null;
  if (request.method === 'POST' && match[2] === '/view') {
    await env.DB.prepare('UPDATE seller_links SET views_count = views_count + 1 WHERE id = ?1').bind(match[1].toUpperCase()).run();
    return json({ success: true });
  }
  const row = await env.DB.prepare('SELECT data, views_count, status FROM seller_links WHERE id = ?1').bind(match[1].toUpperCase()).first<any>();
  return row && row.status === 'Active' ? json({ ...publicSellerLink(JSON.parse(row.data)), viewsCount: row.views_count, status: row.status }) : json({ error: 'Seller link not found or inactive.' }, 404);
}

async function api(request: Request, env: Env, path: string) {
  try {
    const accountResponse = await sellerAccountRoutes(request, env, path);
    if (accountResponse) return accountResponse;
  } catch (error) {
    return json({ error: errorMessage(error) }, 400);
  }
  const sellerResponse = await sellerRoutes(request, env, path);
  if (sellerResponse) return sellerResponse;
  const sellerConfirmationMatch = path.match(/^\/api\/orders\/(BPL-[A-Z0-9]+)\/seller-confirm$/);
  if (request.method === 'GET' && sellerConfirmationMatch) {
    const token = new URL(request.url).searchParams.get('token') || '';
    const row = await env.DB.prepare('SELECT session_id FROM dispatch_orders WHERE order_number = ?1 AND seller_confirmation_token_hash = ?2').bind(sellerConfirmationMatch[1], await hashToken(token)).first<any>();
    if (!row) return Response.redirect(`${APP_URL}/?seller_confirmation=invalid`, 302);
    const action = `${PREFIX}/api/orders/${encodeURIComponent(sellerConfirmationMatch[1])}/seller-confirm`;
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm pickup availability</title><style>body{margin:0;background:#f8fafc;color:#0f172a;font-family:system-ui,sans-serif}.card{max-width:560px;margin:5vh auto;padding:28px;border:1px solid #dbeafe;border-radius:24px;background:white;box-shadow:0 18px 45px #0f172a18}h1{margin:0 0 12px;font-size:26px}p{line-height:1.55;color:#475569}.order{margin:18px 0;padding:12px;border-radius:12px;background:#eff6ff;color:#1d4ed8;font-weight:800}label{display:block;margin:14px 0 6px;font-weight:700}input{box-sizing:border-box;width:100%;padding:13px;border:1px solid #cbd5e1;border-radius:12px;font:inherit}button{width:100%;margin-top:20px;border:0;border-radius:14px;padding:15px;background:#f97316;color:white;font-size:16px;font-weight:800;cursor:pointer}</style></head><body><main class="card"><h1>Let’s confirm pickup availability</h1><p>Confirm the item is still available and unchanged, then offer at least two pickup windows. The buyer will choose from these options; BoltPoint will confirm the final time before dispatch.</p><div class="order">Order ${sellerConfirmationMatch[1]}</div><form method="post" action="${action}"><input type="hidden" name="token" value="${token}"><label>Pickup option 1</label><input required type="datetime-local" name="window"><label>Pickup option 2</label><input required type="datetime-local" name="window"><label>Pickup option 3 (optional)</label><input type="datetime-local" name="window"><button type="submit">Confirm Item &amp; Send Availability</button></form></main></body></html>`, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" },
    });
  }
  if (request.method === 'POST' && sellerConfirmationMatch) {
    const form = await request.formData();
    const token = String(form.get('token') || '');
    const row = await env.DB.prepare('SELECT session_id, booking_snapshot FROM dispatch_orders WHERE order_number = ?1 AND seller_confirmation_token_hash = ?2').bind(sellerConfirmationMatch[1], await hashToken(token)).first<any>();
    if (!row) return Response.redirect(`${APP_URL}/?seller_confirmation=invalid`, 302);
    const windows = form.getAll('window').map(String).filter(Boolean).filter((value) => !Number.isNaN(Date.parse(value)) && Date.parse(value) > Date.now()).slice(0, 3);
    if (windows.length < 2) return new Response('Please provide at least two future pickup windows.', { status: 400 });
    const now = new Date().toISOString();
    const buyerToken = randomToken();
    await env.DB.prepare(`UPDATE dispatch_orders SET seller_confirmation_status = 'confirmed', seller_confirmed_at = ?2, seller_confirmation_token_hash = NULL, seller_availability_windows = ?3, buyer_selection_token_hash = ?4, scheduling_status = 'awaiting_buyer', status = 'awaiting_schedule', updated_at = ?2 WHERE session_id = ?1`).bind(row.session_id, now, JSON.stringify(windows), await hashToken(buyerToken)).run();
    await recordOrderEvent(env, row.session_id, 'seller_availability_submitted', 'seller', { windows }, now);
    const booking = JSON.parse(row.booking_snapshot) as CheckoutBooking;
    const buyerUrl = `${APP_URL}/api/orders/${encodeURIComponent(sellerConfirmationMatch[1])}/buyer-schedule?token=${buyerToken}`;
    await sendEmail(env, booking.customerEmail, `Choose your delivery window for ${sellerConfirmationMatch[1]}`, `The seller confirmed the item and pickup availability. Choose a window here:\n${buyerUrl}\n\nBoltPoint dispatch will contact both parties to confirm the final pickup and delivery timing.`, `${row.session_id}-buyer-schedule`, `<h2>The seller is ready</h2><p>Choose one of the seller’s available pickup windows. BoltPoint dispatch will then contact both parties to confirm the final timing.</p><p><a style="display:inline-block;padding:14px 20px;border-radius:12px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700" href="${buyerUrl}">Choose My Delivery Window</a></p>`);
    return Response.redirect(`${APP_URL}/?seller_confirmation=availability-sent`, 302);
  }
  const buyerScheduleMatch = path.match(/^\/api\/orders\/(BPL-[A-Z0-9]+)\/buyer-schedule$/);
  if (buyerScheduleMatch && request.method === 'GET') {
    const token = new URL(request.url).searchParams.get('token') || '';
    const row = await env.DB.prepare('SELECT seller_availability_windows FROM dispatch_orders WHERE order_number = ?1 AND buyer_selection_token_hash = ?2 AND scheduling_status = ?3').bind(buyerScheduleMatch[1], await hashToken(token), 'awaiting_buyer').first<any>();
    if (!row) return new Response('This scheduling link is invalid or has already been used.', { status: 410 });
    const windows = JSON.parse(row.seller_availability_windows || '[]') as string[];
    const choices = windows.map((window, index) => `<label><input required type="radio" name="window" value="${escapeHtml(window)}"> <span>${escapeHtml(new Date(window).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }))}</span></label>`).join('');
    const action = `${PREFIX}/api/orders/${encodeURIComponent(buyerScheduleMatch[1])}/buyer-schedule`;
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Choose delivery window</title><style>body{margin:0;background:#f8fafc;color:#0f172a;font-family:system-ui,sans-serif}.card{max-width:560px;margin:6vh auto;padding:28px;border-radius:24px;background:white;box-shadow:0 18px 45px #0f172a18}label{display:flex;gap:10px;margin:12px 0;padding:15px;border:1px solid #cbd5e1;border-radius:12px}button{width:100%;margin-top:18px;border:0;border-radius:14px;padding:15px;background:#2563eb;color:white;font-size:16px;font-weight:800}</style></head><body><main class="card"><h1>Choose your delivery window</h1><p>Select a window that works for you. Dispatch will contact both you and the seller to confirm the exact pickup and arrival timing.</p><form method="post" action="${action}"><input type="hidden" name="token" value="${token}">${choices}<button>Send My Selection</button></form></main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" } });
  }
  if (buyerScheduleMatch && request.method === 'POST') {
    const form = await request.formData();
    const token = String(form.get('token') || '');
    const selected = String(form.get('window') || '');
    const row = await env.DB.prepare('SELECT session_id, seller_availability_windows FROM dispatch_orders WHERE order_number = ?1 AND buyer_selection_token_hash = ?2 AND scheduling_status = ?3').bind(buyerScheduleMatch[1], await hashToken(token), 'awaiting_buyer').first<any>();
    const available = row ? JSON.parse(row.seller_availability_windows || '[]') as string[] : [];
    if (!row || !available.includes(selected)) return new Response('This scheduling selection is invalid or has already been used.', { status: 410 });
    const now = new Date().toISOString();
    await env.DB.prepare(`UPDATE dispatch_orders SET selected_delivery_window = ?2, buyer_selection_token_hash = NULL, scheduling_status = 'ready_to_schedule', status = 'ready_to_schedule', updated_at = ?3 WHERE session_id = ?1`).bind(row.session_id, selected, now).run();
    await recordOrderEvent(env, row.session_id, 'buyer_window_selected', 'buyer', { selectedWindow: selected }, now);
    if (env.BUSINESS_EMAIL) await sendEmail(env, env.BUSINESS_EMAIL, `Ready to schedule: ${buyerScheduleMatch[1]}`, `Buyer and seller availability now align for ${new Date(selected).toLocaleString('en-US')}. Open the protected admin dashboard to verify and release the order to Shipday.`, `${row.session_id}-ready-to-schedule`);
    return Response.redirect(`${APP_URL}/?schedule=received`, 302);
  }
  if (path === '/api/admin/overview' && request.method === 'GET') {
    const email = adminEmail(request, env);
    if (!email) return json({ error: 'Administrator access required.' }, 403);
    const orders = await env.DB.prepare(`SELECT session_id, order_number, status, amount_cents, seller_confirmation_status, scheduling_status, selected_delivery_window, seller_confirmed_at, pickup_status, pickup_report, delivery_report, shipday_order_id, error, created_at, updated_at FROM dispatch_orders ORDER BY created_at DESC LIMIT 250`).all<any>();
    const accounts = await env.DB.prepare('SELECT COUNT(*) AS total FROM seller_accounts').first<any>();
    const links = await env.DB.prepare(`SELECT status, COUNT(*) AS total FROM seller_links GROUP BY status`).all<any>();
    return json({ admin: email, sellerAccounts: Number(accounts?.total || 0), listingCounts: links.results || [], orders: orders.results || [] });
  }
  const scheduleMatch = path.match(/^\/api\/admin\/orders\/(BPL-[A-Z0-9]+)\/confirm-schedule$/);
  if (scheduleMatch && request.method === 'POST') {
    const email = adminEmail(request, env);
    if (!email) return json({ error: 'Administrator access required.' }, 403);
    const row = await env.DB.prepare(`SELECT session_id FROM dispatch_orders WHERE order_number = ?1 AND scheduling_status = 'ready_to_schedule'`).bind(scheduleMatch[1]).first<any>();
    if (!row) return json({ error: 'This order is not ready to schedule.' }, 409);
    const now = new Date().toISOString();
    await env.DB.prepare(`UPDATE dispatch_orders SET scheduling_status = 'confirmed', schedule_confirmed_at = ?2, status = 'pending', updated_at = ?2 WHERE session_id = ?1`).bind(row.session_id, now).run();
    await recordOrderEvent(env, row.session_id, 'schedule_confirmed', email, {}, now);
    const stripe = stripeClient(env);
    if (!stripe) return json({ error: 'Checkout is not configured.' }, 503);
    const result = await fulfillPaidSession(env, await stripe.checkout.sessions.retrieve(row.session_id));
    return json({ success: true, dispatchStatus: result.status, shipdayOrderId: result.shipdayOrderId });
  }
  const pickupMatch = path.match(/^\/api\/admin\/orders\/(BPL-[A-Z0-9]+)\/pickup-report$/);
  if (pickupMatch && request.method === 'POST') {
    const email = adminEmail(request, env);
    if (!email) return json({ error: 'Administrator access required.' }, 403);
    const body = await request.json() as any;
    if (!['matches', 'minor_discrepancy', 'materially_different', 'unavailable'].includes(body.result)) return json({ error: 'Select a valid pickup inspection result.' }, 400);
    const row = await env.DB.prepare('SELECT session_id, pickup_pin_hash FROM dispatch_orders WHERE order_number = ?1').bind(pickupMatch[1]).first<any>();
    if (!row) return json({ error: 'Order not found.' }, 404);
    if (!body.pickupPin || await hashToken(String(body.pickupPin)) !== row.pickup_pin_hash) return json({ error: 'The seller pickup PIN is incorrect.' }, 403);
    const report = { result: body.result, notes: String(body.notes || '').slice(0, 1500), photos: Array.isArray(body.photos) ? body.photos.slice(0, 8) : [], inspectedBy: email, inspectedAt: new Date().toISOString() };
    const pickupStatus = body.result === 'matches' || body.result === 'minor_discrepancy' ? 'approved' : 'paused';
    await env.DB.prepare('UPDATE dispatch_orders SET pickup_status = ?2, pickup_report = ?3, updated_at = ?4 WHERE session_id = ?1').bind(row.session_id, pickupStatus, JSON.stringify(report), report.inspectedAt).run();
    await recordOrderEvent(env, row.session_id, 'pickup_inspection', email, report, report.inspectedAt, false);
    return json({ success: true, pickupStatus });
  }
  if (request.method === 'GET' && path.startsWith('/api/images/')) {
    const object = await env.IMAGES.get(path.slice('/api/images/'.length));
    return object ? new Response(object.body, { headers: { 'content-type': object.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', etag: object.httpEtag || '' } }) : new Response('Not found', { status: 404 });
  }
  if (request.method === 'GET' && path === '/api/health') return json({ status: 'ok', maps: Boolean(env.GOOGLE_MAPS_API_KEY), stripe: Boolean(env.STRIPE_SECRET_KEY), shipday: Boolean(env.SHIPDAY_API_KEY), email: Boolean(env.RESEND_API_KEY), storage: true });
  if (request.method === 'POST' && path === '/api/address-suggestions') {
    try {
      const { input, sessionToken } = await request.json() as any;
      const query = required(input, 'Address').slice(0, 200);
      if (query.length < 3) return json({ suggestions: [] });
      return json({ suggestions: await googleAddressSuggestions(env, query, sessionToken) });
    } catch (error) { return json({ error: errorMessage(error) }, 422); }
  }
  if (request.method === 'POST' && path === '/api/address-details') {
    try {
      const { placeId, sessionToken } = await request.json() as any;
      return json(await googleAddressDetails(env, required(placeId, 'Place ID'), sessionToken));
    } catch (error) { return json({ error: errorMessage(error) }, 422); }
  }
  if (request.method === 'POST' && path === '/api/calculate-distance') {
    const { origin, destination } = await request.json() as any;
    if (!isFullStreetAddress(origin) || !isFullStreetAddress(destination)) return json({ success: false, error: 'Enter both full street addresses, including city, state, and ZIP code.' }, 400);
    try { return json({ success: true, ...(await calculateRoadRoute(env, origin, destination)), source: 'google_routes', isOpenStreetMapVerified: true }); }
    catch (error) { return json({ success: false, error: errorMessage(error) }, 422); }
  }
  const stripe = stripeClient(env);
  if (request.method === 'POST' && path === '/api/create-checkout-session') {
    if (!stripe) return json({ error: 'Online checkout is not configured yet.' }, 503);
    try {
      const input = await request.json() as CheckoutBooking;
      const quote = input.quote as QuoteInput;
      let pickupAddress = quote.pickupZip;
      let sellerLink: SellerDeliveryLink | null = null;
      if (input.sellerLinkId) {
        const stored = await env.DB.prepare('SELECT data, status FROM seller_links WHERE id = ?1').bind(input.sellerLinkId.toUpperCase()).first<any>();
        if (!stored || stored.status !== 'Active') throw new Error('This seller link is no longer active.');
        sellerLink = JSON.parse(stored.data);
        if (!sellerLink!.sellerEmail) throw new Error('The seller must add an email address before buyers can book this listing.');
        pickupAddress = sellerLink!.exactPickupAddress!;
      }
      if (!isFullStreetAddress(pickupAddress) || !isFullStreetAddress(quote.deliveryZip)) throw new Error('Complete pickup and delivery addresses are required.');
      const route = await calculateRoadRoute(env, pickupAddress, quote.deliveryZip);
      const verifiedQuote = calculateQuote({ ...quote, accurateMiles: route.miles, drivingDuration: route.duration, isOpenStreetMapVerified: true });
      if (sellerLink && (input.buyerAcceptedListingCondition !== true || input.buyerAcceptedDeliveryTerms !== true)) throw new Error('Review and accept the item condition and delivery terms before checkout.');
      const booking = { ...input, pickupAddress, sellerName: sellerLink?.sellerName || input.sellerName, sellerPhone: sellerLink?.sellerPhone || input.sellerPhone, itemPhotos: [], listingSnapshot: sellerLink || undefined, quote: { ...quote, pickupZip: pickupAddress }, quoteResult: verifiedQuote } as CheckoutBooking;
      required(booking.customerName, 'Customer name'); required(booking.customerPhone, 'Customer phone'); required(booking.customerEmail, 'Customer email');
      const payout = driverPayout(verifiedQuote.vehicleTypeRecommended, verifiedQuote.estimatedMiles);
      const session = await stripe.checkout.sessions.create({
        mode: 'payment', customer_email: booking.customerEmail,
        line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: Math.round(verifiedQuote.totalPrice * 100), product_data: { name: `${booking.quote.itemType} delivery`, description: `${verifiedQuote.estimatedMiles} miles · ${verifiedQuote.vehicleTypeRecommended}` } } }],
        metadata: { ...toMetadata(booking), driver_payout: String(payout) }, payment_intent_data: { metadata: { service: 'marketplace_delivery', driver_payout: String(payout) } },
        success_url: `${APP_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${APP_URL}/?checkout=cancelled`,
      });
      return json({ url: session.url });
    } catch (error) { return json({ error: errorMessage(error) }, 400); }
  }
  if (request.method === 'GET' && path.startsWith('/api/checkout-session/')) {
    if (!stripe) return json({ error: 'Checkout is not configured.' }, 503);
    try {
      const session = await stripe.checkout.sessions.retrieve(path.split('/').pop()!);
      if (session.payment_status !== 'paid') return json({ paid: false, orderNumber: `BPL-${session.id.slice(-10).toUpperCase()}`, booking: fromMetadata(session.metadata || {}) });
      try { const result = await fulfillPaidSession(env, session); return json({ paid: true, dispatchStatus: result.status, shipdayOrderId: result.shipdayOrderId, orderNumber: result.orderNumber, booking: result.booking }); }
      catch (error) { return json({ paid: true, dispatchStatus: 'failed', dispatchError: errorMessage(error), orderNumber: `BPL-${session.id.slice(-10).toUpperCase()}`, booking: fromMetadata(session.metadata || {}) }); }
    }
    catch { return json({ error: 'Checkout session not found.' }, 404); }
  }
  if (request.method === 'POST' && path === '/api/stripe/webhook') {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) return new Response('Webhook is not configured.', { status: 503 });
    try {
      const signature = request.headers.get('stripe-signature');
      if (!signature) throw new Error('Missing Stripe signature.');
      const event = await stripe.webhooks.constructEventAsync(await request.text(), signature, env.STRIPE_WEBHOOK_SECRET);
      if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
        await fulfillPaidSession(env, event.data.object);
      }
      return json({ received: true });
    } catch (error) { return new Response(errorMessage(error), { status: 400 }); }
  }
  return json({ error: 'Not found.' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === PREFIX) return Response.redirect(`${url.origin}${PREFIX}/${url.search}`, 308);
    if (!url.pathname.startsWith(`${PREFIX}/`)) return new Response('Not found', { status: 404 });
    const path = url.pathname.slice(PREFIX.length) || '/';
    if (path.startsWith('/api/')) return api(request, env, path);
    const assetUrl = new URL(request.url); assetUrl.pathname = path;
    const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
    const headers = new Headers(assetResponse.headers);
    const contentType = headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      headers.set('cache-control', 'no-cache, no-store, must-revalidate');
      headers.set('pragma', 'no-cache');
      headers.set('expires', '0');
    } else if (path.startsWith('/assets/')) {
      headers.set('cache-control', 'public, max-age=31536000, immutable');
    }
    return new Response(assetResponse.body, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
  },
};

