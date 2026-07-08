process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.ixearqeexcceoqscyanx:CargoLink@0101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const userId = '11111111-1111-1111-1111-111111111111';
  const payId = '22222222-2222-2222-2222-222222222222';
  const withId = '33333333-3333-3333-3333-333333333333';
  try {
    await client.query(`INSERT INTO users (id, email, password, role) VALUES ($1, 'test-flyway@test.com', 'test', 'DRIVER') ON CONFLICT DO NOTHING`, [userId]);
    await client.query(`INSERT INTO payment_accounts (id, user_id, provider, account_identifier) VALUES ($1, $2, 'PAYPAL', 'test@test.com') ON CONFLICT DO NOTHING`, [payId, userId]);
    await client.query(`INSERT INTO withdrawal_requests (id, amount, status, created_at, user_id, payment_account_id, receiver_email_snapshot, provider) VALUES ($1, 100, 'PENDING', now(), $2, $3, 'test@test.com', 'PAYPAL')`, [withId, userId, payId]);
    console.log("Insert successful! Foreign keys and constraints verified.");
    
    // cleanup
    await client.query(`DELETE FROM withdrawal_requests WHERE id = $1`, [withId]);
    await client.query(`DELETE FROM payment_accounts WHERE id = $1`, [payId]);
    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    
  } catch (err) {
    console.error("Insert failed: ", err.message);
  } finally {
    await client.end();
  }
}
run();
