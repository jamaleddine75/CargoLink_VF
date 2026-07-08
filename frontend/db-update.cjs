const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.ixearqeexcceoqscyanx:CargoLink@0101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  // Set the driver wallet balance to 1000
  await client.query("UPDATE wallets SET balance = 1000 WHERE user_id = '22222222-2222-2222-2222-222222222222'");
  
  const res = await client.query("SELECT id, user_id, balance FROM wallets WHERE user_id = '22222222-2222-2222-2222-222222222222'");
  console.log('updated wallet:', res.rows);
  
  await client.end();
}

run().catch(console.error);
