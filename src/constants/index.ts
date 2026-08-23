import { FAQItem, DriverJob } from '../types';

export const APP_NAME = 'Marketplace Delivery';
export const APP_TAGLINE = "Buy It. We'll Bring It Home.";
export const APP_SUBTITLE = "Furniture delivery from Facebook Marketplace, OfferUp, Craigslist, estate sales, and local sellers.";

export const TRUST_BADGES = [
  { name: 'Facebook Marketplace', logoText: 'FB Marketplace' },
  { name: 'OfferUp', logoText: 'OfferUp' },
  { name: 'Craigslist', logoText: 'Craigslist' },
  { name: 'Estate Sales', logoText: 'Estate Sales' },
  { name: 'Local Retailers', logoText: 'Local Retailers' },
];

export const ITEM_CATEGORIES = [
  'Sofa',
  'Sectional',
  'Dining Table',
  'Mattress',
  'Desk',
  'Dresser',
  'Appliance',
  'Exercise Equipment',
  'Other',
] as const;

export const VEHICLE_TYPES = [
  { id: 'Pickup Truck', label: 'Pickup Truck', desc: 'Ideal for single sofas, dressers, mattresses, tables' },
  { id: 'Cargo Van', label: 'Cargo Van', desc: 'Enclosed space for weather-sensitive furniture & electronics' },
  { id: 'Box Truck', label: 'Box Truck', desc: 'For large sectionals, multiple items, or full room moves' },
  { id: 'Trailer', label: 'Trailer', desc: 'For heavy equipment, lawn machinery, or oversized haul' },
] as const;

export const BUSINESS_TARGETS = [
  {
    title: 'Furniture Stores',
    description: 'Provide instant, reliable same-day delivery to your customers without managing a fleet.',
    iconName: 'Armchair',
  },
  {
    title: 'Estate Sales',
    description: 'Help buyers clear out heavy furniture on auction day with on-site dispatch support.',
    iconName: 'Home',
  },
  {
    title: 'Consignment Stores',
    description: 'Eliminate drop-off and pickup friction for consignors and retail shoppers.',
    iconName: 'Store',
  },
  {
    title: 'Apartment Communities',
    description: 'Provide modern move-in logistics support for residents purchasing second-hand items.',
    iconName: 'Building2',
  },
  {
    title: 'Interior Designers',
    description: 'White-glove transport and room-of-choice placement for curated pieces.',
    iconName: 'Sparkles',
  },
  {
    title: 'Storage Facilities',
    description: 'Help tenant customers load, transport, and unload heavy storage contents quickly.',
    iconName: 'Boxes',
  },
  {
    title: 'Property Managers',
    description: 'Streamline bulk item relocations, resident drop-offs, and property staging.',
    iconName: 'Key',
  },
];

export const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Pricing & Billing',
    question: 'How much does delivery cost?',
    answer: 'Delivery is $69 for routes of 10 driving miles or less. For routes over 10 miles, add $2.20 for each mile beyond 10. Optional stairs, assembly, and rush services are shown separately before booking.',
  },
  {
    id: 'faq-2',
    category: 'Delivery & Setup',
    question: 'Do drivers assemble furniture?',
    answer: 'Yes! You can add Assembly Service to your booking for a small $35 flat fee. Our delivery partners carry standard toolkits and will assemble bed frames, dining tables, desks, and sectional brackets upon delivery.',
  },
  {
    id: 'faq-3',
    category: 'Sellers & Pickup',
    question: "What if the seller isn't home or delays pickup?",
    answer: 'We coordinate pickup times directly with the seller. If a seller is delayed or unavailable, our driver will notify you immediately through live updates. We allow a 15-minute grace window at pickup.',
  },
  {
    id: 'faq-4',
    category: 'Safety & Insurance',
    question: 'What happens if an item is damaged during transit?',
    answer: 'Available cargo protection depends on the assigned carrier and booking terms. Drivers document item condition at pickup and delivery; ask dispatch to confirm coverage before booking.',
  },
  {
    id: 'faq-5',
    category: 'Delivery & Setup',
    question: 'Can I schedule delivery for a future date or specific time window?',
    answer: 'Absolutely. You can schedule immediate express delivery (under 90 mins) or pick any future date and 1-hour arrival window that fits your schedule.',
  },
  {
    id: 'faq-6',
    category: 'Pricing & Billing',
    question: 'Can I tip my driver?',
    answer: 'Yes, 100% of tips go directly to your delivery partner. You can add a tip during checkout or directly through your customer tracking link after delivery.',
  },
  {
    id: 'faq-7',
    category: 'For Businesses',
    question: 'Can businesses use Marketplace Delivery?',
    answer: 'Yes! Furniture stores, consignment shops, estate sale planners, and interior designers use our Business Portal for batch dispatching, invoice billing, and white-glove customer delivery.',
  },
  {
    id: 'faq-8',
    category: 'For Drivers',
    question: 'How much do independent delivery partners earn?',
    answer: 'Drivers average $35 to $75 per delivery job depending on vehicle type and job complexity. Top full-time drivers earn $1,200+ per week with flexible self-scheduled hours.',
  },
];

export const INITIAL_DRIVER_JOBS: DriverJob[] = [
  {
    id: 'job-101',
    itemType: 'Sectional',
    pickupAddress: '742 Evergreen Terrace, Austin, TX 78701',
    deliveryAddress: '310 Oakwood Ave, Austin, TX 78704',
    estimatedMiles: 6.4,
    payout: 82,
    date: 'Today',
    timeSlot: '2:00 PM - 3:00 PM',
    status: 'Available',
    buyerName: 'Sarah Jenkins',
    buyerPhone: '(512) 555-0182',
    sellerName: 'David Miller',
    notes: 'Seller is on 1st floor. Buyer needs room-of-choice placement.',
  },
  {
    id: 'job-102',
    itemType: 'Dining Table',
    pickupAddress: '1209 West 6th St, Austin, TX 78703',
    deliveryAddress: '4501 Speedway, Austin, TX 78751',
    estimatedMiles: 11.2,
    payout: 68,
    date: 'Today',
    timeSlot: '4:30 PM - 5:30 PM',
    status: 'Available',
    buyerName: 'Alex Rivera',
    buyerPhone: '(512) 555-0199',
    sellerName: 'Estate Sale Admin',
    notes: 'Heavy solid wood dining table with 6 chairs. Assembly needed.',
  },
  {
    id: 'job-103',
    itemType: 'Sofa',
    pickupAddress: '8801 Research Blvd, Austin, TX 78758',
    deliveryAddress: '1100 S Lamar Blvd, Austin, TX 78704',
    estimatedMiles: 14.8,
    payout: 75,
    date: 'Tomorrow',
    timeSlot: '10:00 AM - 11:00 AM',
    status: 'Available',
    buyerName: 'Michael Chang',
    buyerPhone: '(512) 555-0231',
    sellerName: 'Facebook Seller (Laura)',
    notes: 'Elevator available at delivery location. Very easy access.',
  },
];

export const SAMPLE_TESTIMONIALS = [
  {
    quote: "Found a dream Article sectional on Facebook Marketplace for $300, but I drive a Honda Civic. Marketplace Delivery picked it up from the seller in 45 minutes and carried it up my 3 flights of stairs!",
    author: "Jessica M.",
    role: "Buyer in Austin, TX",
    rating: 5,
    source: "Facebook Marketplace Buyer",
  },
  {
    quote: "As an estate sale operator, buyer transport used to be our biggest bottleneck. Partnering with Marketplace Delivery boosted our weekend furniture clearance by 40%.",
    author: "Robert Thorne",
    role: "Owner, Heritage Estate Sales",
    rating: 5,
    source: "Business Partner",
  },
  {
    quote: "I drive a Ford F-150. I take 3-4 delivery jobs a day on my days off and pull in an extra $900 every weekend. The app dispatch is smooth and transparent.",
    author: "Marcus Vance",
    role: "Independent Driver Partner",
    rating: 5,
    source: "Delivery Partner",
  },
];
