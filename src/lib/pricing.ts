import { ItemCategory, QuoteInput, QuoteResult } from '../types';
import { estimateRoadDrivingMiles } from './zipCoordinates';

/**
 * Isolated Pricing Engine for Marketplace Delivery
 * Easy to update base rates, distance multipliers, stair surcharges, and assembly fees.
 */

// Recommended vehicle per item type
const RECOMMENDED_VEHICLES: Record<ItemCategory, 'Pickup Truck' | 'Cargo Van' | 'Box Truck'> = {
  'Sofa': 'Pickup Truck',
  'Sectional': 'Box Truck',
  'Dining Table': 'Pickup Truck',
  'Mattress': 'Cargo Van',
  'Desk': 'Cargo Van',
  'Dresser': 'Cargo Van',
  'Appliance': 'Pickup Truck',
  'Exercise Equipment': 'Cargo Van',
  'Other': 'Pickup Truck',
};

// Surcharge rates
export const PER_STAIR_FLIGHT_FEE = 15; // charged if no elevator
export const ASSEMBLY_FEE = 35;
export const RUSH_DELIVERY_FEE = 40;
export const COST_PER_ESTIMATED_MILE = 2.20;
export const INCLUDED_MILES = 10;
export const BASE_DELIVERY_PRICE = 69;

/**
 * Synchronous distance calculation between two ZIP codes / locations in miles.
 * Uses accurate geodetic coordinates + driving factor when accurateMiles is not yet resolved.
 */
function calculateEstimatedMiles(pickupZip: string, deliveryZip: string): number {
  if (!pickupZip || !deliveryZip) return 6.5;
  const res = estimateRoadDrivingMiles(pickupZip, deliveryZip);
  return res.miles;
}

/**
 * Main quote calculation function
 */
export function calculateQuote(input: QuoteInput): QuoteResult {
  const basePrice = BASE_DELIVERY_PRICE;
  
  // Use resolved accurate Google mileage if present, otherwise calculate via geodetic engine
  const miles = typeof input.accurateMiles === 'number' && input.accurateMiles > 0
    ? input.accurateMiles
    : calculateEstimatedMiles(input.pickupZip, input.deliveryZip);
  
  const excessMiles = Math.max(0, miles - INCLUDED_MILES);
  const distanceFee = Math.round(excessMiles * COST_PER_ESTIMATED_MILE * 100) / 100;
  
  // Stairs fee applies per flight if no elevator present
  let stairsFee = 0;
  if (!input.elevator && input.stairs > 0) {
    stairsFee = input.stairs * PER_STAIR_FLIGHT_FEE;
  }

  const assemblyFee = input.assemblyNeeded ? ASSEMBLY_FEE : 0;
  const rushFee = input.rushDelivery ? RUSH_DELIVERY_FEE : 0;

  const totalPrice = basePrice + distanceFee + stairsFee + assemblyFee + rushFee;

  // Estimate delivery speed & arrival window
  let timeEst = '1 - 2 Hours';
  if (input.rushDelivery) {
    timeEst = 'Express (Under 90 Mins)';
  } else if (miles > 30) {
    timeEst = '2.5 - 4 Hours';
  } else if (miles > 15) {
    timeEst = '2 - 3 Hours';
  } else if (miles > 8) {
    timeEst = '1.5 - 2.5 Hours';
  }

  return {
    basePrice,
    distanceFee,
    stairsFee,
    assemblyFee,
    rushFee,
    totalPrice: Math.round(totalPrice * 100) / 100,
    estimatedMiles: miles,
    drivingDuration: input.drivingDuration || `${Math.max(Math.round((miles / 28) * 60) + 4, 8)} mins`,
    isOpenStreetMapVerified: Boolean(input.isOpenStreetMapVerified),
    routeSource: input.isOpenStreetMapVerified ? 'google_routes' : 'openstreetmap_geodesic',
    estimatedDeliveryTime: timeEst,
    vehicleTypeRecommended: RECOMMENDED_VEHICLES[input.itemType] || 'Pickup Truck',
  };
}

/**
 * Formats currency safely
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
