import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api';
const FRONTEND = 'http://localhost:3000';
const DEMO_USERS = {
  admin: { email: 'admin@cargolink.ma', password: 'demo123' },
  agency: { email: 'agency@cargolink.ma', password: 'demo123' },
  driver: { email: 'driver@cargolink.ma', password: 'demo123' },
  client: { email: 'client@cargolink.ma', password: 'demo123' },
};

async function loginContext(playwright, email, password) {
  const ctx = await playwright.request.newContext();
  const res = await ctx.post(`${API_BASE}/auth/login`, { data: { email, password } });
  expect(res.status()).toBe(200);
  return ctx;
}

test.describe('CargoLink E2E Workflow', () => {

  test('REGISTER: New customer can register via API', async ({ request }) => {
    const uniqueSuffix = Date.now();
    const email = `e2e.${uniqueSuffix}@test.com`;

    const res = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email,
        password: 'TestPass123!',
        firstName: 'E2E',
        lastName: 'Customer',
        phoneNumber: '0612345678',
        role: 'CUSTOMER',
        address: '123 Test Street',
        city: 'Casablanca',
      },
    });
    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.token).toBeNull();
    expect(body.role).toBe('CUSTOMER');
    expect(body.email).toBe(email);
    expect(body.message).toContain('pending approval');
  });

  test('LOGIN: Each demo role can login via UI and access their dashboard', async ({ page }) => {
    const testCases = [
      { role: 'Admin', email: 'admin@cargolink.ma', password: 'demo123', dashboardUrl: '/admin/dashboard' },
      { role: 'Agency', email: 'agency@cargolink.ma', password: 'demo123', dashboardUrl: '/agency/dashboard' },
      { role: 'Driver', email: 'driver@cargolink.ma', password: 'demo123', dashboardUrl: '/driver/dashboard' },
      { role: 'Client', email: 'client@cargolink.ma', password: 'demo123', dashboardUrl: '/client/dashboard' },
    ];

    for (const tc of testCases) {
      await test.step(`Login as ${tc.role}`, async () => {
        await page.goto('/login');
        await page.waitForSelector('input[id="email"]', { timeout: 10000 });
        await page.fill('input[id="email"]', tc.email);
        await page.fill('input[id="password"]', tc.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(`**${tc.dashboardUrl}`, { timeout: 20000 });
        expect(page.url()).toContain(tc.dashboardUrl);
      });
    }
  });

  test('CREATE ORDER: Authenticated client can create a delivery order', async ({ playwright }) => {
    const ctx = await loginContext(playwright, DEMO_USERS.client.email, DEMO_USERS.client.password);

    const res = await ctx.post(`${API_BASE}/orders`, {
      data: {
        pickupAddress: '123 Pickup Street, Casablanca',
        deliveryAddress: '456 Delivery Avenue, Casablanca',
        senderCity: 'Casablanca',
        receiverCity: 'Casablanca',
        pickupContactName: 'E2E Pickup',
        receiverName: 'E2E Receiver',
        receiverPhone: '0611111111',
        codAmount: 250.00,
        items: [{ itemName: 'Laptop', quantity: 1 }],
      },
    });

    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.id).toBeTruthy();
    expect(body.status).toBe('PENDING');
    expect(body.trackingNumber).toBeTruthy();
    await ctx.dispose();
  });

  test('ASSIGN DRIVER: Admin can assign driver to a pending order', async ({ playwright }) => {
    const ctx = await loginContext(playwright, DEMO_USERS.admin.email, DEMO_USERS.admin.password);

    // Find a pre-seeded pending order
    const ordersRes = await ctx.get(`${API_BASE}/admin/orders?status=PENDING&size=5`);
    expect(ordersRes.status()).toBe(200);
    const ordersBody = await ordersRes.json();
    const orderId = ordersBody?.content?.[0]?.id;
    expect(orderId).toBeTruthy();

    // Find a driver
    const usersRes = await ctx.get(`${API_BASE}/admin/users?role=DRIVER&size=10`);
    expect(usersRes.status()).toBe(200);
    const usersBody = await usersRes.json();
    const driverId = usersBody?.content?.[0]?.driverId;
    expect(driverId).toBeTruthy();

    // Assign driver
    const assignRes = await ctx.put(`${API_BASE}/admin/orders/${orderId}/assign-driver?driverId=${driverId}`);
    expect([200, 201, 204]).toContain(assignRes.status());

    // Verify order is now assigned
    const orderRes = await ctx.get(`${API_BASE}/orders/${orderId}`);
    expect(orderRes.status()).toBe(200);
    const updatedOrder = await orderRes.json();
    expect(updatedOrder.status).toMatch(/ASSIGNED|VALIDATED/);
    await ctx.dispose();
  });

  test('DELIVER ORDER: Driver can complete delivery flow', async ({ playwright }) => {
    const clientCtx = await loginContext(playwright, DEMO_USERS.client.email, DEMO_USERS.client.password);
    const adminCtx = await loginContext(playwright, DEMO_USERS.admin.email, DEMO_USERS.admin.password);
    const driverCtx = await loginContext(playwright, DEMO_USERS.driver.email, DEMO_USERS.driver.password);

    try {
      // Create order as client
      const createRes = await clientCtx.post(`${API_BASE}/orders`, {
        data: {
          pickupAddress: 'Deliver E2E Pickup, Casablanca',
          deliveryAddress: 'Deliver E2E Dropoff, Casablanca',
          senderCity: 'Casablanca',
          receiverCity: 'Casablanca',
          pickupContactName: 'Sender Name',
          receiverName: 'Recipient Name',
          receiverPhone: '0644444444',
          codAmount: 300.00,
          items: [{ itemName: 'Delivery Test Item', quantity: 1 }],
        },
      });
      expect(createRes.status()).toBe(200);
      const order = await createRes.json();
      const orderId = order.id;
      expect(orderId).toBeTruthy();

      // Admin assigns driver
      const usersRes = await adminCtx.get(`${API_BASE}/admin/users?role=DRIVER&size=10`);
      expect(usersRes.status()).toBe(200);
      const usersBody = await usersRes.json();
      const driverId = usersBody?.content?.[0]?.driverId;
      expect(driverId).toBeTruthy();

      const assignRes = await adminCtx.put(`${API_BASE}/admin/orders/${orderId}/assign-driver?driverId=${driverId}`);
      expect([200, 201, 204]).toContain(assignRes.status());

      // Driver picks up -> PICKED_UP
      const pickupRes = await driverCtx.put(`${API_BASE}/orders/driver/status/${orderId}`, {
        data: { status: 'PICKED_UP' },
      });
      expect([200, 201]).toContain(pickupRes.status());

      // Driver marks ON_THE_WAY
      const onWayRes = await driverCtx.put(`${API_BASE}/orders/driver/status/${orderId}`, {
        data: { status: 'ON_THE_WAY' },
      });
      expect([200, 201]).toContain(onWayRes.status());

      // Driver delivers -> DELIVERED
      const deliverRes = await driverCtx.put(`${API_BASE}/orders/driver/status/${orderId}`, {
        data: { status: 'DELIVERED' },
      });
      expect([200, 201]).toContain(deliverRes.status());

      // Verify final status as admin
      const verifyRes = await adminCtx.get(`${API_BASE}/orders/${orderId}`);
      expect(verifyRes.status()).toBe(200);
      const finalOrder = await verifyRes.json();
      expect(finalOrder.status).toBe('DELIVERED');
    } finally {
      await clientCtx.dispose();
      await adminCtx.dispose();
      await driverCtx.dispose();
    }
  });

  test('WALLET VERIFICATION: Wallet balances reflect platform activity', async ({ playwright }) => {
    const adminCtx = await loginContext(playwright, DEMO_USERS.admin.email, DEMO_USERS.admin.password);
    const driverCtx = await loginContext(playwright, DEMO_USERS.driver.email, DEMO_USERS.driver.password);
    const clientCtx = await loginContext(playwright, DEMO_USERS.client.email, DEMO_USERS.client.password);
    const agencyCtx = await loginContext(playwright, DEMO_USERS.agency.email, DEMO_USERS.agency.password);

    try {
      // Check individual wallets
      const walletChecks = [
        { ctx: driverCtx, name: 'Driver', endpoint: `${API_BASE}/wallets/balance` },
        { ctx: clientCtx, name: 'Client', endpoint: `${API_BASE}/wallets/balance` },
        { ctx: agencyCtx, name: 'Agency', endpoint: `${API_BASE}/wallets/agency/balance` },
      ];

      for (const wc of walletChecks) {
        await test.step(`Verify ${wc.name} wallet`, async () => {
          const res = await wc.ctx.get(wc.endpoint);
          expect(res.status()).toBe(200);
          const wallet = await res.json();
          expect(wallet).toBeTruthy();
          expect(wallet.balance).toBeDefined();
        });
      }

      // Verify transactions
      const txRes = await driverCtx.get(`${API_BASE}/wallets/transactions`);
      expect(txRes.status()).toBe(200);

      // Admin sees all wallets
      const allWalletsRes = await adminCtx.get(`${API_BASE}/admin/system/wallets`);
      expect(allWalletsRes.status()).toBe(200);
      const allWallets = await allWalletsRes.json();
      expect(allWallets.totalElements).toBeGreaterThanOrEqual(3);
    } finally {
      await adminCtx.dispose();
      await driverCtx.dispose();
      await clientCtx.dispose();
      await agencyCtx.dispose();
    }
  });

});
