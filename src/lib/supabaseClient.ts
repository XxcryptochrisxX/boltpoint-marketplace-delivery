import { BookingDetails, DriverApplication, BusinessPartnerLead } from '../types';
import { markSellerLinkAsBooked } from './sellerLinkService';

/**
 * Supabase client configuration wrapper.
 * Prepared for live Supabase integration, with automatic localStorage fallback for live UI demo.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Helper keys for local storage simulation
const STORAGE_KEYS = {
  BOOKINGS: 'md_bookings_db',
  DRIVER_APPS: 'md_driver_apps_db',
  BUSINESS_LEADS: 'md_business_leads_db',
};

/**
 * Save a new booking into Supabase / local database format
 */
export async function saveBooking(bookingData: Omit<BookingDetails, 'id' | 'createdAt' | 'status'>): Promise<BookingDetails> {
  const newBooking: BookingDetails = {
    ...bookingData,
    id: 'BK-' + Math.floor(100000 + Math.random() * 900000),
    createdAt: new Date().toISOString(),
    status: 'Pending',
  };

  // If this booking came from a seller link, mark that link as booked
  if (bookingData.sellerLinkId) {
    markSellerLinkAsBooked(bookingData.sellerLinkId);
  }

  if (isSupabaseConfigured) {
    try {
      // Prepared code for Supabase insert:
      // const { data, error } = await supabase.from('bookings').insert([newBooking]).select();
      // if (error) throw error;
      // return data[0];
    } catch (err) {
      console.warn('Supabase insert failed, falling back to local store:', err);
    }
  }

  // Fallback to localStorage
  const existingStr = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  const existing: BookingDetails[] = existingStr ? JSON.parse(existingStr) : [];
  existing.unshift(newBooking);
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(existing));

  return newBooking;
}

/**
 * Retrieve all saved bookings
 */
export function getSavedBookings(): BookingDetails[] {
  const existingStr = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  if (!existingStr) {
    // Seed initial demo booking for instant dashboard feedback
    const sampleBooking: BookingDetails = {
      id: 'BK-849201',
      quote: {
        pickupZip: '78701',
        deliveryZip: '78704',
        itemType: 'Sofa',
        stairs: 1,
        elevator: false,
        assemblyNeeded: true,
        rushDelivery: false,
      },
      quoteResult: {
        basePrice: 59,
        distanceFee: 14,
        stairsFee: 15,
        assemblyFee: 35,
        rushFee: 0,
        totalPrice: 123,
        estimatedMiles: 6.2,
        estimatedDeliveryTime: '1 - 2 Hours',
        vehicleTypeRecommended: 'Pickup Truck',
      },
      customerName: 'Alex Morgan',
      customerPhone: '(512) 555-0144',
      customerEmail: 'alex.m@example.com',
      pickupAddress: '742 Evergreen Terrace, Austin, TX 78701',
      deliveryAddress: '310 Oakwood Ave, Austin, TX 78704',
      sellerName: 'David Miller (FB Marketplace)',
      sellerPhone: '(512) 555-0182',
      itemDescription: 'Grey Velvet Mid-Century 3-Seater Sofa in great condition.',
      preferredDeliveryDate: '2026-07-24',
      preferredDeliveryTimeSlot: '2:00 PM - 3:00 PM',
      itemPhotos: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'],
      specialNotes: 'Please call seller 30 mins before arrival.',
      status: 'Driver Assigned',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([sampleBooking]));
    return [sampleBooking];
  }
  return JSON.parse(existingStr);
}

/**
 * Save driver application
 */
export async function saveDriverApplication(appData: Omit<DriverApplication, 'id' | 'appliedAt' | 'status'>): Promise<DriverApplication> {
  const newApp: DriverApplication = {
    ...appData,
    id: 'DRV-' + Math.floor(10000 + Math.random() * 90000),
    appliedAt: new Date().toISOString(),
    status: 'Submitted',
  };

  const existingStr = localStorage.getItem(STORAGE_KEYS.DRIVER_APPS);
  const existing: DriverApplication[] = existingStr ? JSON.parse(existingStr) : [];
  existing.unshift(newApp);
  localStorage.setItem(STORAGE_KEYS.DRIVER_APPS, JSON.stringify(existing));

  return newApp;
}

/**
 * Get all driver applications
 */
export function getSavedDriverApplications(): DriverApplication[] {
  const existingStr = localStorage.getItem(STORAGE_KEYS.DRIVER_APPS);
  return existingStr ? JSON.parse(existingStr) : [];
}

/**
 * Save Business Lead
 */
export async function saveBusinessLead(leadData: Omit<BusinessPartnerLead, 'id' | 'submittedAt'>): Promise<BusinessPartnerLead> {
  const newLead: BusinessPartnerLead = {
    ...leadData,
    id: 'BIZ-' + Math.floor(10000 + Math.random() * 90000),
    submittedAt: new Date().toISOString(),
  };

  const existingStr = localStorage.getItem(STORAGE_KEYS.BUSINESS_LEADS);
  const existing: BusinessPartnerLead[] = existingStr ? JSON.parse(existingStr) : [];
  existing.unshift(newLead);
  localStorage.setItem(STORAGE_KEYS.BUSINESS_LEADS, JSON.stringify(existing));

  return newLead;
}

/**
 * Get all Business Leads
 */
export function getSavedBusinessLeads(): BusinessPartnerLead[] {
  const existingStr = localStorage.getItem(STORAGE_KEYS.BUSINESS_LEADS);
  return existingStr ? JSON.parse(existingStr) : [];
}
