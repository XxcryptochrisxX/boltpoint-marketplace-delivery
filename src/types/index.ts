export type ItemCategory =
  | 'Sofa'
  | 'Sectional'
  | 'Dining Table'
  | 'Mattress'
  | 'Desk'
  | 'Dresser'
  | 'Appliance'
  | 'Exercise Equipment'
  | 'Other';

export interface QuoteInput {
  pickupZip: string;
  deliveryZip: string;
  itemType: ItemCategory;
  stairs: number; // 0, 1, 2, 3+
  elevator: boolean;
  assemblyNeeded: boolean;
  rushDelivery: boolean;
  accurateMiles?: number;
  drivingDuration?: string;
  isOpenStreetMapVerified?: boolean;
}

export interface QuoteResult {
  basePrice: number;
  distanceFee: number;
  stairsFee: number;
  assemblyFee: number;
  rushFee: number;
  totalPrice: number;
  estimatedMiles: number;
  drivingDuration?: string;
  isOpenStreetMapVerified?: boolean;
  routeSource?: 'google_routes' | 'openstreetmap_osrm' | 'openstreetmap_geodesic';
  estimatedDeliveryTime: string; // e.g., "1.5 - 2.5 hours"
  vehicleTypeRecommended: 'Pickup Truck' | 'Cargo Van' | 'Box Truck';
}

export interface SellerDeliveryLink {
  id: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string;
  itemTitle: string;
  itemType: ItemCategory;
  askingPrice?: number;
  itemDescription?: string;
  itemPhotos: string[];
  conditionRating?: 'Excellent' | 'Good' | 'Fair' | 'Needs Repair';
  knownDefects?: string;
  hasStainsOrOdors?: boolean;
  hasPetExposure?: boolean;
  hasSmokeExposure?: boolean;
  hasStructuralDamage?: boolean;
  hasMissingPieces?: boolean;
  hasElectricalComponents?: boolean;
  dimensions?: string;
  conditionCertifiedAt?: string;
  exactPickupAddress?: string;
  pickupZip: string;
  pickupCityState: string;
  pickupGateCode?: string;
  pickupInstructions?: string;
  pickupAvailability?: string;
  payer: 'buyer_pays' | 'seller_pays' | 'split_50_50';
  isAddressMasked: boolean;
  maskedDisplayLocation: string;
  status: 'Active' | 'Booked' | 'Paused' | 'Expired';
  createdAt: string;
  viewsCount: number;
}

export interface CreatedSellerDeliveryLink extends SellerDeliveryLink {
  claimToken?: string;
}

export interface SellerAccount {
  id: string;
  email: string;
  name: string;
  phone: string;
  links: SellerDeliveryLink[];
}

export interface BookingDetails {
  id?: string;
  sellerLinkId?: string;
  isSellerLinkBooking?: boolean;
  maskedPickupLocation?: string;
  quote: QuoteInput;
  quoteResult: QuoteResult;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupAddress: string;
  deliveryAddress: string;
  sellerName: string;
  sellerPhone: string;
  itemDescription: string;
  preferredDeliveryDate: string;
  preferredDeliveryTimeSlot: string;
  itemPhotos: string[];
  specialNotes?: string;
  buyerAcceptedListingCondition?: boolean;
  buyerAcceptedDeliveryTerms?: boolean;
  listingSnapshot?: SellerDeliveryLink;
  status: 'Pending' | 'Driver Assigned' | 'En Route' | 'Picked Up' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

export type VehicleType = 'Pickup Truck' | 'Cargo Van' | 'Box Truck' | 'Trailer';

export interface DriverApplication {
  id?: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  hasInsurance: boolean;
  insuranceDocName?: string;
  driverLicenseName?: string;
  citiesServed: string[];
  daysAvailable: string[];
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  appliedAt: string;
}

export interface BusinessPartnerLead {
  id?: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: 'Furniture Store' | 'Estate Sales' | 'Consignment Store' | 'Apartment Community' | 'Interior Designer' | 'Storage Facility' | 'Property Manager' | 'Other';
  estimatedMonthlyDeliveries: string;
  city: string;
  notes?: string;
  submittedAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Pricing & Billing' | 'Delivery & Setup' | 'Sellers & Pickup' | 'Safety & Insurance' | 'For Drivers' | 'For Businesses';
}

export interface DriverJob {
  id: string;
  itemType: ItemCategory;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedMiles: number;
  payout: number;
  date: string;
  timeSlot: string;
  status: 'Available' | 'Accepted' | 'En Route' | 'Completed';
  buyerName: string;
  buyerPhone: string;
  sellerName: string;
  notes?: string;
}

export type ViewMode =
  | 'home'
  | 'how-it-works'
  | 'pricing'
  | 'become-driver'
  | 'businesses'
  | 'about'
  | 'faq'
  | 'contact'
  | 'get-quote'
  | 'book-now'
  | 'for-sellers'
  | 'seller-account'
  | 'customer-dashboard'
  | 'driver-dashboard'
  | 'admin-dashboard'
  | 'privacy'
  | 'terms'
  | 'refund-policy';
