const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.ixearqeexcceoqscyanx:CargoLink%400101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const orders = await client.query("SELECT id, status, driver_id, driver_earnings FROM orders WHERE driver_id = '88888888-8888-8888-8888-888888888888'");
  console.log("DRIVER ORDERS:");
  console.table(orders.rows);
  await client.end();
}

run().catch(console.error);
