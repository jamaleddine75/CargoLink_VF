const axios = require('axios');

async function run() {
  console.log("====================================================");
  console.log("STEP 7 — VERIFY ORDER FLOW");
  console.log("====================================================");

  try {
    // 1. Login as Admin to create an order
    const adminLogin = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'admin@cargolink.ma',
      password: 'password'
    });
    const adminToken = adminLogin.data.accessToken;
    console.log("Admin login successful.");

    // 2. Create an order
    const createOrderResponse = await axios.post('http://localhost:8080/api/orders', {
      originAddress: '123 Main St',
      destinationAddress: '456 Delivery Ave',
      pickupLat: 33.5731, pickupLng: -7.5898,
      deliveryLat: 33.5899, deliveryLng: -7.6039,
      recipientName: 'Test Recipient',
      recipientPhone: '1234567890',
      description: 'Test Order for Wallet',
      urgent: false,
      heavy: false,
      codAmount: 150.00,
      deliveryFee: 25.00
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    const orderId = createOrderResponse.data.id;
    console.log(`Order created: ${orderId}`);

    // 3. Login as Driver
    const driverLogin = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'driver@cargolink.ma',
      password: 'password'
    });
    const driverToken = driverLogin.data.accessToken;
    console.log("Driver login successful.");

    // 4. Accept Order (Driver)
    await axios.post(`http://localhost:8080/api/orders/${orderId}/accept`, {}, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log(`Order ${orderId} ACCEPTED.`);

    // 5. Update Status: PICKED_UP
    await axios.put(`http://localhost:8080/api/orders/${orderId}/status`, {
      status: 'PICKED_UP'
    }, { headers: { Authorization: `Bearer ${driverToken}` } });
    console.log(`Order ${orderId} PICKED_UP.`);

    // 6. Update Status: ON_THE_WAY
    await axios.put(`http://localhost:8080/api/orders/${orderId}/status`, {
      status: 'ON_THE_WAY'
    }, { headers: { Authorization: `Bearer ${driverToken}` } });
    console.log(`Order ${orderId} ON_THE_WAY.`);

    // 7. Update Status: DELIVERED (This is where we expect it to fail due to Geofencing or codCollected issue)
    console.log("Attempting to mark as DELIVERED...");
    await axios.put(`http://localhost:8080/api/orders/${orderId}/status`, {
      status: 'DELIVERED',
      lat: 0.0, // Sending dummy coordinates to trigger geofencing failure
      lng: 0.0,
      codCollected: true
    }, { headers: { Authorization: `Bearer ${driverToken}` } });
    console.log(`Order ${orderId} DELIVERED successfully! (Wait, it shouldn't have)`);

  } catch (error) {
    if (error.response) {
      console.error("\nEXECUTION STOPPED!");
      console.error(`Status: ${error.response.status}`);
      console.error(`Error:`, error.response.data);
    } else {
      console.error(error);
    }
  }
}

run();
