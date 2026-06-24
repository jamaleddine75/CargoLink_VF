/**
 * Normalizes roles received from the backend (JWT) to a standard format used in the frontend.
 * Backend roles usually look like ["ROLE_ADMIN", "ROLE_USER"] or direct values like "AGENCY".
 * Frontend uses "ADMIN", "USER", "AGENCY", "ADMIN", "DRIVER", "CUSTOMER".
 */
export const normalizeRole = (roles: string[] | string | undefined): string => {
  if (!roles) return 'CUSTOMER';
  
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  
  // Find the primary role - check JWT format first, then direct role names
  const priority = ['ROLE_ADMIN', 'ROLE_AGENCY', 'ROLE_AGENCY_ADMIN', 'ROLE_LIVREUR', 'ROLE_DRIVER', 'ROLE_CLIENT', 'ROLE_CUSTOMER', 
                   'ADMIN', 'AGENCY', 'AGENCY_ADMIN', 'DRIVER', 'CUSTOMER'];
  
  const foundRole = priority.find(p => rolesArray.includes(p)) || rolesArray[0] || 'CUSTOMER';
  
  // Remove ROLE_ prefix if present
  const normalized = foundRole.replace('ROLE_', '').toUpperCase();
  
  // Normalize old naming conventions
  if (normalized === 'CLIENT') return 'CUSTOMER';
  if (normalized === 'LIVREUR') return 'DRIVER';
  if (normalized === 'ADMIN') return 'ADMIN';
  
  // Keep AGENCY and AGENCY_ADMIN as-is for proper routing
  return normalized;
};

