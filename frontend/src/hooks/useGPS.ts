import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

const haversineM = (pos1: [number, number], pos2: [number, number]) => {
  const R = 6371e3;
  const [lat1, lon1] = pos1;
  const [lat2, lon2] = pos2;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const GPS_MIN_MOVE_M = 10;
const GPS_THROTTLE_MS = 5000;

export const useGPS = () => {
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const { connected, send } = useSocket();
  const { user } = useAuth();

  // Stable refs so the watchPosition callback never stales out and the
  // effect never needs to re-run (no watchPosition teardown/restart on every update).
  const posRef = useRef<[number, number] | null>(null);
  const lastSentRef = useRef<number>(0);
  const connectedRef = useRef(connected);
  const sendRef = useRef(send);
  const userRef = useRef(user);

  useEffect(() => { connectedRef.current = connected; }, [connected]);
  useEffect(() => { sendRef.current = send; }, [send]);
  useEffect(() => { userRef.current = user; }, [user]);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];

    if (posRef.current && haversineM(posRef.current, newPos) < GPS_MIN_MOVE_M) return;

    posRef.current = newPos;
    setDriverPos(newPos);

    const now = Date.now();
    if (connectedRef.current && userRef.current?.id && now - lastSentRef.current > GPS_THROTTLE_MS) {
      sendRef.current('/app/driver.location', {
        driverId: userRef.current.id,
        lat: newPos[0],
        lng: newPos[1],
        timestamp: now,
      });
      lastSentRef.current = now;
    }
  }, []); // stable — reads everything via refs

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === GeolocationPositionError.TIMEOUT) {
      // Timeout just means no update yet — not a fatal error. Ignore silently.
      return;
    }
    if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
      console.warn('[GPS] Permission denied');
      return;
    }
    console.warn('[GPS] error:', err.message);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        // Accept a cached fix up to 10 s old — avoids thrashing the GPS chip
        // and prevents timeout errors when the device hasn't moved.
        maximumAge: 10_000,
        // Long timeout: we want to wait patiently for a fix rather than error out.
        timeout: 60_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [handlePosition, handleError]); // stable callbacks → effect runs only once

  return { driverPos };
};
