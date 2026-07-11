import apiClient from '@/api/client';
import axios from 'axios';

export interface GeocodingAddress {
  displayName: string;
  road?: string;
  houseNumber?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  postcode?: string;
  state?: string;
  country?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: GeocodingAddress;
}

interface CacheEntry {
  result: GeocodingResult;
  expiryTime: number;
}

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 500;
const TTL_MS = 30 * 60 * 1000; // 30 minutes

export const buildCacheKey = (lat: number, lng: number): string => {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
};

export const normalizeCity = (city: string | undefined): string | undefined => {
  if (!city) return undefined;
  
  const clean = city
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
    
  if (clean.includes("TANGIER") || clean.includes("TANGER")) {
    return "TANGER";
  }
  if (clean.includes("TETOUAN")) {
    return "TETOUAN";
  }
  if (clean.includes("AL HOCEIMA")) {
    return "AL HOCEIMA";
  }
  if (clean.includes("MARRAKESH") || clean.includes("MARRAKECH")) {
    return "MARRAKECH";
  }
  if (clean.includes("MDIQ")) {
    return "MDIQ";
  }
  if (clean.includes("FNIDEQ")) {
    return "FNIDEQ";
  }
  if (clean.includes("CHAOUEN") || clean.includes("CHEFCHAOUEN")) {
    return "CHAOUEN";
  }
  
  return city.trim();
};

export const clearCache = (): void => {
  if (import.meta.env.DEV) {
    console.log('[Geocoding Service] Clearing cache...');
  }
  cache.clear();
};

export const getCacheStats = (): { size: number; maxCapacity: number } => {
  return {
    size: cache.size,
    maxCapacity: MAX_CACHE_SIZE
  };
};

const getFromCache = (key: string): GeocodingResult | undefined => {
  const entry = cache.get(key);
  if (!entry) return undefined;

  if (Date.now() > entry.expiryTime) {
    cache.delete(key);
    if (import.meta.env.DEV) {
      console.log(`[Geocoding Service] Cache EXPIRED for key: ${key}`);
    }
    return undefined;
  }

  // Renew insertion order (LRU)
  cache.delete(key);
  cache.set(key, entry);
  return entry.result;
};

const addToCache = (key: string, result: GeocodingResult): void => {
  if (cache.has(key)) {
    cache.delete(key);
  }
  
  cache.set(key, {
    result,
    expiryTime: Date.now() + TTL_MS
  });

  if (cache.size > MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      if (import.meta.env.DEV) {
        console.log(`[Geocoding Service] Evicting LRU item from cache: ${oldestKey}`);
      }
      cache.delete(oldestKey);
    }
  }
};

export type GeocodingResponse =
  | { success: true; result: GeocodingResult }
  | { success: false; errorType: 'TIMEOUT' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'CANCELLED'; message: string };

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<GeocodingResponse> => {
  const cacheKey = buildCacheKey(latitude, longitude);
  const startTime = Date.now();

  const cachedResult = getFromCache(cacheKey);
  if (cachedResult) {
    if (import.meta.env.DEV) {
      console.log(`[Geocoding Service] Cache HIT for key: ${cacheKey}. Time: ${Date.now() - startTime}ms`);
    }
    return { success: true, result: cachedResult };
  }

  if (import.meta.env.DEV) {
    console.log(`[Geocoding Service] Cache MISS for key: ${cacheKey}. Calling backend proxy...`);
  }

  try {
    const response = await apiClient.post<{
      success: boolean;
      errorType?: string;
      errorMessage?: string;
      address?: GeocodingAddress;
    }>('/geocoding/reverse', { latitude, longitude }, { signal, timeout: 15000 });

    const data = response.data;
    if (!data.success || !data.address) {
      const parsedErrorType = (data.errorType || 'INVALID_RESPONSE') as any;
      if (import.meta.env.DEV) {
        console.error(`[Geocoding Service] Proxy returned error: ${data.errorMessage}`);
      }
      return {
        success: false,
        errorType: parsedErrorType,
        message: data.errorMessage || 'Invalid response from geocoding proxy'
      };
    }

    const normalizedAddress: GeocodingAddress = {
      ...data.address,
      city: normalizeCity(data.address.city)
    };

    const finalResult: GeocodingResult = {
      latitude,
      longitude,
      address: normalizedAddress
    };

    // Store actual unrounded coordinates in cache, mapped to rounded cache key
    addToCache(cacheKey, finalResult);

    if (import.meta.env.DEV) {
      console.log(`[Geocoding Service] Proxy request SUCCESS in ${Date.now() - startTime}ms`);
    }

    return { success: true, result: finalResult };
  } catch (error: any) {
    if (axios.isCancel(error)) {
      if (import.meta.env.DEV) {
        console.log('[Geocoding Service] Request CANCELLED');
      }
      return {
        success: false,
        errorType: 'CANCELLED',
        message: 'Request was cancelled'
      };
    }

    let errorType: any = 'NETWORK_ERROR';
    let errorMessage = error.message || 'Network error occurred';

    if (error.code === 'ECONNABORTED' || errorMessage.toLowerCase().includes('timeout')) {
      errorType = 'TIMEOUT';
      errorMessage = 'Geocoding request timed out';
    } else if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      if (status === 429) {
        errorType = 'RATE_LIMIT';
        errorMessage = 'Too many requests. Please try again later.';
      } else {
        errorType = 'INVALID_RESPONSE';
        errorMessage = responseData?.errorMessage || `API returned status code ${status}`;
      }
    }

    if (import.meta.env.DEV) {
      console.error(`[Geocoding Service] Proxy call FAILED: ${errorType} - ${errorMessage}`);
    }

    return {
      success: false,
      errorType,
      message: errorMessage
    };
  }
};
