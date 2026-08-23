/**
 * US ZIP Code / City Coordinate reference table and Haversine distance calculator.
 * Used for precise fallback and instant geographic verification when Google Routes API is queried or offline.
 */

// Known centroids for major metropolitan areas & common test ZIP prefixes
export const KNOWN_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  // Texas - Austin Metro
  '78701': { lat: 30.2711, lng: -97.7437, name: 'Downtown Austin, TX' },
  '78702': { lat: 30.2629, lng: -97.7196, name: 'East Austin, TX' },
  '78703': { lat: 30.2882, lng: -97.7677, name: 'Tarrytown, Austin, TX' },
  '78704': { lat: 30.2447, lng: -97.7663, name: 'South Congress / Zilker, Austin, TX' },
  '78705': { lat: 30.2921, lng: -97.7388, name: 'UT Austin Campus, TX' },
  '78745': { lat: 30.2078, lng: -97.8016, name: 'South Austin, TX' },
  '78750': { lat: 30.4158, lng: -97.8081, name: 'Northwest Austin, TX' },
  '78758': { lat: 30.3879, lng: -97.7088, name: 'North Austin / Domain, TX' },
  '78759': { lat: 30.4042, lng: -97.7554, name: 'Arboretum Austin, TX' },
  '78660': { lat: 30.4394, lng: -97.6200, name: 'Pflugerville, TX' },
  '78664': { lat: 30.5083, lng: -97.6789, name: 'Round Rock, TX' },
  '78613': { lat: 30.5056, lng: -97.8203, name: 'Cedar Park, TX' },

  // Texas - Dallas / Fort Worth Metro
  '75201': { lat: 32.7876, lng: -96.7994, name: 'Downtown Dallas, TX' },
  '75204': { lat: 32.7989, lng: -96.7924, name: 'Uptown Dallas, TX' },
  '75205': { lat: 32.8336, lng: -96.7972, name: 'Highland Park, Dallas, TX' },
  '75024': { lat: 33.0787, lng: -96.8083, name: 'Legacy West / Plano, TX' },
  '75025': { lat: 33.0781, lng: -96.7456, name: 'Plano Central, TX' },
  '75034': { lat: 33.1507, lng: -96.8236, name: 'Frisco, TX' },
  '75093': { lat: 33.0336, lng: -96.8075, name: 'West Plano, TX' },
  '76102': { lat: 32.7555, lng: -97.3308, name: 'Downtown Fort Worth, TX' },
  '75038': { lat: 32.8687, lng: -96.9632, name: 'Las Colinas / Irving, TX' },

  // Texas - Houston Metro
  '77002': { lat: 29.7568, lng: -95.3657, name: 'Downtown Houston, TX' },
  '77007': { lat: 29.7732, lng: -95.4116, name: 'Washington Ave / Memorial Houston, TX' },
  '77019': { lat: 29.7523, lng: -95.4022, name: 'River Oaks / Montrose Houston, TX' },
  '77056': { lat: 29.7482, lng: -95.4658, name: 'Galleria Houston, TX' },
  '77024': { lat: 29.7744, lng: -95.5342, name: 'Memorial / Spring Branch, TX' },
  '77478': { lat: 29.6200, lng: -95.6000, name: 'Sugar Land, TX' },
  '77380': { lat: 30.1500, lng: -95.4500, name: 'The Woodlands, TX' },

  // Texas - San Antonio
  '78205': { lat: 29.4246, lng: -98.4946, name: 'Downtown San Antonio, TX' },
  '78209': { lat: 29.4897, lng: -98.4552, name: 'Alamo Heights, TX' },
  '78258': { lat: 29.6385, lng: -98.5034, name: 'Stone Oak / San Antonio, TX' },

  // New York City Metro
  '10001': { lat: 40.7506, lng: -73.9972, name: 'Chelsea / Midtown NY' },
  '10002': { lat: 40.7157, lng: -73.9863, name: 'Lower East Side NY' },
  '10003': { lat: 40.7318, lng: -73.9892, name: 'East Village / Union Square NY' },
  '10005': { lat: 40.7060, lng: -74.0088, name: 'Financial District NY' },
  '10011': { lat: 40.7416, lng: -74.0006, name: 'Chelsea NY' },
  '10019': { lat: 40.7654, lng: -73.9857, name: "Hell's Kitchen NY" },
  '10025': { lat: 40.7983, lng: -73.9680, name: 'Upper West Side NY' },
  '11201': { lat: 40.6953, lng: -73.9933, name: 'Brooklyn Heights / DUMBO NY' },
  '11211': { lat: 40.7121, lng: -73.9542, name: 'Williamsburg Brooklyn NY' },
  '11215': { lat: 40.6672, lng: -73.9821, name: 'Park Slope Brooklyn NY' },
  '11101': { lat: 40.7447, lng: -73.9485, name: 'Long Island City Queens NY' },

  // California (Los Angeles, San Francisco, San Diego)
  '90001': { lat: 33.9736, lng: -118.2479, name: 'Los Angeles, CA' },
  '90012': { lat: 34.0614, lng: -118.2385, name: 'Downtown Los Angeles, CA' },
  '90028': { lat: 34.1016, lng: -118.3268, name: 'Hollywood, CA' },
  '90210': { lat: 34.0901, lng: -118.4065, name: 'Beverly Hills, CA' },
  '90401': { lat: 34.0150, lng: -118.4973, name: 'Santa Monica, CA' },
  '94102': { lat: 37.7792, lng: -122.4191, name: 'Civic Center San Francisco, CA' },
  '94103': { lat: 37.7726, lng: -122.4099, name: 'SoMa San Francisco, CA' },
  '94107': { lat: 37.7656, lng: -122.3920, name: 'Potrero Hill San Francisco, CA' },
  '94110': { lat: 37.7500, lng: -122.4153, name: 'Mission District San Francisco, CA' },
  '94114': { lat: 37.7588, lng: -122.4358, name: 'Castro San Francisco, CA' },
  '92101': { lat: 32.7196, lng: -117.1628, name: 'Downtown San Diego, CA' },

  // Florida (Miami, Orlando, Tampa)
  '33101': { lat: 25.7743, lng: -80.1937, name: 'Miami, FL' },
  '33139': { lat: 25.7797, lng: -80.1384, name: 'Miami Beach, FL' },
  '33130': { lat: 25.7640, lng: -80.2005, name: 'Brickell Miami, FL' },
  '32801': { lat: 28.5413, lng: -81.3789, name: 'Downtown Orlando, FL' },
  '33602': { lat: 27.9506, lng: -82.4572, name: 'Downtown Tampa, FL' },

  // Illinois (Chicago)
  '60601': { lat: 41.8864, lng: -87.6237, name: 'The Loop Chicago, IL' },
  '60611': { lat: 41.8925, lng: -87.6200, name: 'Magnificent Mile Chicago, IL' },
  '60614': { lat: 41.9227, lng: -87.6524, name: 'Lincoln Park Chicago, IL' },
  '60622': { lat: 41.9024, lng: -87.6834, name: 'Wicker Park Chicago, IL' },
  '60647': { lat: 41.9213, lng: -87.7011, name: 'Logan Square Chicago, IL' },

  // Washington (Seattle)
  '98101': { lat: 47.6101, lng: -122.3344, name: 'Downtown Seattle, WA' },
  '98102': { lat: 47.6339, lng: -122.3218, name: 'Capitol Hill Seattle, WA' },
  '98109': { lat: 47.6294, lng: -122.3486, name: 'Queen Anne / SLU Seattle, WA' },

  // Colorado (Denver)
  '80202': { lat: 39.7541, lng: -104.9972, name: 'LoDo Denver, CO' },
  '80206': { lat: 39.7346, lng: -104.9547, name: 'Cherry Creek Denver, CO' },

  // Georgia (Atlanta)
  '30303': { lat: 33.7545, lng: -84.3897, name: 'Downtown Atlanta, GA' },
  '30309': { lat: 33.7923, lng: -84.3855, name: 'Midtown Atlanta, GA' },

  // Massachusetts (Boston)
  '02108': { lat: 42.3575, lng: -71.0636, name: 'Beacon Hill Boston, MA' },
  '02116': { lat: 42.3496, lng: -71.0763, name: 'Back Bay Boston, MA' },

  // Arizona (Phoenix)
  '85004': { lat: 33.4515, lng: -112.0685, name: 'Downtown Phoenix, AZ' },
  '85251': { lat: 33.4989, lng: -111.9224, name: 'Old Town Scottsdale, AZ' },

  // Tennessee (Nashville)
  '37201': { lat: 36.1663, lng: -86.7766, name: 'Downtown Nashville, TN' },
  '37203': { lat: 36.1495, lng: -86.7937, name: 'Gulch / Midtown Nashville, TN' },
};

/**
 * Approximate coordinate estimator for arbitrary 5-digit US ZIP codes
 * using regional ZIP allocation bands when not explicitly in the lookup table.
 */
export function estimateZipCoordinates(zip: string): { lat: number; lng: number } {
  const cleanZip = zip.replace(/\D/g, '').padStart(5, '0').slice(0, 5);
  
  if (KNOWN_COORDINATES[cleanZip]) {
    return { lat: KNOWN_COORDINATES[cleanZip].lat, lng: KNOWN_COORDINATES[cleanZip].lng };
  }

  const prefix = parseInt(cleanZip.slice(0, 3), 10);
  const fullNum = parseInt(cleanZip, 10);

  // Specific metro clusters in Texas
  if (prefix >= 750 && prefix <= 754) {
    // Dallas / North Texas Metro (Plano, Frisco, Irving, Dallas)
    return { lat: 32.8 + ((fullNum % 100) * 0.003), lng: -96.8 - ((fullNum % 80) * 0.003) };
  } else if (prefix >= 760 && prefix <= 762) {
    // Fort Worth / Arlington
    return { lat: 32.7 + ((fullNum % 100) * 0.003), lng: -97.3 - ((fullNum % 80) * 0.003) };
  } else if (prefix >= 770 && prefix <= 775) {
    // Houston Metro
    return { lat: 29.75 + ((fullNum % 100) * 0.003), lng: -95.36 - ((fullNum % 80) * 0.003) };
  } else if (prefix >= 780 && prefix <= 782) {
    // San Antonio
    return { lat: 29.42 + ((fullNum % 100) * 0.003), lng: -98.49 - ((fullNum % 80) * 0.003) };
  } else if (prefix >= 786 && prefix <= 787) {
    // Austin Metro
    return { lat: 30.27 + ((fullNum % 100) * 0.003), lng: -97.74 - ((fullNum % 80) * 0.003) };
  }

  // Other US Clusters
  if (prefix >= 10 && prefix <= 27) {
    // New England (MA, RI, NH, ME, VT, CT)
    return { lat: 42.36 + ((fullNum % 100) * 0.01), lng: -71.06 - ((fullNum % 80) * 0.01) };
  } else if (prefix >= 70 && prefix <= 89) {
    // New Jersey
    return { lat: 40.22 + ((fullNum % 100) * 0.01), lng: -74.45 - ((fullNum % 60) * 0.01) };
  } else if (prefix >= 100 && prefix <= 119) {
    // New York City & Long Island
    return { lat: 40.71 + ((fullNum % 100) * 0.004), lng: -73.98 - ((fullNum % 80) * 0.004) };
  } else if (prefix >= 150 && prefix <= 196) {
    // Pennsylvania
    return { lat: 40.44 + ((fullNum % 100) * 0.01), lng: -79.99 + ((fullNum % 80) * 0.01) };
  } else if (prefix >= 300 && prefix <= 319) {
    // Georgia
    return { lat: 33.75 + ((fullNum % 100) * 0.01), lng: -84.38 - ((fullNum % 70) * 0.01) };
  } else if (prefix >= 320 && prefix <= 349) {
    // Florida
    return { lat: 26.5 + ((fullNum % 200) * 0.01), lng: -80.2 - ((fullNum % 100) * 0.01) };
  } else if (prefix >= 600 && prefix <= 629) {
    // Illinois
    return { lat: 41.88 + ((fullNum % 100) * 0.008), lng: -87.63 - ((fullNum % 80) * 0.008) };
  } else if (prefix >= 800 && prefix <= 816) {
    // Colorado
    return { lat: 39.74 + ((fullNum % 100) * 0.01), lng: -104.99 - ((fullNum % 80) * 0.01) };
  } else if (prefix >= 900 && prefix <= 930) {
    // Southern California
    return { lat: 34.05 + ((fullNum % 100) * 0.006), lng: -118.25 - ((fullNum % 80) * 0.006) };
  } else if (prefix >= 940 && prefix <= 961) {
    // Northern California / Bay Area
    return { lat: 37.77 + ((fullNum % 100) * 0.006), lng: -122.41 - ((fullNum % 80) * 0.006) };
  } else if (prefix >= 980 && prefix <= 994) {
    // Washington
    return { lat: 47.61 + ((fullNum % 100) * 0.01), lng: -122.33 - ((fullNum % 80) * 0.01) };
  }

  // General fallback
  const ratio = (fullNum - 1000) / 99000;
  const lat = 25.0 + ratio * 24.0;
  const lng = -70.0 - ratio * 54.0;
  return { lat, lng };
}

/**
 * Calculates straight-line distance in miles between two coordinate pairs using Haversine formula
 */
export function calculateHaversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Realistic driving road distance approximation (applies road winding & urban grid factor of ~1.28x)
 */
export function estimateRoadDrivingMiles(originZip: string, destZip: string): { miles: number; durationMinutes: number } {
  const coord1 = estimateZipCoordinates(originZip);
  const coord2 = estimateZipCoordinates(destZip);

  const straightMiles = calculateHaversineMiles(coord1.lat, coord1.lng, coord2.lat, coord2.lng);

  // In urban/suburban environments, driving distance is ~1.25x - 1.35x straight line distance
  let drivingMiles = straightMiles * 1.28;
  if (drivingMiles < 2.5) {
    drivingMiles = Math.max(drivingMiles, 2.5); // minimum realistic delivery leg
  }

  const roundedMiles = Math.round(drivingMiles * 10) / 10;

  // Approximate driving time in suburban/city traffic (averaging 25-35 mph + 4 min buffer)
  const durationMinutes = Math.max(Math.round((roundedMiles / 28) * 60) + 4, 8);

  return {
    miles: roundedMiles,
    durationMinutes,
  };
}
