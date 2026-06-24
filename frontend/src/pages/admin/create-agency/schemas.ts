import { z } from 'zod';

// ── Step 1: Manager Info ──
export const managerSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().optional(), // Optional in Edit mode
  confirmPassword: z.string().optional(),
  currentPassword: z.string().optional(), // Used in Edit mode for verification
  role: z.string().default('AGENCY_MANAGER'),
}).refine(d => {
  if (d.password || d.confirmPassword) {
    return d.password === d.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(d => {
  // If password is being set, it must be at least 8 chars
  if (d.password && d.password.length > 0) {
    return d.password.length >= 8;
  }
  return true;
}, {
  message: "Password must be at least 8 characters",
  path: ['password'],
});


// ── Step 2: Agency Info ──
export const agencySchema = z.object({
  name: z.string().min(2, 'Agency name is required'),
  code: z.string().min(2, 'Agency code is required'),
  city: z.string().min(2, 'City is required'),
  sector: z.string().min(2, 'Sector is required'),
  address: z.string().min(5, 'Address is required'),
  agencyType: z.string().default('STANDARD'),
  description: z.string().optional(),
  maxDrivers: z.number().min(1).max(500).default(10),
  maxDailyOrders: z.number().min(1).max(5000).default(100),
});

// ── Step 3: Location ──
export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  fullAddress: z.string().optional(),
  city: z.string().optional(),
  sector: z.string().optional(),
});

// ── Step 4: Operations ──
export const operationsSchema = z.object({
  openingHour: z.string().default('08:00'),
  closingHour: z.string().default('18:00'),
  workingDays: z.array(z.string()).default(['Mon','Tue','Wed','Thu','Fri']),
  salary: z.number().min(0).default(5000),
  commissionRate: z.number().min(0).max(100).default(15),
  bonus: z.number().min(0).default(0),
  autoDispatch: z.boolean().default(true),
  maxConcurrentDeliveries: z.number().min(1).max(100).default(5),
  maxEmployees: z.number().min(1).max(100).default(10),
  operationalStatus: z.string().default('ACTIVE'),
});

export type ManagerData = z.infer<typeof managerSchema>;
export type AgencyData = z.infer<typeof agencySchema>;
export type LocationData = z.infer<typeof locationSchema>;
export type OperationsData = z.infer<typeof operationsSchema>;

// ── Manager Update (No password) ──
export const managerUpdateSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

export type ManagerUpdateData = z.infer<typeof managerUpdateSchema>;

export interface CreateAgencyPayload {
  manager: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  };
  agency: AgencyData;
  location: {
    lat: number;
    lng: number;
  };
  operations: OperationsData;
}


export interface UpdateAgencyPayload {
  manager: ManagerUpdateData & { password?: string; currentPassword?: string };
  agency: AgencyData & { logoUrl?: string; notes?: string };
  location: LocationData;
  operations: OperationsData;
}



export const STEP_LABELS = [
  'Manager Info',
  'Agency Details',
  'Map & Location',
  'Operations',
  'Review & Create',
] as const;

export const AGENCY_TYPES = ['STANDARD', 'PREMIUM', 'EXPRESS', 'REGIONAL', 'HUB'] as const;
export const WORKING_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const;
export const STATUS_OPTIONS = ['ACTIVE', 'STANDBY', 'MAINTENANCE'] as const;
