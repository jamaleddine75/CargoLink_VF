const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.ixearqeexcceoqscyanx:CargoLink%400101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const txs = await client.query('SELECT COUNT(*) FROM transactions');
  console.log("TOTAL TXS:", txs.rows[0].count);
  await client.end();
}

run().catch(console.error);
