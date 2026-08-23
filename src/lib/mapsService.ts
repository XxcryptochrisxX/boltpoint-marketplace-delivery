/**
 * Google-validated address and driving-route calculation service.
 * The API key remains on the server and is never exposed to the browser.
 */

import { KNOWN_COORDINATES } from './zipCoordinates';

export interface DistanceCalculationResult {
  miles: number;
  durationMinutes: number;
  durationFormatted: string;
  source: 'google_routes' | 'openstreetmap_osrm' | 'openstreetmap_geodesic';
  originFormatted: string;
  destinationFormatted: string;
  isOpenStreetMapVerified: boolean;
  distanceFee: number;
}

// In-memory cache for fast responsive lookups
const distanceCache = new Map<string, DistanceCalculationResult>();

export const COST_PER_MILE = 2.20;

/**
 * Normalizes input address or ZIP code for display and routing
 */
export function formatLocationName(input: string): string {
  const clean = input.trim();
  if (!clean) return 'Enter location';
  
  const zipMatch = clean.match(/^\d{5}$/);
  if (zipMatch && KNOWN_COORDINATES[zipMatch[0]]) {
    return `${clean} (${KNOWN_COORDINATES[zipMatch[0]].name})`;
  }
  return clean;
}

/**
 * Calculates validated mileage and driving duration through the server.
 */
export async function getAccurateDeliveryDistance(
  origin: string,
  destination: string
): Promise<DistanceCalculationResult> {
  const cleanOrigin = origin.trim();
  const cleanDest = destination.trim();

  if (!cleanOrigin || !cleanDest) {
    return {
      miles: 6.5,
      durationMinutes: 18,
      durationFormatted: '18 mins',
      source: 'openstreetmap_geodesic',
      originFormatted: cleanOrigin || 'Pickup',
      destinationFormatted: cleanDest || 'Delivery',
      isOpenStreetMapVerified: true,
      distanceFee: Math.round(6.5 * COST_PER_MILE),
    };
  }

  const cacheKey = `${cleanOrigin.toLowerCase()}_to_${cleanDest.toLowerCase()}`;
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  // Query the backend Google Address Validation + Routes proxy.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(`${import.meta.env.BASE_URL}api/calculate-distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: cleanOrigin,
        destination: cleanDest,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.success && typeof data.miles === 'number' && data.miles > 0) {
        const result: DistanceCalculationResult = {
          miles: data.miles,
          durationMinutes: data.durationMinutes || Math.round((data.miles / 28) * 60) + 5,
          durationFormatted: data.duration || `${data.durationMinutes || 15} mins`,
          source: data.source === 'google_routes' ? 'google_routes' : data.source === 'openstreetmap_osrm' ? 'openstreetmap_osrm' : 'openstreetmap_geodesic',
          originFormatted: data.originFormatted || formatLocationName(cleanOrigin),
          destinationFormatted: data.destinationFormatted || formatLocationName(cleanDest),
          isOpenStreetMapVerified: true,
          distanceFee: Math.round(data.miles * COST_PER_MILE),
        };
        distanceCache.set(cacheKey, result);
        return result;
      }
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Unable to verify the driving route for these addresses.');
  } catch (err) {
    console.error('Accurate route calculation failed:', err);
    throw err instanceof Error ? err : new Error('Unable to verify the driving route. Please check both addresses.');
  }
}
