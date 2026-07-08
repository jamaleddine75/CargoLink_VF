const axios = require('axios');

async function testApi() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'driver@cargolink.ma',
      password: 'password' // Assuming default password or we'll get it from DB
    });

    const token = loginRes.data.token;
    console.log("Logged in. Token:", token.substring(0, 20) + "...");

    // 2. Get Balance
    const balanceRes = await axios.get('http://localhost:8080/api/wallets/balance', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("BALANCE DTO:");
    console.log(JSON.stringify(balanceRes.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testApi();
