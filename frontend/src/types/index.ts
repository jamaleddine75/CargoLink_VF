export type UserRole = 'ADMIN' | 'AGENCY' | 'AGENCY_ADMIN' | 'DRIVER' | 'CUSTOMER';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'REJECTED' | 'APPROVED' | 'ONLINE' | 'OFFLINE' | 'BUSY';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  status: UserStatus;
  companyName?: string;
  taxId?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  licenseNumber?: string;
  createdAt?: string;
  documents?: { name: string; url?: string; status?: string }[];
  avatarUrl?: string;
  isBlacklisted?: boolean;
  agencyId?: string;
  agencyName?: string;
  agencyCity?: string;
  agencyAddress?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  message?: string;
  isRated?: boolean;
}

export interface Wallet {
  id: string;
  balance: number;
  totalEarned: number;
  pendingCOD: number;
  deductions: number;
  weeklyCommission: number;
}

export interface Order {
  id: string;
  driverId?: string;
  customerName?: string;
  customerPhone?: string;
  updatedAt?: string;
  parcelType?: string;
  trackingNumber: string;
  barcode?: string;
  barcodeImagePath?: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupContactName: string;
  receiverName: string;
  receiverPhone: string;
  distance?: number;
  estimatedTime?: number;
  codAmount?: number;
  deliveryFee?: number;
  codCollected: boolean;
  createdAt: string;
  pickupDate?: string;
  deliveryStartedDate?: string;
  deliveredDate?: string;
  clientName?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatarUrl?: string;
  vehicleNumber?: string;
  agencyName?: string;
  // GPS Coordinates
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  driverLat?: number;
  driverLng?: number;
  // Delivery Proof
  deliveryProofType?: string;
  deliveryProofPhotoUrl?: string;
  deliveryNotes?: string;
  // Timestamps
  assignedAt?: string;
  deliveredAt?: string;
  // Payment Workflow
  paymentStatus?: 'PENDING' | 'COLLECTED_BY_DRIVER' | 'REMITTED_TO_AGENCY' | 'CONFIRMED_BY_AGENCY';
  paymentConfirmedAt?: string;
  // Task Management Fields
  priority?: string; // LOW, MEDIUM, HIGH, CRITICAL
  deadline?: string;
  estimatedDelivery?: string;
  slaStatus?: string; // ON_TRACK, AT_RISK, EXCEEDED
  reassignmentCount?: number;
  lastAssignedAt?: string;
  validated?: boolean;
  validatedAt?: string;
  isRated?: boolean;
  currentEta?: string;
  delayAlertSent?: boolean;
  senderCity?: string;
  receiverCity?: string;
  urgent?: boolean;
  heavy?: boolean;
  driverEarnings?: number;
  pointsEarned?: number;
  deliveryPinCode?: string;
  customerPointsEarned?: number;
  // Route management
  sequenceIndex?: number;
  senderPhone?: string;
}

export interface PagedResponse<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Driver extends User {
  vehicle: string;
  licensePlate: string;
  rating: number;
  totalOrders: number;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  currentLat?: number;
  currentLng?: number;
  documents: { name: string; url: string; type: string }[];
  workPermissionUntil?: string;
  todayDeliveries?: number;
  disciplinaryStatus?: 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED_LOCAL';
  lastDisciplinaryReason?: string;
}

export interface DriverDisciplinaryHistory {
  id: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface AdminStats {
  totalOrders: number;
  ordersInProgress: number;
  deliveredOrders: number;
  activeDrivers: number;
  activeClients: number;
  ordersTrend?: number;
  inProgressTrend?: number;
  deliveredTrend?: number;
  driversTrend?: number;
  clientsTrend?: number;
  ordersEvolution: { date: string; count: number }[];
  ordersByStatus: { name: string; value: number; color: string }[];
}

export interface FinanceStats {
  totalCod: number;
  pendingCod: number;
  paidCod: number;
  transactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    status: string;
    createdAt: string;
  }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Task Management Types
export interface TaskAnalytics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  completionRate: number;
  averageDeliveryTime: number;
  averageTimeToPickup: number;
  slaViolations: number;
  slaComplianceRate: number;
  lowPriorityCount: number;
  mediumPriorityCount: number;
  highPriorityCount: number;
  criticalPriorityCount: number;
  averageReassignmentCount: number;
  highReassignmentOrders: number;
  failureRate?: number;
  totalOrderValue: number;
  averageOrderValue: number;
  costPerDelivery: number;
  lastUpdated: number;
  period: string;
}

export interface AssignmentHistory {
  id: string;
  orderId: string;
  previousDriverId?: string;
  previousDriverName: string;
  newDriverId: string;
  newDriverName: string;
  reason: string;
  notes?: string;
  assignedBy: string;
  status: string;
  assignedAt: string;
  validUntil?: string;
}

export interface AgencySettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  taxId?: string;
  logoUrl?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  status?: string;
}

export interface CreateOrderRequest {
  pickupAddress: string;
  pickupContactName: string;
  pickupContactPhone?: string;
  deliveryAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity?: string;
  senderCity?: string;
  codAmount: number;
  deliveryNotes?: string;
  packageName?: string;
  packageWeight?: number;
  packageQuantity?: number;
  urgent?: boolean;
  heavy?: boolean;
  clientName?: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'BILLING' | 'TECHNICAL' | 'ORDER' | 'OTHER';
  createdAt: string;
  updatedAt: string;
}

