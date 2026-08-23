import { SellerDeliveryLink, ItemCategory } from '../types';
import { KNOWN_COORDINATES } from './zipCoordinates';

const SELLER_LINKS_KEY = 'md_seller_delivery_links_db';

/**
 * Creates a safe, friendly masked location representation for public display.
 * Prevents buyers from seeing house/building numbers, street names, or apartment numbers.
 */
export function generateMaskedLocationString(address: string, zip: string, cityState: string): string {
  const cleanZip = (zip || '').trim().slice(0, 5);
  let areaName = cityState || 'Austin, TX';

  if (cleanZip && KNOWN_COORDINATES[cleanZip]) {
    areaName = KNOWN_COORDINATES[cleanZip].name;
  }

  return `${areaName} (${cleanZip}) • Verified Seller Location (Exact address protected)`;
}

// Initial realistic demo links for demonstration
const INITIAL_DEMO_LINKS: SellerDeliveryLink[] = [
  {
    id: 'SL-789210',
    sellerName: 'Elena Rostova',
    sellerPhone: '(512) 555-9382',
    sellerEmail: 'elena.r@example.com',
    itemTitle: 'West Elm 3-Piece Haven Sectional (Oatmeal Fabric)',
    itemType: 'Sectional',
    askingPrice: 850,
    itemDescription: 'Immaculate condition, non-smoking & pet-free home. Must be picked up by Friday.',
    itemPhotos: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    ],
    exactPickupAddress: '2401 South Lamar Blvd, Apt 314, Austin, TX 78704',
    pickupZip: '78704',
    pickupCityState: 'Austin, TX',
    pickupGateCode: '#4912',
    pickupInstructions: 'Elevator access available in building B. Call 10 mins prior.',
    pickupAvailability: 'Weekdays after 4:00 PM, Weekends 9:00 AM - 6:00 PM',
    payer: 'buyer_pays',
    isAddressMasked: true,
    maskedDisplayLocation: 'South Congress / Zilker, Austin, TX (78704) • Verified Seller Location (Exact address protected)',
    status: 'Active',
    createdAt: '2026-08-22T14:30:00Z',
    viewsCount: 6,
  },
  {
    id: 'SL-492104',
    sellerName: 'Marcus Bennett',
    sellerPhone: '(512) 555-3341',
    sellerEmail: 'm.bennett@example.com',
    itemTitle: 'Solid Reclaimed Wood 8-Person Dining Table + 6 Chairs',
    itemType: 'Dining Table',
    askingPrice: 600,
    itemDescription: 'Heavy solid wood dining set. Disassembled legs ready in garage for easy loading.',
    itemPhotos: [
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80',
    ],
    exactPickupAddress: '812 Colorado St, Unit 12B, Austin, TX 78701',
    pickupZip: '78701',
    pickupCityState: 'Austin, TX',
    pickupGateCode: 'Call box 012',
    pickupInstructions: 'Freight elevator reserved, load directly from loading bay.',
    pickupAvailability: 'Any day between 10:00 AM - 7:00 PM',
    payer: 'buyer_pays',
    isAddressMasked: true,
    maskedDisplayLocation: 'Downtown Austin, TX (78701) • Verified Seller Location (Exact address protected)',
    status: 'Booked',
    createdAt: '2026-08-20T10:15:00Z',
    viewsCount: 14,
  },
];

/**
 * Retrieve all seller delivery links from localStorage (or initial seed)
 */
export function getSellerDeliveryLinks(): SellerDeliveryLink[] {
  try {
    const raw = localStorage.getItem(SELLER_LINKS_KEY);
    if (!raw) {
      localStorage.setItem(SELLER_LINKS_KEY, JSON.stringify(INITIAL_DEMO_LINKS));
      return INITIAL_DEMO_LINKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse seller links from localStorage', e);
    return INITIAL_DEMO_LINKS;
  }
}

/**
 * Retrieve a specific seller link by ID
 */
export function getSellerDeliveryLinkById(id: string): SellerDeliveryLink | null {
  const all = getSellerDeliveryLinks();
  const found = all.find((l) => l.id.toLowerCase() === id.toLowerCase());
  return found || null;
}

/**
 * Save a newly created seller delivery link
 */
export function createSellerDeliveryLink(data: {
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string;
  itemTitle: string;
  itemType: ItemCategory;
  askingPrice?: number;
  itemDescription?: string;
  itemPhotos: string[];
  exactPickupAddress: string;
  pickupZip: string;
  pickupCityState?: string;
  pickupGateCode?: string;
  pickupInstructions?: string;
  pickupAvailability?: string;
  payer?: 'buyer_pays' | 'seller_pays' | 'split_50_50';
}): SellerDeliveryLink {
  const id = 'SL-' + Math.floor(100000 + Math.random() * 900000);
  const cityState = data.pickupCityState || 'Austin, TX';
  const maskedDisplay = generateMaskedLocationString(data.exactPickupAddress, data.pickupZip, cityState);

  const newLink: SellerDeliveryLink = {
    id,
    sellerName: data.sellerName,
    sellerPhone: data.sellerPhone,
    sellerEmail: data.sellerEmail,
    itemTitle: data.itemTitle,
    itemType: data.itemType,
    askingPrice: data.askingPrice,
    itemDescription: data.itemDescription,
    itemPhotos: data.itemPhotos,
    exactPickupAddress: data.exactPickupAddress,
    pickupZip: data.pickupZip,
    pickupCityState: cityState,
    pickupGateCode: data.pickupGateCode,
    pickupInstructions: data.pickupInstructions,
    pickupAvailability: data.pickupAvailability || 'Flexible daytime pickup',
    payer: data.payer || 'buyer_pays',
    isAddressMasked: true,
    maskedDisplayLocation: maskedDisplay,
    status: 'Active',
    createdAt: new Date().toISOString(),
    viewsCount: 0,
  };

  const existing = getSellerDeliveryLinks();
  existing.unshift(newLink);
  try {
    localStorage.setItem(SELLER_LINKS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save seller link to localStorage', e);
  }

  return newLink;
}

/**
 * Increment view counter for a link
 */
export function incrementSellerLinkViews(id: string): void {
  const all = getSellerDeliveryLinks();
  const updated = all.map((link) => {
    if (link.id.toLowerCase() === id.toLowerCase()) {
      return { ...link, viewsCount: (link.viewsCount || 0) + 1 };
    }
    return link;
  });
  try {
    localStorage.setItem(SELLER_LINKS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update views count', e);
  }
}

/**
 * Mark a seller link as Booked once a buyer completes payment/scheduling
 */
export function markSellerLinkAsBooked(id: string): void {
  const all = getSellerDeliveryLinks();
  const updated = all.map((link) => {
    if (link.id.toLowerCase() === id.toLowerCase()) {
      return { ...link, status: 'Booked' as const };
    }
    return link;
  });
  try {
    localStorage.setItem(SELLER_LINKS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update status', e);
  }
}

/**
 * Generates the full shareable URL to send to a customer on Facebook Marketplace, OfferUp, Craigslist, or SMS
 */
export function generateShareableSellerUrl(link: SellerDeliveryLink): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marketplacedelivery.app';
  const basePath = import.meta.env.BASE_URL;
  return `${origin}${basePath}?seller_link=${link.id}`;
}

const sellerApi = (path = '') => `${import.meta.env.BASE_URL}api/seller-links${path}`;

export async function createSellerDeliveryLinkRemote(data: Parameters<typeof createSellerDeliveryLink>[0]): Promise<SellerDeliveryLink> {
  try {
    const response = await fetch(sellerApi(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to create seller link.');
    return result;
  } catch (error) {
    if (import.meta.env.DEV) return createSellerDeliveryLink(data);
    throw error;
  }
}

export async function getSellerDeliveryLinksRemote(): Promise<SellerDeliveryLink[]> {
  try {
    const response = await fetch(sellerApi());
    if (!response.ok) throw new Error('Unable to load seller links.');
    return response.json();
  } catch (error) {
    if (import.meta.env.DEV) return getSellerDeliveryLinks();
    throw error;
  }
}

export async function getSellerDeliveryLinkByIdRemote(id: string): Promise<SellerDeliveryLink | null> {
  try {
    const response = await fetch(sellerApi(`/${encodeURIComponent(id)}`));
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Unable to load this seller link.');
    return response.json();
  } catch (error) {
    if (import.meta.env.DEV) return getSellerDeliveryLinkById(id);
    throw error;
  }
}

export async function incrementSellerLinkViewsRemote(id: string): Promise<void> {
  try {
    await fetch(sellerApi(`/${encodeURIComponent(id)}/view`), { method: 'POST' });
  } catch {
    if (import.meta.env.DEV) incrementSellerLinkViews(id);
  }
}
