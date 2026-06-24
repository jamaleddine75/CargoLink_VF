/**
 * geoUtils.ts — Logistics Geospatial Utilities
 */

/**
 * Calculates the distance between two points in kilometers using the Haversine formula.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Check if a point is within a given radius (km) from a center point.
 */
export const isWithinRadius = (
  center: { lat: number; lng: number },
  target: { lat: number; lng: number },
  radiusKm: number = 50
): boolean => {
  const distance = calculateDistance(center.lat, center.lng, target.lat, target.lng);
  return distance <= radiusKm;
};
