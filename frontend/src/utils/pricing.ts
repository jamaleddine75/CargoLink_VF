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
export const calculateVolumetricWeight = (dimensions: Dimensions | undefined): number => {
  if (!dimensions) return 0;
  const { length, width, height } = dimensions;
  if (!length || !width || !height) return 0;
  return parseFloat(((length * width * height) / 5000).toFixed(2));
};

/**
 * Calculates total fees based on nested formData
 */
export const calculateTotalFees = (formData: any, routeDistanceKm: number = 0): PricingResult => {
  const { parcel = {}, attributes = {}, options = {} } = formData || {};
  
  const baseFee = 35; // MAD
  const distanceFee = parseFloat((routeDistanceKm * 0.5).toFixed(2));
  
  const realWeight = parseFloat(parcel.weight) || 0;
  const volumetricWeight = calculateVolumetricWeight(parcel.dimensions);
  const finalWeight = Math.max(realWeight, volumetricWeight);
  
  const breakdown: PricingBreakdown[] = [
    { label: 'Frais de base', amount: baseFee },
    { label: 'Frais de distance', amount: distanceFee },
  ];
  
  let surcharges = 0;

  // Type de colis (Nature)
  if (parcel.type === 'Document') {
    const discount = -10;
    surcharges += discount;
    breakdown.push({ label: 'Remise Document', amount: discount });
  } else if (parcel.type === 'Pallet') {
    const amount = 100;
    surcharges += amount;
    breakdown.push({ label: 'Supplément Palette', amount });
  }

  // Supplément Poids (Ex: 5 MAD pour chaque KG au-delà de 1 KG)
  if (parcel.type !== 'Document' && finalWeight > 1) {
    const amount = Math.ceil(finalWeight - 1) * 5;
    surcharges += amount;
    breakdown.push({ label: 'Supplément Poids', amount });
  }
  
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
