/**
 * Logistics Pricing Utility
 * Handles volumetric weight and fee calculations
 */

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface PricingBreakdown {
  label: string;
  amount: number;
}

export interface PricingResult {
  baseFee: number;
  distanceFee: number;
  realWeight: number;
  volumetricWeight: number;
  finalWeight: number;
  breakdown: PricingBreakdown[];
  total: number;
}

/**
 * Calculates volumetric weight: (L * W * H) / 5000
 */
export const calculateVolumetricWeight = (dimensions: Dimensions): number => {
  const { length, width, height } = dimensions;
  if (!length || !width || !height) return 0;
  return parseFloat(((length * width * height) / 5000).toFixed(2));
};

/**
 * Calculates total fees based on nested formData
 */
export const calculateTotalFees = (formData: any, routeDistanceKm: number = 0): PricingResult => {
  const { parcel, attributes, options } = formData;
  
  const baseFee = 35; // MAD
  const distanceFee = parseFloat((routeDistanceKm * 0.5).toFixed(2)); // Mock: 0.5 MAD per km
  
  const realWeight = parseFloat(parcel.weight) || 0;
  const volumetricWeight = calculateVolumetricWeight(parcel.dimensions);
  const finalWeight = Math.max(realWeight, volumetricWeight);
  
  const breakdown: PricingBreakdown[] = [
    { label: 'Frais de base', amount: baseFee },
    { label: 'Frais de distance', amount: distanceFee },
  ];
  
  let surcharges = 0;
  
  // Fragile surcharge
  if (attributes.fragile) {
    const amount = 15;
    surcharges += amount;
    breakdown.push({ label: 'Supplément Fragile', amount });
  }
  
  // Express surcharge
  if (options.deliveryOption === 'express') {
    const amount = 25;
    surcharges += amount;
    breakdown.push({ label: 'Supplément Express', amount });
  } else if (options.deliveryOption === 'same_day') {
    const amount = 40;
    surcharges += amount;
    breakdown.push({ label: 'Supplément Same Day', amount });
  }
  
  // Volume surcharge (if volumetric > real by significant amount)
  if (volumetricWeight > realWeight && volumetricWeight > 5) {
    const amount = Math.round((volumetricWeight - realWeight) * 2);
    if (amount > 0) {
      surcharges += amount;
      breakdown.push({ label: 'Supplément Volume', amount });
    }
  }
  
  const total = baseFee + distanceFee + surcharges;
  
  return {
    baseFee,
    distanceFee,
    realWeight,
    volumetricWeight,
    finalWeight,
    breakdown,
    total: parseFloat(total.toFixed(2)),
  };
};
