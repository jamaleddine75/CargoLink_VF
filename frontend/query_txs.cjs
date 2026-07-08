const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.ixearqeexcceoqscyanx:CargoLink%400101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const txs = await client.query('SELECT wallet_id, type, COUNT(*) FROM transactions GROUP BY wallet_id, type');
  console.log("TRANSACTIONS GROUPED:");
  console.table(txs.rows);
  await client.end();
}

run().catch(console.error);
