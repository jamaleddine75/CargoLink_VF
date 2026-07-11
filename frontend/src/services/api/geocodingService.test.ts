import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  reverseGeocode, 
  buildCacheKey, 
  normalizeCity, 
  clearCache, 
  getCacheStats 
} from './geocodingService';
import apiClient from '@/api/client';

vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('geocodingService', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('buildCacheKey rounds to 5 decimal places', () => {
    const key1 = buildCacheKey(35.759544, -5.834011);
    const key2 = buildCacheKey(35.759541, -5.834014);
    expect(key1).toBe('35.75954,-5.83401');
    expect(key2).toBe('35.75954,-5.83401');
    expect(key1).toBe(key2);
  });

  test('normalizeCity handles various city aliases and accents', () => {
    expect(normalizeCity('Tangier')).toBe('TANGER');
    expect(normalizeCity('Tanger ')).toBe('TANGER');
    expect(normalizeCity('Tétouan')).toBe('TETOUAN');
    expect(normalizeCity('Tetouan')).toBe('TETOUAN');
    expect(normalizeCity('Al Hoceïma')).toBe('AL HOCEIMA');
    expect(normalizeCity('Al Hoceima')).toBe('AL HOCEIMA');
    expect(normalizeCity('Marrakesh')).toBe('MARRAKECH');
    expect(normalizeCity('Marrakech')).toBe('MARRAKECH');
    expect(normalizeCity('Chefchaouen')).toBe('CHAOUEN');
    expect(normalizeCity('UnknownCity')).toBe('UnknownCity');
  });

  test('reverseGeocode caches results and hits cache on subsequent calls', async () => {
    const mockAddress = {
      displayName: 'Tanger, Morocco',
      city: 'Tanger',
      country: 'Morocco'
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        success: true,
        address: mockAddress
      }
    });

    // Cache Miss
    const res1 = await reverseGeocode(35.7595, -5.8340);
    expect(res1.success).toBe(true);
    if (res1.success) {
      expect(res1.result.address.city).toBe('TANGER');
      expect(res1.result.latitude).toBe(35.7595);
    }

    // Cache Hit
    const res2 = await reverseGeocode(35.7595, -5.8340);
    expect(res2.success).toBe(true);
    if (res2.success) {
      expect(res2.result.address.city).toBe('TANGER');
    }

    // API should only be called once
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(getCacheStats().size).toBe(1);
  });

  test('reverseGeocode handles rate limits correctly', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: {
        status: 429,
        data: { errorMessage: 'Too many requests' }
      }
    });

    const res = await reverseGeocode(35.7595, -5.8340);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errorType).toBe('RATE_LIMIT');
    }
  });

  test('reverseGeocode evicts LRU items when capacity is exceeded', async () => {
    // Fill cache capacity up to max (simulated here since TTL and maxcapacity are constant in file)
    // We can clear cache, then add 500 items, and see if cache cap triggers
    const mockAddress = (i: number) => ({
      displayName: `Address ${i}`,
      city: 'Tanger'
    });

    // Populate cache directly by calling mock geocodes
    for (let i = 0; i < 501; i++) {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          address: mockAddress(i)
        }
      });
      await reverseGeocode(35.0 + i * 0.0001, -5.0);
    }

    expect(getCacheStats().size).toBe(500); // Caps at 500
  });
});
