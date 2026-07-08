const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.ixearqeexcceoqscyanx:CargoLink%400101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const drivers = await client.query('SELECT id, user_id FROM drivers LIMIT 5');
  console.log("DRIVERS:");
  console.table(drivers.rows);
  await client.end();
}

run().catch(console.error);
