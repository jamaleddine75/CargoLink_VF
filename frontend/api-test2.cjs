const axios = require('axios');

async function run() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkcml2ZXJAY2FyZ29saW5rLm1hIiwiaWF0IjoxNzgzNDM0NzQ1LCJleHAiOjE3ODM0MzgzNDV9.boYl3tVLjevo_e-KwT825CAs78jGm6ZYTqM9Qrtpfmk';
    const walletRes = await axios.get('http://localhost:8080/api/wallets/balance', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Wallet Response:', walletRes.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

run();
