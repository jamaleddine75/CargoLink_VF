const axios = require('axios');

async function run() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'driver@cargolink.ma',
      password: 'CargoLink@0101'
    });
    const token = loginRes.data.accessToken;
    console.log('Got token');

    // 2. Get wallet balance
    const walletRes = await axios.get('http://localhost:8080/api/wallets/balance', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Wallet Response:', walletRes.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

run();
