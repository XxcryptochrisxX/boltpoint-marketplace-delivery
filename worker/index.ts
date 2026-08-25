import Stripe from 'stripe';
import { calculateQuote } from '../src/lib/pricing';
import { isFullStreetAddress } from '../src/lib/addressValidation';
import type { BookingDetails, QuoteInput, SellerDeliveryLink } from '../src/types';

interface D1Result<T = unknown> { results?: T[] }
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
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
}

type CheckoutBooking = Omit<BookingDetails, 'id' | 'createdAt' | 'status'>;
const PREFIX = '/marketplacedelivery';
const APP_URL = 'https://boltpointlogistics.com/marketplacedelivery';
const TERMS_VERSION = '2026-08-24';
const PRIVACY_VERSION = '2026-08-24';
const SESSION_COOKIE = 'bpl_seller_session';

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

async function sendEmail(env: Env, to: string, subject: string, text: string, key: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`Email failed (${response.status}).`);
}

async function dispatchToShipday(env: Env, booking: CheckoutBooking, orderNumber: string, amount: number) {
  if (!env.SHIPDAY_API_KEY) throw new Error('SHIPDAY_API_KEY is not configured.');
  const response = await fetch('https://api.shipday.com/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${env.SHIPDAY_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber, customerName: booking.customerName, customerAddress: booking.deliveryAddress,
      customerEmail: booking.customerEmail, customerPhoneNumber: booking.customerPhone,
      restaurantName: booking.sellerName, restaurantAddress: booking.pickupAddress,
      restaurantPhoneNumber: booking.sellerPhone || env.BUSINESS_PHONE,
      expectedDeliveryDate: booking.preferredDeliveryDate,
      orderItem: [{ name: booking.itemDescription || booking.quote.itemType, unitPrice: amount, quantity: 1 }],
      deliveryFee: amount, totalOrderCost: amount, paymentMethod: 'credit_card',
      pickupInstruction: booking.specialNotes || '',
      deliveryInstruction: `Vehicle: ${booking.quoteResult.vehicleTypeRecommended}. Paid online.`,
      orderSource: 'Bolt Point Marketplace Delivery', additionalId: orderNumber,
    }),
  });
  if (!response.ok) throw new Error(`Shipday failed (${response.status}).`);
  return response.json() as Promise<{ orderId?: string }>;
}

interface GoogleAddress { lat: number; lng: number; displayName: string }
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
  return { lat: location.latitude, lng: location.longitude, displayName: data.result.address.formattedAddress };
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
    .bind(id, JSON.stringify(link), 'Active', link.createdAt, await hashToken(claimToken), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()).run();
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
    const claim = await env.DB.prepare('SELECT id FROM seller_links WHERE claim_token_hash = ?1 AND claim_expires_at > ?2 AND owner_account_id IS NULL')
      .bind(await hashToken(claimToken), new Date().toISOString()).first<any>();
    if (!claim) throw new Error('This save-link invitation is invalid or expired.');
    claimLinkId = claim.id;
  }
  const token = randomToken();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO seller_login_tokens (token_hash, email, claim_link_id, terms_version, privacy_version, expires_at, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`).bind(await hashToken(token), email, claimLinkId, claimLinkId ? TERMS_VERSION : null, claimLinkId ? PRIVACY_VERSION : null, new Date(Date.now() + 15 * 60 * 1000).toISOString(), now).run();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error('Seller sign-in email is not configured yet.');
  const action = claimLinkId ? 'save your delivery link and open your seller account' : 'sign in to your seller account';
  await sendEmail(env, email, claimLinkId ? 'Confirm your Bolt Point seller account' : 'Your secure Bolt Point seller sign-in link', `Confirm your email to ${action}:\n\n${APP_URL}/api/seller-auth/verify?token=${token}\n\nThis secure link expires in 15 minutes. After you click it, we will automatically open your seller workspace with your saved listings.\n\nIf you did not request this, you can ignore this email.`, `seller-login-${await hashToken(token)}`);
  return json({ success: true, message: `Confirmation email sent to ${email}. Open it within 15 minutes to continue.` });
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
    await env.DB.prepare('UPDATE seller_links SET owner_account_id = ?1, claim_token_hash = NULL, claim_expires_at = NULL WHERE id = ?2 AND owner_account_id IS NULL').bind(account.id, login.claim_link_id).run();
    await env.DB.prepare('INSERT INTO legal_acceptances (id, account_id, terms_version, privacy_version, accepted_at) VALUES (?1, ?2, ?3, ?4, ?5)')
      .bind(`LA-${randomToken(12)}`, account.id, login.terms_version, login.privacy_version, now).run();
  }
  await env.DB.prepare('UPDATE seller_login_tokens SET used_at = ?1 WHERE token_hash = ?2').bind(now, tokenHash).run();
  const sessionToken = randomToken();
  await env.DB.prepare('INSERT INTO seller_sessions (token_hash, account_id, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(await hashToken(sessionToken), account.id, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), now).run();
  return new Response(null, { status: 302, headers: { location: `${APP_URL}/?seller_account=verified`, 'set-cookie': `${SESSION_COOKIE}=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=${PREFIX}; Max-Age=2592000` } });
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
    const { status } = await request.json() as any;
    if (!['Active', 'Paused', 'Expired'].includes(status)) return json({ error: 'Invalid link status.' }, 400);
    const row = await env.DB.prepare('SELECT data FROM seller_links WHERE id = ?1 AND owner_account_id = ?2').bind(match[1].toUpperCase(), account.id).first<any>();
    if (!row) return json({ error: 'Link not found.' }, 404);
    const data = { ...JSON.parse(row.data), status };
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
    return json({ success: true, ...(await calculateRoadRoute(env, link.exactPickupAddress!, destination)), source: 'google_routes' });
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
        pickupAddress = sellerLink!.exactPickupAddress!;
      }
      if (!isFullStreetAddress(pickupAddress) || !isFullStreetAddress(quote.deliveryZip)) throw new Error('Complete pickup and delivery addresses are required.');
      const route = await calculateRoadRoute(env, pickupAddress, quote.deliveryZip);
      const verifiedQuote = calculateQuote({ ...quote, accurateMiles: route.miles, drivingDuration: route.duration, isOpenStreetMapVerified: true });
      const booking = { ...input, pickupAddress, sellerName: sellerLink?.sellerName || input.sellerName, sellerPhone: sellerLink?.sellerPhone || input.sellerPhone, itemPhotos: [], quote: { ...quote, pickupZip: pickupAddress }, quoteResult: verifiedQuote } as CheckoutBooking;
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
    try { const session = await stripe.checkout.sessions.retrieve(path.split('/').pop()!); return json({ paid: session.payment_status === 'paid', orderNumber: `BPL-${session.id.slice(-10).toUpperCase()}`, booking: fromMetadata(session.metadata || {}) }); }
    catch { return json({ error: 'Checkout session not found.' }, 404); }
  }
  if (request.method === 'POST' && path === '/api/stripe/webhook') {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) return new Response('Webhook is not configured.', { status: 503 });
    try {
      const signature = request.headers.get('stripe-signature');
      if (!signature) throw new Error('Missing Stripe signature.');
      const event = await stripe.webhooks.constructEventAsync(await request.text(), signature, env.STRIPE_WEBHOOK_SECRET);
      if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
        const session = event.data.object, booking = fromMetadata(session.metadata || {}), orderNumber = `BPL-${session.id.slice(-10).toUpperCase()}`, amount = (session.amount_total || 0) / 100;
        const shipday = await dispatchToShipday(env, booking, orderNumber, amount);
        if (booking.sellerLinkId) await env.DB.prepare('UPDATE seller_links SET status = ?1 WHERE id = ?2').bind('Booked', booking.sellerLinkId).run();
        const summary = `Delivery ${orderNumber} is paid and sent to dispatch.\nPickup: ${booking.pickupAddress}\nDelivery: ${booking.deliveryAddress}\nTotal: $${amount.toFixed(2)}`;
        await Promise.all([sendEmail(env, booking.customerEmail, `Delivery confirmed: ${orderNumber}`, summary, `${event.id}-customer`), env.BUSINESS_EMAIL ? sendEmail(env, env.BUSINESS_EMAIL, `New paid delivery: ${orderNumber}`, `${summary}\nShipday order: ${shipday.orderId || 'created'}`, `${event.id}-business`) : undefined]);
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
    return env.ASSETS.fetch(new Request(assetUrl, request));
  },
};
