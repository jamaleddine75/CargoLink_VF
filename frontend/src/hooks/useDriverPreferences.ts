import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import driverService from '@/services/api/driverService';

export interface DriverPreferences {
  autoAccept: boolean;
  notifications: boolean;
  sound: boolean;
  googleMaps: boolean;
  darkMap: boolean;
  updatedAt?: string;
}

const DEFAULT_PREFS: DriverPreferences = {
  autoAccept: false,
  notifications: true,
  sound: true,
  googleMaps: true,
  darkMap: true,
};

const PREFS_KEY = 'driver:prefs';

export const useDriverPreferences = () => {
  // 1. Initialize from localStorage
  const [prefs, setPrefs] = useState<DriverPreferences>(() => {
    const saved = localStorage.getItem(PREFS_KEY);
    return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
  });

  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 2. Sync from API on mount
  useEffect(() => {
    const syncPrefs = async () => {
      try {
        const serverPrefs = await driverService.getPreferences();
        if (serverPrefs) {
          const localUpdated = prefs.updatedAt ? new Date(prefs.updatedAt).getTime() : 0;
          const serverUpdated = serverPrefs.updatedAt ? new Date(serverPrefs.updatedAt).getTime() : 1;

          if (serverUpdated >= localUpdated) {
            setPrefs(serverPrefs);
            localStorage.setItem(PREFS_KEY, JSON.stringify(serverPrefs));
          }
        }
      } catch (err) {
        console.error('Failed to sync preferences from server', err);
      }
    };
    syncPrefs();
  }, []);

  // 3. Update function
  const updatePreference = useCallback((key: keyof DriverPreferences, value: any) => {
    // Immediate local update
    setPrefs(prev => {
      const next = { ...prev, [key]: value, updatedAt: new Date().toISOString() };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });

    // Show "Saving..." spinner for 1s (UI feedback)
    setIsSaving(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setIsSaving(prev => ({ ...prev, [key]: false }));
    }, 1000);

    // Debounced API call
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        // We get the latest prefs from state by using a functional update pattern in our mind, 
        // but here we just take the one we just updated locally.
        const currentPrefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
        await driverService.updatePreferences(currentPrefs);
      } catch (err) {
        console.error('Failed to update preferences on server', err);
      }
    }, 300); // 300ms debounce as requested
  }, []);

  // Expose specific values and update function
  return {
    ...prefs,
    isSaving,
    update: updatePreference
  };
};
