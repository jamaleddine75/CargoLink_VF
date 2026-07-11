import { useState, useRef, useEffect, useCallback } from 'react';
import { reverseGeocode, GeocodingResult } from '@/services/api/geocodingService';
import { toast } from 'sonner';

interface UseReverseGeocodingProps {
  currentAddress: string;
  updateAddress: (val: string) => void;
  updateCity: (val: string) => void;
  updatePostalCode: (val: string) => void;
  updateCoordinates: (lat: number, lng: number) => void;
  allowedCities: string[];
}

export const useReverseGeocoding = ({
  currentAddress,
  updateAddress,
  updateCity,
  updatePostalCode,
  updateCoordinates,
  allowedCities
}: UseReverseGeocodingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastCoords = useRef<{ lat: number; lng: number } | null>(null);
  const currentAddressRef = useRef(currentAddress);
  const initialAddressRef = useRef(currentAddress);
  const requestIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep currentAddressRef up-to-date with form value
  useEffect(() => {
    currentAddressRef.current = currentAddress;
  }, [currentAddress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const triggerGeocoding = useCallback((lat: number, lng: number) => {
    // 1. Skip requests if coordinates haven't actually changed (tolerance of ~11cm)
    if (lastCoords.current) {
      const latDiff = Math.abs(lastCoords.current.lat - lat);
      const lngDiff = Math.abs(lastCoords.current.lng - lng);
      if (latDiff < 0.000001 && lngDiff < 0.000001) {
        return;
      }
    }
    lastCoords.current = { lat, lng };

    // 2. Instantly update marker and form coordinates to keep UI responsive
    updateCoordinates(lat, lng);

    // 3. Reset error and set geocoding loading state
    setError(null);
    setIsLoading(true);

    // 4. Capture current address state to prevent overwriting user's manual edits
    initialAddressRef.current = currentAddressRef.current;

    // 5. Debounce geocoding request (300-500ms delay) to prevent spamming
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      // 6. Concurrency and stale response protection
      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;

      // Abort any existing/outdated pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await reverseGeocode(lat, lng, controller.signal);

      // Verify if this is still the latest active request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (response.success) {
        // 7. Manual Edit Protection: if user typed in the field since geocoding started, do NOT overwrite it
        if (currentAddressRef.current !== initialAddressRef.current) {
          setIsLoading(false);
          if (import.meta.env.DEV) {
            console.log('[useReverseGeocoding] Aborted applying address to form: Manual edits detected.');
          }
          return;
        }

        const { address } = response.result;

        // Populate fields
        if (address.displayName) {
          updateAddress(address.displayName);
        }

        if (address.postcode) {
          updatePostalCode(address.postcode);
        } else {
          updatePostalCode('');
        }

        if (address.city) {
          const cleanResolvedCity = address.city
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase();

          const matchedCity = allowedCities.find(allowed => {
            const cleanAllowed = allowed
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toUpperCase();
            return cleanAllowed === cleanResolvedCity;
          });

          if (matchedCity) {
            updateCity(matchedCity);
          }
        }

        setIsLoading(false);
      } else {
        // Don't change loading state if it was canceled because a newer request is already running
        if (response.errorType === 'CANCELLED') {
          return;
        }

        setIsLoading(false);
        setError(response.message);

        // Display user-friendly notification depending on error type
        if (response.errorType === 'RATE_LIMIT') {
          toast.warning("Service de géolocalisation saturé. Saisie d'adresse manuelle activée.");
        } else {
          toast.error("Impossible de récupérer l'adresse de l'emplacement. Saisie d'adresse manuelle activée.");
        }
      }
    }, 400);
  }, [
    updateAddress,
    updateCity,
    updatePostalCode,
    updateCoordinates,
    allowedCities
  ]);

  return {
    isLoading,
    error,
    triggerGeocoding
  };
};
