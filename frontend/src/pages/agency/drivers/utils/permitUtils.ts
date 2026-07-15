import { isAfter, parseISO } from 'date-fns';

export interface PermitStatus {
  isExpired: boolean;
  status: 'ACTIVE' | 'EXPIRED';
  label: string;
}

/**
 * Utility to detect the status of a driver's work permit
 * @param expiryDate ISO Date string
 * @returns PermitStatus object
 */
export const getPermitStatus = (expiryDate?: string): PermitStatus => {
  if (!expiryDate) {
    return {
      isExpired: true,
      status: 'EXPIRED',
      label: 'No Permit'
    };
  }

  try {
    const expiry = parseISO(expiryDate);
    const now = new Date();
    const isExpired = !isAfter(expiry, now);

    return {
      isExpired,
      status: isExpired ? 'EXPIRED' : 'ACTIVE',
      label: isExpired ? 'Expired' : 'Active'
    };
  } catch (error) {
    return {
      isExpired: true,
      status: 'EXPIRED',
      label: 'Invalid Date'
    };
  }
};
