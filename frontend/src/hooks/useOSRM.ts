import { useState, useCallback } from 'react';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
const OSRM_DEBOUNCE_MS = 2000;

export const useOSRM = () => {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<string>('0');
  const [etaMin, setEtaMin] = useState<number>(0);
  const [nextInstruction, setNextInstruction] = useState<string>('');
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchRoute = useCallback(async (from: [number, number], to: [number, number]) => {
    const now = Date.now();
    if (now - lastFetchTime < OSRM_DEBOUNCE_MS) return;
    
    setLastFetchTime(now);

    try {
      // OSRM expects coordinates in lng,lat format
      const url = `${OSRM_BASE}/${from[1]},${from[0]};${to[1]},${to[0]}?geometries=geojson&overview=full&steps=true`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code === 'Ok' && data.routes?.[0]) {
        const routeData = data.routes[0];
        // Convert GeoJSON coords (lng, lat) to Leaflet format (lat, lng)
        const newRoute = routeData.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
        setRoute(newRoute);
        setDistanceKm((routeData.distance / 1000).toFixed(1));
        setEtaMin(Math.round(routeData.duration / 60));
        
        // Extract the next instruction if available
        if (routeData.legs?.[0]?.steps?.[0]?.maneuver?.instruction) {
          setNextInstruction(routeData.legs[0].steps[0].maneuver.instruction);
        } else {
          setNextInstruction('Continue on route');
        }
      }
    } catch (err) {
      console.error('OSRM fetch error:', err);
    }
  }, [lastFetchTime]);

  return { route, distanceKm, etaMin, nextInstruction, fetchRoute };
};
