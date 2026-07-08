const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.ixearqeexcceoqscyanx:CargoLink%400101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  console.log("====================================================");
  console.log("STEP 1 — VERIFY DATABASE");
  console.log("====================================================");
  
  const wallets = await client.query('SELECT * FROM wallets');
  console.log("\nWALLETS:");
  console.table(wallets.rows);

  const transactions = await client.query('SELECT * FROM transactions');
  console.log("\nTRANSACTIONS:");
  console.table(transactions.rows);

  const orders = await client.query('SELECT * FROM orders');
  console.log("\nORDERS:");
  console.table(orders.rows);

  const withdrawals = await client.query('SELECT * FROM withdrawal_requests');
  console.log("\nWITHDRAWAL REQUESTS:");
  console.table(withdrawals.rows);

  const drivers = await client.query('SELECT * FROM drivers');
  console.log("\nDRIVER PROFILES:");
  console.table(drivers.rows);

  const users = await client.query('SELECT * FROM users');
  console.log("\nUSERS:");
  console.table(users.rows);

  await client.end();
}

run().catch(console.error);
