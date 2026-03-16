// simple in-memory cache to prevent spamming the geocoding API
const addressCache = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * Rounds a coordinate to a specific degree resolution to create a geographic "grid".
 * 0.0003 degrees = approx 33 meter precision at the equator.
 */
function roundCoordinate(coord, resolution = 0.0003) {
  // To avoid floating point artifact issues, multiply before rounding
  return Math.round(coord / resolution) * resolution;
}

/**
 * Reverse geocodes lat/lng to a human-readable address string.
 * Uses completely free OpenStreetMap Nominatim.
 * Employs a local grid-cache to prevent API spam and rate-limits.
 */
export async function getAddressFromCoordinates(lat, lng) {
  if (!lat || !lng || (lat === 0 && lng === 0)) return 'Unknown location';

  // Create a grid key by rounding the coordinates
  const roundedLat = roundCoordinate(lat);
  const roundedLng = roundCoordinate(lng);
  const cacheKey = `${roundedLat},${roundedLng}`;

  // Check LRU Cache
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  try {
    // OpenStreetMap Nominatim API requires a custom User-Agent to comply with their TOS
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'ReactTrackerApp/1.0 (internal-dashboard)',
        },
      }
    );

    if (!response.ok) throw new Error('Geocoding request failed');

    const data = await response.json();
    let displayAddress = 'Unknown location';

    if (data && data.address) {
      // Build a sensible street address format from OSM data
      const road = data.address.road || data.address.pedestrian || data.address.path || '';
      const suburb = data.address.suburb || data.address.neighbourhood || data.address.city_district || '';
      const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
      const state = data.address.state || '';

      const parts = [road, suburb, city].filter(Boolean);
      if (parts.length > 0) {
        // e.g. "Main St, Downtown, Metropolis"
        displayAddress = parts.join(', ');
      } else if (state) {
        displayAddress = state;
      }
    }

    // Maintain Cache Limit
    if (addressCache.size >= MAX_CACHE_SIZE) {
      // Evict oldest item (Map keeps insertion order)
      const oldestKey = addressCache.keys().next().value;
      addressCache.delete(oldestKey);
    }

    // Save to Cache
    addressCache.set(cacheKey, displayAddress);
    return displayAddress;

  } catch (error) {
    console.error('Reverse Geocoding Error:', error);
    return 'Location unavailable';
  }
}
