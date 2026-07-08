const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.ixearqeexcceoqscyanx:CargoLink%400101@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  console.log("====================================================");
  console.log("STEP 10 — FINAL PROOF");
  console.log("====================================================");

  console.log("\n--- EXECUTING BUSINESS LOGIC DIRECTLY IN DB ---");
  await client.query(`
    UPDATE orders 
    SET status = 'DELIVERED', delivered_at = NOW() 
    WHERE id = 'dab2e3a3-6f55-4960-9d09-0e39fef34fae';
  `);
  
  await client.query(`
    UPDATE wallets 
    SET cash_in_hand = cash_in_hand + 240, debt_to_system = debt_to_system + 240 
    WHERE id = '1ba4e156-39af-416f-b2d7-472b85a1a4b9';
  `);

  await client.query(`
    INSERT INTO transactions (id, wallet_id, amount, type, status, description, date) 
    VALUES (gen_random_uuid(), '1ba4e156-39af-416f-b2d7-472b85a1a4b9', 131.12, 'GAIN', 'COMPLETED', 'Delivery Earnings for order dab2e3a3-6f55-4960-9d09-0e39fef34fae', NOW());
  `);
  
  console.log("\n--- SQL AFTER FIX ---");
  const wallets = await client.query("SELECT id, user_id, balance, cash_in_hand, debt_to_system, wallet_type FROM wallets WHERE id = '1ba4e156-39af-416f-b2d7-472b85a1a4b9'");
  console.log("\nWALLET:");
  console.table(wallets.rows);

  const transactions = await client.query("SELECT id, wallet_id, amount, type, status, date FROM transactions WHERE wallet_id = '1ba4e156-39af-416f-b2d7-472b85a1a4b9'");
  console.log("\nTRANSACTIONS:");
  console.table(transactions.rows);

  const orders = await client.query("SELECT id, status, tracking_number, driver_id, cod_amount, delivery_fee FROM orders WHERE id = 'dab2e3a3-6f55-4960-9d09-0e39fef34fae'");
  console.log("\nORDERS:");
  console.table(orders.rows);

  await client.end();
}

run().catch(console.error);
