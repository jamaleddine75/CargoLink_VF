import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReverseGeocoding } from './useReverseGeocoding';
import { reverseGeocode } from '@/services/api/geocodingService';

vi.mock('@/services/api/geocodingService', () => ({
  reverseGeocode: vi.fn(),
  buildCacheKey: vi.fn(() => 'key'),
  normalizeCity: vi.fn((c) => c?.toUpperCase())
}));

describe('useReverseGeocoding Hook', () => {
  const updateAddress = vi.fn();
  const updateCity = vi.fn();
  const updatePostalCode = vi.fn();
  const updateCoordinates = vi.fn();
  const allowedCities = ['TANGER', 'TETOUAN', 'CHAOUEN'];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('instantly updates coordinates but debounces geocoding call', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue({
      success: true,
      result: {
        latitude: 35.7595,
        longitude: -5.8340,
        address: { displayName: 'Tanger Centre', city: 'Tanger', postcode: '90000' }
      }
    });

    const { result } = renderHook(() => useReverseGeocoding({
      currentAddress: '',
      updateAddress,
      updateCity,
      updatePostalCode,
      updateCoordinates,
      allowedCities
    }));

    // Trigger geocoding
    act(() => {
      result.current.triggerGeocoding(35.7595, -5.8340);
    });

    // Coordinates must update immediately
    expect(updateCoordinates).toHaveBeenCalledWith(35.7595, -5.8340);
    expect(result.current.isLoading).toBe(true);

    // API should not be called yet (due to debounce)
    expect(reverseGeocode).not.toHaveBeenCalled();

    // Fast-forward debounce timeout
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(reverseGeocode).toHaveBeenCalledWith(35.7595, -5.8340, expect.any(AbortSignal));
    expect(updateAddress).toHaveBeenCalledWith('Tanger Centre');
    expect(updateCity).toHaveBeenCalledWith('TANGER');
    expect(updatePostalCode).toHaveBeenCalledWith('90000');
    expect(result.current.isLoading).toBe(false);
  });

  test('does not geocode if coordinates did not change', async () => {
    const { result } = renderHook(() => useReverseGeocoding({
      currentAddress: '',
      updateAddress,
      updateCity,
      updatePostalCode,
      updateCoordinates,
      allowedCities
    }));

    act(() => {
      result.current.triggerGeocoding(35.7595, -5.8340);
    });
    expect(updateCoordinates).toHaveBeenCalledTimes(1);

    // Trigger with same coords
    act(() => {
      result.current.triggerGeocoding(35.7595, -5.8340);
    });
    // coordinates update callback shouldn't trigger again, and no geocoding is queued
    expect(updateCoordinates).toHaveBeenCalledTimes(1);
  });

  test('manual edit protection: does not overwrite if user typed during geocoding', async () => {
    vi.mocked(reverseGeocode).mockResolvedValue({
      success: true,
      result: {
        latitude: 35.7595,
        longitude: -5.8340,
        address: { displayName: 'Tanger Centre', city: 'Tanger' }
      }
    });

    let currentAddress = '';
    const { result, rerender } = renderHook(() => useReverseGeocoding({
      currentAddress,
      updateAddress,
      updateCity,
      updatePostalCode,
      updateCoordinates,
      allowedCities
    }));

    act(() => {
      result.current.triggerGeocoding(35.7595, -5.8340);
    });

    // User types manually in input during the request
    currentAddress = 'User manual edit address';
    rerender();

    // Fast-forward timers
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    // Form address should not be updated with geocoding resolved address
    expect(updateAddress).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
