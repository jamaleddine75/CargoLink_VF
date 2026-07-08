/**
 * Centralized API endpoint paths
 * NOTE: BaseURL already includes "/api", so these paths MUST NOT start with "/api".
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    UPDATE_PROFILE: '/auth/update',
    UPDATE_PASSWORD: '/auth/password',
    UPDATE_AVATAR: '/auth/avatar',
  },
  PUBLIC: {
    AVAILABLE_CITIES: '/public/available-cities',
  },
  USERS: {

    ME: '/users/me',
    UPDATE_PROFILE: '/users/profile',
    UPDATE_AVATAR: '/users/me/avatar',
  },

  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    BY_TRACKING: (trackingNumber: string) => `/orders/find-by-tracking/${trackingNumber}`,
    // FIX BS-02: Moved from /public/status (unauthenticated) to secured /driver/status
    UPDATE_STATUS: (id: string) => `/orders/driver/status/${id}`,
    ASSIGN_DRIVER: (id: string) => `/orders/${id}/assign-driver`,
    // FIX BS-10: Moved from /public/refuse to /{id}/refuse (requires DRIVER/ADMIN role)
    REFUSE: (id: string) => `/orders/${id}/refuse`,
    REPORT_PROBLEM: (id: string) => `/orders/${id}/problem`,
    BATCH_STATUS: '/orders/batch-status',
    ESTIMATE_FEE: '/orders/estimate-fee',
    PROOF_OF_DELIVERY: '/orders/proof-of-delivery',
    RATE: (id: string) => `/orders/${id}/rate`,
    DRIVER: {
      ACTIVE: '/orders/driver/active',
      AVAILABLE: '/orders/driver/available',
      HISTORY: '/orders/driver/history',
      STATS: '/orders/driver/stats',
      KPIS: (driverId: string) => `/orders/driver-kpis/${driverId}`,
    },
    CLIENT_KPIS: (clientId: string) => `/orders/client-kpis/${clientId}`,
  },
  AGENCIES: {
    BASE: '/agencies',
    BY_ID: (id: string) => `/agencies/${id}`,
    METRICS: (id: string) => `/agencies/${id}/metrics`,
    DRIVERS: (id: string) => `/agencies/${id}/drivers`,
    ORDERS: (id: string) => `/agencies/${id}/orders`,
    WALLET: (id: string) => `/agencies/${id}/wallet`,
    PENDING_REMITTANCES: (id: string) => `/agencies/${id}/pending-remittances`,
    CONFIRM_REMITTANCE: (agencyId: string, transactionId: string) => `/agencies/${agencyId}/cod-remittance/${transactionId}/confirm`,
    COMMISSIONS: (id: string) => `/agencies/${id}/commissions`,
    PAYOUTS: (id: string) => `/agencies/${id}/payouts`,
    PAYOUT_REQUEST: (id: string) => `/agencies/${id}/payouts/request`,
    CUSTOMERS: {
      BASE: (agencyId: string) => `/agencies/${agencyId}/customers`,
      BY_ID: (agencyId: string, customerId: string) => `/agencies/${agencyId}/customers/${customerId}`,
      ANALYTICS: (agencyId: string) => `/agencies/${agencyId}/customers/analytics/overview`,
      ACTION: (agencyId: string, customerId: string, action: string) => `/agencies/${agencyId}/customers/${customerId}/${action}`,
    }
  },
  AGENCY_ADMIN: {
    ORDERS: '/agency/orders',
    ORDERS_BY_ID: (id: string) => `/agency/orders/${id}`,
    DRIVERS: '/agency/drivers',
    VALIDATE_DELIVERY: (id: string) => `/agency/orders/${id}/validate`,
    CONFIRM_PAYMENT: (id: string) => `/agency/orders/${id}/confirm-payment`,
    PROFILE: '/agency/settings',
    UPDATE_PROFILE: '/agency/settings',
    UPLOAD_LOGO: '/agency/logo',
    DRIVER_BY_ID: (id: string) => `/agency/drivers/${id}`,
    EXTEND_PERMISSION: (id: string) => `/agency/drivers/${id}/extend-permission`,
    SUSPEND_DRIVER: (id: string) => `/agency/drivers/${id}/suspend`,
    REACTIVATE_DRIVER: (id: string) => `/agency/drivers/${id}/reactivate`,
    BLACKLIST_DRIVER: (id: string) => `/agency/drivers/${id}/blacklist`,
    DRIVER_HISTORY: (id: string) => `/agency/drivers/${id}/history`,
  },
  DRIVERS: {
    BASE: '/drivers',
    BY_ID: (id: string) => `/drivers/${id}`,
    METRICS: (id: string) => `/drivers/${id}/metrics`,
    PREFERENCES: '/drivers/preferences',
    SHIFT: {
      START: '/drivers/shift/start',
      CURRENT: '/drivers/shift/current',
      END: (id: string) => `/drivers/shift/${id}/end`,
      GOALS: '/drivers/shift/goals',
    },
    PERFORMANCE: {
      WEEKLY: '/drivers/performance/weekly',
    },
    BADGES: '/drivers/badges',
  },
  ADMIN: {
    // General Admin Routes
    BASE: '/admin',
    USERS: '/admin/users',
    SEARCH_USERS: '/admin/search',
    ORDERS: '/admin/orders',
    BATCH_ASSIGN: '/admin/orders/batch-assign',
    ASSIGN_DRIVER: (id: string) => `/admin/orders/${id}/assign-driver`,
    REASSIGN_ORDER: (id: string) => `/admin/orders/${id}/reassign`,
    ORDER_STATUS: (id: string) => `/admin/orders/${id}/status`,
    ORDER_ASSIGNMENT_HISTORY: (id: string) => `/admin/orders/${id}/assignment-history`,
    DRIVERS: '/admin/drivers',
    LIVE_DRIVERS: '/admin/live-drivers',
    FINANCE: '/admin/finance',
    FINANCE_TRANSACTIONS: '/admin/finance/transactions',
    AUDIT_LOGS: '/admin/audit-logs',
    SETTINGS: '/admin/settings',
    BROADCAST: '/admin/notifications/broadcast',
    
    // System/Global Admin Routes
    STATS: '/admin/system/stats',
    SYSTEM_HEALTH: '/admin/system/health',
    WITHDRAWALS: '/admin/dashboard/withdrawals',
    UPDATE_WITHDRAWAL_STATUS: (id: string) => `/admin/dashboard/withdrawals/${id}/status`,
    
    // Pricing Config
    PRICING: {
      CURRENT: '/admin/pricing/current',
      UPDATE: '/admin/pricing/update',
    },

    // Region Management
    REGIONS: '/admin/regions',
    ORPHAN_DRIVERS: '/admin/drivers/orphans',
    REASSIGN_DRIVER: (driverId: string) => `/admin/drivers/${driverId}/reassign-agency`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  WALLET: {
    BASE: '/wallets',
    TRANSACTIONS: '/wallets/transactions',
    WITHDRAW: '/wallets/withdraw',
    DEPOSIT: '/wallets/deposit',
    // Driver Endpoints
    BALANCE: '/wallets/balance',
    PENDING_COD: '/wallets/pending-cod',
    PENDING_COD_REMITTANCES: '/wallets/pending-cod-remittances',
    COD_REMITTANCE: '/wallets/cod-remittance',
    WITHDRAWAL_REQUEST: '/wallets/withdrawal-request',
    MY_WITHDRAWALS: '/wallets/withdrawals',
    EARNINGS_SUMMARY: '/wallets/earnings/summary',
    DAILY_EARNINGS: '/wallets/daily-earnings',
    STATS: '/wallets/stats',
    CUSTOMER_STATS: '/wallets/stats/customer',
    BONUSES: '/wallets/bonuses',
    // Agency Endpoints
    AGENCY_BALANCE: '/wallets/agency/balance',
    AGENCY_COMMISSIONS: '/wallets/agency/commissions',
    AGENCY_REMITTANCES: '/wallets/agency/remittances',
    AGENCY_PAYOUTS: '/wallets/agency/payout-requests',
    AGENCY_PAYOUT_REQUEST: '/wallets/agency/payout-request',
    CONFIRM_COD: (id: string) => `/wallets/confirm-cod/${id}`,
    // Admin Wallet Endpoints
    ALL: '/wallets/all',
    WITHDRAWAL_REQUESTS: '/wallets/withdrawal-requests',
    APPROVE_WITHDRAWAL: (id: string) => `/wallets/withdrawal-requests/${id}/approve`,
    REJECT_WITHDRAWAL: (id: string) => `/wallets/withdrawal-requests/${id}/reject`,
    AGENCY_PAYOUT_REQUESTS: '/wallets/agency-payout-requests',
    APPROVE_AGENCY_PAYOUT: (id: string) => `/wallets/agency-payout-requests/${id}/approve`,
    REJECT_AGENCY_PAYOUT: (id: string) => `/wallets/agency-payout-requests/${id}/reject`,
    RECONCILE_BATCH: '/wallets/reconcile-batch',
    FINANCE_SUMMARY: '/admin/finance/summary',
    STATEMENT_CSV: '/wallets/statement/csv',
    FREEZE: (id: string) => `/wallets/${id}/freeze`,
    // Admin Financial Operations
    ADMIN_PLATFORM_WALLET: '/admin/financial/wallet',
    ADMIN_COD_REMITTANCES: '/admin/financial/cod-remittances',
    ADMIN_PENDING_COD_REMITTANCES: '/admin/financial/cod-remittances/pending',
    ADMIN_ACCEPT_COD_REMITTANCE: (id: string) => `/admin/financial/cod-remittances/${id}/accept`,
    ADMIN_REJECT_COD_REMITTANCE: (id: string) => `/admin/financial/cod-remittances/${id}/reject`,
    ADMIN_BATCH_PAYOUT_DRIVERS: '/admin/financial/payout/drivers/all',
    ADMIN_BATCH_PAYOUT_AGENCIES: '/admin/financial/payout/agencies/all',
    ADMIN_PAYOUT_DRIVER: (id: string) => `/admin/financial/payout/driver/${id}`,
    ADMIN_PAYOUT_AGENCY: (id: string) => `/admin/financial/payout/agency/${id}`,
  },
  ROUTING: {
    DRIVER_ROUTE: (driverId: string) => `/routing/driver/${driverId}/route`,
    REOPTIMIZE: (driverId: string) => `/routing/driver/${driverId}/reoptimize`,
    REORDER: (driverId: string) => `/routing/driver/${driverId}/reorder`,
    COMPLETE_PICKUP: (orderId: string) => `/routing/stop/${orderId}/complete-pickup`,
    COMPLETE_DELIVERY: (orderId: string) => `/routing/stop/${orderId}/complete-delivery`,
    ETA_CASCADE: (driverId: string) => `/routing/driver/${driverId}/eta-cascade`,
    TOUR_STATS: (driverId: string) => `/routing/driver/${driverId}/tour-stats`,
  }
};
