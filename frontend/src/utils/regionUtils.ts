/**
 * regionUtils.ts — Northern Morocco (Tanger-Tetouan-Al Hoceima) Geo-Fencing
 */

// Approximate bounding box for Tanger-Tetouan-Al Hoceima region
const NORTH_MOROCCO_BOUNDS = {
  minLat: 34.6, // South of Larache/Ouazzane
  maxLat: 36.1, // North of Tanger
  minLng: -6.2, // West of Tanger/Larache (Atlantic)
  maxLng: -3.7  // East of Al Hoceima
};

/**
 * Checks if a coordinate is within the Northern Morocco region.
 */
export const isInsideNorthMorocco = (lat: number, lng: number): boolean => {
  return (
    lat >= NORTH_MOROCCO_BOUNDS.minLat &&
    lat <= NORTH_MOROCCO_BOUNDS.maxLat &&
    lng >= NORTH_MOROCCO_BOUNDS.minLng &&
    lng <= NORTH_MOROCCO_BOUNDS.maxLng
  );
};

export const REGION_NAME = "Tanger-Tétouan-Al Hoceima";
