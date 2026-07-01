// Auto-generated backend types

export interface Agency {
  id?: string;
  name?: string;
  address?: string;
  contactInfo?: string;
  taxId?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  adminAgency?: User;
  code?: string;
  sector?: string;
  agencyType?: string;
  description?: string;
  maxDrivers?: number;
  maxDailyOrders?: number;
  openingHour?: string;
  closingHour?: string;
  workingDays?: string;
  managerSalary?: number;
  managerBonus?: number;
  autoDispatch?: boolean;
  maxConcurrentDeliveries?: number;
  maxEmployees?: number;
  notes?: string;
  wallet?: AgencyWallet;
}

export interface AgencyCustomer {
  id?: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  notes?: string;
  agency?: Agency;
  orders?: Order[];
  createdAt?: string;
  updatedAt?: string;
}

export type AgencyCustomerStatus = 
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'BLOCKED';

export interface AgencyPayoutRequest {
  id?: string;
  agency?: Agency;
  status?: TransactionStatus;
  rejectionReason?: string;
  bankAccount?: string;
  requestedAt?: string;
  processedAt?: string;
}

export interface AgencyWallet {
  id?: string;
  agency?: Agency;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentHistory {
  id?: string;
  orderId?: string;
  previousDriverId?: string;
  newDriverId?: string;
  reason?: string;
  notes?: string;
  assignedBy?: string;
  status?: string;
  assignedAt?: string;
  validUntil?: string;
}

export interface AuditLog {
  id?: string;
  actor?: User;
  action?: string;
  target?: string;
  ipAddress?: string;
  createdAt?: string;
}

export type BadgeType = 
  | 'GOLD'
  | 'SILVER'
  | 'BRONZE';

export interface AgencyCustomerInvoice {
  id?: string;
  invoiceNumber?: string;
  agency?: Agency;
  customer?: AgencyCustomer;
  order?: Order;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgencyCustomerPayment {
  id?: string;
  invoice?: AgencyCustomerInvoice;
  agency?: Agency;
  customer?: AgencyCustomer;
  amount?: number;
  paymentMethod?: string;
  reference?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface AgencyLedgerTransaction {
  id?: string;
  agency?: Agency;
  transactionType?: LedgerTransactionType;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  balanceAfter?: number;
  createdAt?: string;
}

export type BillingPaymentStatus = 
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export interface CODReconciliation {
  id?: string;
  agency?: Agency;
  order?: Order;
  driver?: Driver;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CODStatus = 
  | 'PENDING'
  | 'MATCHED'
  | 'MISMATCHED'
  | 'CONFIRMED';

export interface DriverEarning {
  id?: string;
  agency?: Agency;
  driver?: Driver;
  order?: Order;
  createdAt?: string;
  updatedAt?: string;
}

export type DriverEarningStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'PAID';

export interface DriverFinancialRecord {
  id?: string;
  agency?: Agency;
  driver?: Driver;
  updatedAt?: string;
}

export type InvoiceStatus = 
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type LedgerTransactionType = 
  | 'CUSTOMER_PAYMENT'
  | 'DRIVER_EARNING'
  | 'COD_RECEIPT'
  | 'PENALTY'
  | 'BONUS'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'COMMISSION'
  | 'EXPENSE'
  | 'INCOME'
  | 'PLATFORM_FEE';

export interface PlatformCommissionRecord {
  id?: string;
  agency?: Agency;
  order?: Order;
  grossAmount?: number;
  platformFeeAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type PlatformCommissionStatus = 
  | 'PENDING'
  | 'CALCULATED'
  | 'SETTLED';

export interface ClientProfile {
  id?: string;
  user?: User;
  companyName?: string;
  billingAddress?: string;
  taxId?: string;
}

export type DisciplinaryStatus = 
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'BLACKLISTED_LOCAL';

export interface Driver {
  id?: string;
  name?: string;
  phone?: string;
  user?: User;
  agency?: Agency;
  registrationCity?: string;
  vehiclePlate?: string;
  vehicleType?: VehicleType;
  licenseNumber?: string;
  documents?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  rejectionReason?: string;
  latitude?: number;
  longitude?: number;
  version?: number;
  lastDisciplinaryReason?: string;
  workPermissionUntil?: string;
  updatedAt?: string;
}

export type DriverAvailability = 
  | 'AVAILABLE'
  | 'BUSY'
  | 'OFFLINE';

export interface DriverBadge {
  id?: string;
  driver?: Driver;
  name?: string;
  description?: string;
  icon?: string;
  badgeType?: BadgeType;
}

export interface DriverDisciplinaryAction {
  id?: string;
  driver?: Driver;
  agency?: Agency;
  performedBy?: User;
  previousStatus?: DisciplinaryStatus;
  newStatus?: DisciplinaryStatus;
  action?: string;
  reason?: string;
  createdAt?: string;
}

export interface DriverRating {
  id?: string;
  driver?: Driver;
  client?: User;
  order?: Order;
  rating?: number;
  comment?: string;
  createdAt?: string;
}

export interface DriverShift {
  id?: string;
  driver?: Driver;
  endedAt?: string;
}

export type DriverStatus = 
  | 'ONLINE'
  | 'OFFLINE'
  | 'BUSY';

export interface Incident {
  id?: string;
  orderId?: string;
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  resolution?: string;
  priority?: string;
  assignedTo?: string;
  notes?: string;
  attachments?: string;
  source?: string;
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IncidentAttachment {
  id?: string;
  incidentId?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt?: string;
}

export interface IncidentMessage {
  id?: string;
  incidentId?: string;
  senderId?: string;
  message?: string;
  createdAt?: string;
  readAt?: string;
}

export interface IncidentStatusHistory {
  id?: string;
  incidentId?: string;
  status?: string;
  changedBy?: string;
  comment?: string;
  createdAt?: string;
}

export interface Notification {
  id?: string;
  recipient?: User;
  title?: string;
  message?: string;
  type?: string;
  createdAt?: string;
}

export interface Order {
  trackingNumber?: string;
  barcode?: string;
  barcodeImagePath?: string;
  status?: OrderStatus;
  pickupAddress?: string;
  deliveryAddress?: string;
  senderCity?: string;
  receiverCity?: string;
  pickupContactName?: string;
  receiverName?: string;
  receiverPhone?: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  distance?: number;
  estimatedTime?: number;
  codAmount?: number;
  deliveryFee?: number;
  driverEarnings?: number;
  client?: User;
  driver?: Driver;
  agency?: Agency;
  customer?: AgencyCustomer;
  createdAt?: string;
  pickupDate?: string;
  deliveryStartedDate?: string;
  deadline?: string;
  lastAssignedAt?: string;
  deliveryProofType?: string;
  deliveryProofPhotoUrl?: string;
  deliveryProofPin?: string;
  deliveryNotes?: string;
  paymentConfirmedAt?: string;
  paymentConfirmedBy?: User;
  version?: number;
  assignedAt?: string;
  deliveredAt?: string;
  validatedAt?: string;
  cashConfirmedAt?: string;
  cashCollectedAt?: string;
  driverRating?: DriverRating;
  sequenceIndex?: number;
  currentEta?: string;
  pointsEarned?: number;
}

export interface OrderItem {
  id?: string;
  order?: Order;
  itemName?: string;
  quantity?: number;
  weight?: number;
  description?: string;
}

export type OrderStatus = 
  | 'PENDING'
  | 'VALIDATED'
  | 'ASSIGNED'
  | 'PICKUP_READY'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 
  | 'PENDING'
  | 'CANCELLED';

export interface PlatformWallet {
  id?: string;
  updatedAt?: string;
}

export type EarningsModel = 
  | 'PERCENTAGE'
  | 'DISTANCE';

export type Role = 
  | 'ADMIN'
  | 'AGENCY_ADMIN'
  | 'AGENCY'
  | 'CUSTOMER';

export interface SavedAddress {
  id?: string;
  user?: User;
  label?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
  createdAt?: string;
}

export type SLAStatus = 
  | 'ON_TRACK';

export interface SystemSettings {
  id?: string;
  platformName?: string;
  currency?: string;
  timezone?: string;
  jwtExpiry?: number;
}

export interface TrackingHistory {
  id?: string;
  orderId?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  scanValue?: string;
  comment?: string;
  timestamp?: string;
}

export interface Transaction {
  id?: string;
  wallet?: Wallet;
  type?: TransactionType;
  description?: string;
  orderId?: string;
  referenceIds?: string;
  status?: TransactionStatus;
  date?: string;
}

export type TransactionStatus = 
  | 'PENDING'
  | 'COMPLETED'
  | 'REMITTED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'FAILED'
  | 'CANCELLED';

export type TransactionType = 
  | 'GAIN'
  | 'COD_COLLECTED';

export interface User {
  id?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  role?: Role;
  agency?: Agency;
  createdAt?: string;
  updatedAt?: string;
}

export type UserStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'DEACTIVATED'
  | 'ACTIVE'
  | 'BLACKLISTED';

export interface Wallet {
  id?: string;
  user?: User;
}

export type WalletType = 
  | 'DRIVER'
  | 'CUSTOMER'
  | 'AGENCY'
  | 'PLATFORM';

export interface WithdrawalRequest {
  id?: string;
  user?: User;
  driverId?: string;
  amount?: number;
  bankAccount?: string;
  accountHolder?: string;
  rejectionReason?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface BillingSummaryResponse {
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  pendingReceivables?: number;
  pendingPayables?: number;
  currentWalletBalance?: number;
}

export interface CODReconciliationRequest {
  orderId?: string;
  driverId?: string;
  expectedAmount?: number;
  receivedAmount?: number;
  notes?: string;
}

export interface DriverEarningRequest {
  driverId?: string;
  orderId?: string;
  baseAmount?: number;
  commissionAmount?: number;
  bonusAmount?: number;
  penaltyAmount?: number;
}

export interface InvoiceRequest {
  customerId?: string;
  orderId?: string;
  dueDate?: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
}

export interface PaymentRequest {
  amount?: number;
  paymentMethod?: string;
  reference?: string;
}

export interface AdminCreateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  agencyId?: number;
}

export interface AdminUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
}

export interface AgencyCreateRequest {
  manager?: ManagerInfo;
  agency?: AgencyInfo;
  location?: LocationInfo;
  operations?: OperationsInfo;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  name?: string;
  code?: string;
  city?: string;
  sector?: string;
  address?: string;
  description?: string;
  maxDrivers?: number;
  maxDailyOrders?: number;
  lat?: number;
  lng?: number;
  openingHour?: string;
  closingHour?: string;
  salary?: number;
  commissionRate?: number;
  bonus?: number;
  autoDispatch?: boolean;
  maxEmployees?: number;
  maxConcurrentDeliveries?: number;
  operationalStatus?: string;
}

export interface AgencyCustomerRequest {
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  notes?: string;
}

export interface AgencySettingsRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  logoUrl?: string;
  city?: string;
  zipCode?: string;
  country?: string;
}

export interface AgencyUpdateRequest {
  manager?: ManagerInfo;
  agency?: AgencyInfo;
  location?: LocationInfo;
  operations?: OperationsInfo;
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  currentPassword?: string;
  name?: string;
  code?: string;
  city?: string;
  sector?: string;
  address?: string;
  description?: string;
  maxDrivers?: number;
  maxDailyOrders?: number;
  logoUrl?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  openingHour?: string;
  closingHour?: string;
  workingDays?: string;
  salary?: number;
  commissionRate?: number;
  bonus?: number;
  autoDispatch?: boolean;
  maxConcurrentDeliveries?: number;
  maxEmployees?: number;
  operationalStatus?: string;
}

export interface AssignDriverRequest {
  driverId?: string;
}

export interface AvatarUpdateRequest {
  avatarUrl?: string;
}

export interface BatchAssignRequest {
  driverId?: string;
  assignmentReason?: string;
}

export interface BroadcastRequest {
  title?: string;
  message?: string;
  targetRoles?: string[];
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}

export interface CODRemittanceRequestDTO {
  totalAmount?: number;
}

export interface CreateOrderRequest {
  pickupAddress?: string;
  deliveryAddress?: string;
  senderCity?: string;
  receiverCity?: string;
  pickupContactName?: string;
  receiverName?: string;
  receiverPhone?: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  distance?: number;
  estimatedTime?: number;
  priority?: string;
  deadline?: string;
  urgent?: boolean;
  heavy?: boolean;
  notes?: string;
  items?: OrderItemRequest[];
}

export interface DisciplinaryActionRequest {
  reason?: string;
}

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface OrderItemRequest {
  itemName?: string;
  quantity?: number;
  weight?: number;
  description?: string;
}

export interface PayoutRequestDTO {
  amount?: number;
  bankAccount?: string;
}

export interface ReassignOrderRequest {
  newDriverId?: string;
  reason?: string;
  notes?: string;
}

export interface RegisterRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: Role;
  vehicleType?: string;
  licenseNumber?: string;
  documents?: string;
  city?: string;
  companyName?: string;
  taxId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface ReoptimizeRequest {
  orderIds?: string[];
}

export interface SavedAddressRequest {
  label?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
}

export interface UpdateAgencyRequest {
  name?: string;
  phone?: string;
  address?: string;
}

export interface UpdateDriverProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  vehiclePlate?: string;
  licenseNumber?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  documents?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
}

export interface UpdateStatusRequest {
  status?: string;
}

export interface WithdrawalRequestDTO {
  bankAccount?: string;
  accountHolder?: string;
}

export interface AdminDashboardResponse {
  totalOrders?: number;
  ordersInProgress?: number;
  deliveredOrders?: number;
  activeDrivers?: number;
  activeClients?: number;
  ordersTrend?: number;
  inProgressTrend?: number;
  deliveredTrend?: number;
  driversTrend?: number;
  clientsTrend?: number;
  ordersEvolution?: Record<string, object>[];
  ordersByStatus?: Record<string, object>[];
}

export interface AdminStatsResponse {
  totalAgencies?: number;
  totalDrivers?: number;
  totalClients?: number;
  totalOrders?: number;
  ordersToday?: number;
  driversOnline?: number;
  monthlyRevenue?: MonthlyRevenueDTO[];
  agencyBreakdown?: AgencyBreakdownDTO[];
  pendingPayouts?: number;
  systemHealth?: SystemHealthDTO;
  name?: string;
  orders?: number;
  id?: string;
  name?: string;
  orders?: number;
  commission?: number;
  drivers?: number;
  activeConnections?: number;
  averageResponseTime?: number;
  uptime?: number;
}

export interface AgencyCustomerResponse {
  id?: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  notes?: string;
  status?: AgencyCustomerStatus;
  totalOrders?: number;
  totalRevenue?: number;
  successRate?: number;
  createdAt?: string;
  updatedAt?: string;
  isVip?: boolean;
  isHighRisk?: boolean;
}

export interface AgencyMetricsResponse {
  totalOrders?: number;
  totalRevenue?: number;
  activeDrivers?: number;
  pendingPickups?: number;
  ongoingDeliveries?: number;
  issuesCount?: number;
  weeklyOrders?: Record<string, object>[];
  driversStatus?: Record<string, object>[];
}

export interface AgencyResponse {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  logoUrl?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  status?: string;
  adminAgencyId?: string;
  adminAgencyName?: string;
  commissionRate?: number;
  driversCount?: number;
  customersCount?: number;
  code?: string;
  sector?: string;
  agencyType?: string;
  description?: string;
  maxDrivers?: number;
  maxDailyOrders?: number;
  openingHour?: string;
  closingHour?: string;
  workingDays?: string;
  managerSalary?: number;
  managerBonus?: number;
  autoDispatch?: boolean;
  maxConcurrentDeliveries?: number;
  maxEmployees?: number;
  operationalStatus?: string;
  notes?: string;
}

export interface ApiResponse {
  success?: boolean;
  message?: string;
}

export interface AssignmentHistoryResponse {
  id?: string;
  previousDriverId?: string;
  previousDriverName?: string;
  newDriverId?: string;
  newDriverName?: string;
  reason?: string;
  notes?: string;
  assignedBy?: string;
  status?: string;
  assignedAt?: string;
  validUntil?: string;
}

export interface AuditLogResponse {
  id?: string;
  actor?: string;
  action?: string;
  target?: string;
  ipAddress?: string;
  timestamp?: string;
}

export interface CascadeETAResult {
  stops?: StopETA[];
  totalRemainingKm?: number;
  totalRemainingMin?: number;
  estimatedEndTime?: string;
  nextStopAddress?: string;
  type?: string;
  address?: string;
  eta?: string;
  distanceKm?: number;
  durationMin?: number;
  slaStatus?: string;
}

export interface ClientKPIsResponse {
  totalSent?: number;
  inTransit?: number;
  delivered?: number;
  pendingPayment?: number;
}

export interface CustomerWalletResponse {
  id?: string;
  balance?: number;
  totalCOD?: number;
  totalFees?: number;
  pendingCOD?: number;
  totalOrders?: number;
  weeklyCOD?: number;
  availableBalance?: number;
}

export interface DailyEarningsResponse {
  date?: string;
  ordersCompleted?: number;
}

export interface DashboardStatsResponse {
  totalAgencies?: number;
  totalDrivers?: number;
  totalClients?: number;
  totalOrders?: number;
  monthlyRevenue?: Record<string, object>[];
  agencyBreakdown?: Record<string, object>[];
  pendingPayouts?: number;
}

export interface DriverBadgeResponse {
  id?: string;
  name?: string;
  description?: string;
  icon?: string;
  earnedAt?: string;
  type?: string;
}

export interface DriverDashboardStatsResponse {
  todayDelivered?: number;
  successRate?: number;
  activeOrderCount?: number;
  isOnline?: boolean;
  verificationStatus?: string;
  earningsTrend?: string;
  todayFailed?: number;
  isOnShift?: boolean;
  shiftId?: string;
  loyaltyPoints?: number;
  completedToday?: number;
}

export interface DriverDisciplinaryHistoryResponse {
  id?: string;
  action?: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  performedBy?: string;
  createdAt?: string;
}

export interface DriverResponse {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  driverStatus?: string;
  agencyId?: string;
  agencyName?: string;
  agencyCity?: string;
  registrationCity?: string;
  verificationStatus?: string;
  rejectionReason?: string;
  latitude?: number;
  longitude?: number;
  availability?: string;
  disciplinaryStatus?: string;
  lastDisciplinaryReason?: string;
  rating?: number;
  ratingCount?: number;
  loyaltyPoints?: number;
  licenseNumber?: string;
  documents?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  autoAccept?: boolean;
  notifications?: boolean;
  sound?: boolean;
  googleMaps?: boolean;
  darkMap?: boolean;
}

export interface DriverStatsResponse {
  totalOrders?: number;
  completedOrders?: number;
  averageRating?: number;
  successRate?: number;
  todayFailed?: number;
}

export interface ErrorResponse {
  status?: number;
  message?: string;
  path?: string;
  errors?: Record<string, string>;
}

export interface FinanceResponse {
  totalCod?: number;
  pendingCod?: number;
  paidCod?: number;
  transactions?: TransactionResponse[];
}

export interface FinanceSummaryResponse {
  totalRevenue?: number;
  totalCommissions?: number;
  currentBalance?: number;
  totalTransactions?: number;
}

export interface IncidentResponse {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  type?: string;
  status?: string;
  resolution?: string;
  orderTrackingNumber?: string;
  driverName?: string;
  driverId?: string;
  priority?: string;
  assignedTo?: string;
  assignedToName?: string;
  notes?: string;
  attachments?: string;
  source?: string;
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JwtAuthResponse {
  token?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  message?: string;
}

export interface LiveDriverResponse {
  id?: number;
  name?: string;
  phone?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
}

export interface NotificationResponse {
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  userId?: string;
  recipientRole?: string;
  recipientEmail?: string;
  targetRoles?: string[];
  createdAt?: string;
}

export interface OrderItemResponse {
  id?: string;
  itemName?: string;
  quantity?: number;
  weight?: number;
  description?: string;
}

export interface OrderResponse {
  id?: string;
  trackingNumber?: string;
  barcode?: string;
  barcodeImagePath?: string;
  status?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  senderCity?: string;
  receiverCity?: string;
  pickupContactName?: string;
  receiverName?: string;
  receiverPhone?: string;
  codAmount?: number;
  deliveryFee?: number;
  driverEarnings?: number;
  urgent?: boolean;
  heavy?: boolean;
  clientName?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatarUrl?: string;
  driverLat?: number;
  driverLng?: number;
  agencyName?: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  distance?: number;
  createdAt?: string;
  assignedAt?: string;
  deliveredAt?: string;
  priority?: string;
  slaStatus?: string;
  deadline?: string;
  deliveryProofType?: string;
  deliveryProofPhotoUrl?: string;
  deliveryNotes?: string;
  notes?: string;
  paymentStatus?: string;
  paymentConfirmedAt?: string;
  validated?: boolean;
  validatedAt?: string;
  cashConfirmed?: boolean;
  cashConfirmedAt?: string;
  cashCollected?: boolean;
  cashCollectedAt?: string;
  isRated?: boolean;
  sequenceIndex?: number;
  currentEta?: string;
  delayAlertSent?: boolean;
  pointsEarned?: number;
  items?: OrderItemResponse[];
}

export interface PagedResponse {
  content?: T[];
  page?: number;
  size?: number;
  currentPage?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
}

export interface RouteResponseDTO {
  driverId?: string;
  stops?: RouteStopDTO[];
  totalDistance?: number;
  totalDuration?: number;
  estimatedEndTime?: string;
  lastOptimizedAt?: string;
}

export interface RouteStopDTO {
  trackingNumber?: string;
  type?: string;
  lat?: number;
  lng?: number;
  address?: string;
  contact?: string;
  phone?: string;
  codAmount?: number;
  sequenceIndex?: number;
  estimatedArrival?: string;
}

export interface SavedAddressResponse {
  id?: string;
  label?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
}

export interface ShiftGoalResponse {
  id?: string;
  label?: string;
  current?: number;
  target?: number;
  unit?: string;
  type?: string;
  pct?: number;
}

export interface ShiftSummaryResponse {
  shiftId?: string;
  startedAt?: string;
  endedAt?: string;
  isActive?: boolean;
  totalDeliveries?: number;
  successfulDeliveries?: number;
  failedDeliveries?: number;
  totalEarnings?: number;
  totalCOD?: number;
  totalDistanceKm?: number;
  avgDeliveryTimeMin?: number;
  slaBreaches?: number;
  incidentCount?: number;
}

export interface TaskAnalyticsResponse {
  totalOrders?: number;
  completedOrders?: number;
  pendingOrders?: number;
  cancelledOrders?: number;
  completionRate?: number;
  averageDeliveryTime?: number;
  averageTimeToPickup?: number;
  slaViolations?: number;
  slaComplianceRate?: number;
  lowPriorityCount?: number;
  mediumPriorityCount?: number;
  highPriorityCount?: number;
  criticalPriorityCount?: number;
  totalDrivers?: number;
  activeDrivers?: number;
  averageOrdersPerDriver?: number;
  averageDriverRating?: number;
  totalAgencies?: number;
  averageAgencyCompletionRate?: number;
  averageReassignmentCount?: number;
  highReassignmentOrders?: number;
  failureRate?: number;
  lastUpdated?: number;
  period?: string;
}

export interface TourStatsResponse {
  totalOrders?: number;
  completedOrders?: number;
  pendingOrders?: number;
  onTimeRate?: number;
  delayedCount?: number;
  totalDistanceCovered?: number;
  totalDistanceRemaining?: number;
  avgTimePerStop?: number;
  currentEfficiency?: number;
}

export interface TrackingHistoryResponse {
  id?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  scanValue?: string;
  comment?: string;
  timestamp?: string;
}

export interface TransactionResponse {
  id?: string;
  amount?: number;
  type?: string;
  description?: string;
  trackingNumber?: string;
  deliveryAddress?: string;
  codAmount?: number;
  status?: string;
  createdAt?: string;
  date?: string;
  driverName?: string;
  driverPhone?: string;
  driverUserId?: string;
  referenceIds?: string;
}

export interface UserResponse {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  isActive?: boolean;
  status?: string;
  address?: string;
  avatarUrl?: string;
  companyName?: string;
  billingAddress?: string;
  taxId?: string;
  vehicleInfo?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  licenseNumber?: string;
  agencyId?: string;
  agencyName?: string;
}

export interface WalletResponse {
  id?: string;
  totalDeliveries?: number;
  accountStatus?: string;
  nextPayoutDate?: string;
}

export interface WeeklyPerformanceResponse {
  week?: string;
  days?: DayStats[];
  totalEarnings?: number;
  totalDeliveries?: number;
  avgSuccessRate?: number;
  topDay?: string;
  rank?: number;
  totalDrivers?: number;
  date?: string;
  deliveries?: number;
  earnings?: number;
  successRate?: number;
}

export interface WithdrawalRequestResponse {
  id?: string;
  bankAccount?: string;
  accountHolder?: string;
  status?: string;
  createdAt?: string;
  completedAt?: string;
  rejectionReason?: string;
}

