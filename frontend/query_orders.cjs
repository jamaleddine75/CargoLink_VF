const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.ixearqeexcceoqscyanx:CargoLink%400101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const orders = await client.query('SELECT id, cod_amount, delivery_fee FROM orders LIMIT 5');
  console.log("ORDERS:");
  console.table(orders.rows);
  await client.end();
}

run().catch(console.error);
