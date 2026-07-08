const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.ixearqeexcceoqscyanx:CargoLink%400101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const orders = await client.query('SELECT status, COUNT(*) FROM orders GROUP BY status');
  console.log("ORDERS:");
  console.table(orders.rows);

  const driverProfiles = await client.query('SELECT id, user_id FROM driver_profiles LIMIT 5');
  console.log("DRIVER PROFILES:");
  console.table(driverProfiles.rows);

  const txs = await client.query('SELECT wallet_id, type, amount, status FROM transactions LIMIT 10');
  console.log("TRANSACTIONS:");
  console.table(txs.rows);

  await client.end();
}

run().catch(console.error);
