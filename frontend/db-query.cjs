const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.ixearqeexcceoqscyanx:CargoLink@0101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  const res = await client.query('SELECT * FROM wallets');
  console.log('wallets:', res.rows);
  
  const resUsers = await client.query('SELECT id, email FROM users');
  console.log('users:', resUsers.rows);

  const resDrivers = await client.query('SELECT id, user_id FROM drivers');
  console.log('drivers:', resDrivers.rows);
  
  await client.end();
}

run().catch(console.error);
