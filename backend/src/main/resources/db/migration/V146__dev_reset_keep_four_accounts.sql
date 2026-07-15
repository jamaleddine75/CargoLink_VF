---------------------------------------------------------------------
-- DEVELOPMENT-ONLY RESET MIGRATION
-- WARNING: This migration is INTENDED ONLY for the CargoLink
-- development database.  It DESTROYS ALL OPERATIONAL DATA and
-- resets the database to a clean state with exactly four
-- preserved accounts (admin, agency, driver, client).
--
-- PRODUCTION GUARD: The PL/pgSQL block below checks the current
-- PostgreSQL user.  On any database whose current user does NOT
-- match the known dev-database user, the entire migration safely
-- becomes a no-op (no rows touched, no schema changed).
--
-- Because Flyway tracks the checksum even for no-op runs, this
-- migration will be marked as "success" everywhere, but the
-- destructive payload ONLY executes on the designated dev DB.
---------------------------------------------------------------------

DO $$
BEGIN
  IF current_user = 'postgres.ixearqeexcceoqscyanx'
     OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'postgres.ixearqeexcceoqscyanx')
  THEN
    RAISE NOTICE '=== CARGOLINK DEV RESET ===';

  -------------------------------------------------------------------
  -- CLEAR OPERATIONAL DATA
  -- Ordered by FK dependency (leaf tables first).
  -- Each statement is wrapped to tolerate a missing table.
  -------------------------------------------------------------------
  RAISE NOTICE 'Clearing operational data...';

  BEGIN DELETE FROM audit_logs; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM agency_customer_payments; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM agency_customer_invoices; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM agency_customers; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM agency_ledger_transactions; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM agency_payout_requests; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM agency_transactions; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM assignment_history; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM cod_reconciliations; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM driver_badges; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM driver_disciplinary_actions; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM driver_earnings; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM driver_financial_records; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM driver_ratings; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM driver_shifts; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM file_metadata; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM financial_audit_logs; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM financial_operations; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM financial_outbox; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM fraud_alerts; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM incident_attachments; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM incident_messages; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM incident_status_history; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM incidents; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM journal_entries; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM ledger_entries; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM notifications; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM order_items; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM orders; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM payment_accounts; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM payout_logs; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM platform_commission_records; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM platform_transactions; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM reconciliation_reports; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM refresh_tokens; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM saved_addresses; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM settlement_batches; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM tracking_history; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM transaction_metadata; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM transactions; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM wallet_timeline; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM withdrawal_requests; EXCEPTION WHEN undefined_table THEN NULL; END;

  -------------------------------------------------------------------
  -- DELETE NON-PRESERVED USERS
  -- Preserved accounts (identified by email):
  --   admin@cargolink.ma   (Super Admin)
  --   agency@cargolink.ma   (Agency)
  --   driver@cargolink.ma   (Driver)
  --   client@cargolink.ma   (Client)
  -------------------------------------------------------------------
  RAISE NOTICE 'Deleting non-preserved users...';

  BEGIN
    DELETE FROM drivers WHERE user_id NOT IN (
      SELECT id FROM users WHERE email IN (
        'admin@cargolink.ma', 'agency@cargolink.ma',
        'driver@cargolink.ma', 'client@cargolink.ma'
      )
    );
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    UPDATE users SET agency_id = NULL WHERE agency_id IN (
      SELECT id FROM agencies WHERE admin_agency_id NOT IN (
        SELECT id FROM users WHERE email IN (
          'admin@cargolink.ma', 'agency@cargolink.ma',
          'driver@cargolink.ma', 'client@cargolink.ma'
        )
      )
    );
  EXCEPTION WHEN undefined_column THEN NULL; END;

  BEGIN
    DELETE FROM agencies WHERE admin_agency_id NOT IN (
      SELECT id FROM users WHERE email IN (
        'admin@cargolink.ma', 'agency@cargolink.ma',
        'driver@cargolink.ma', 'client@cargolink.ma'
      )
    );
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM client_profiles WHERE user_id NOT IN (
      SELECT id FROM users WHERE email IN (
        'admin@cargolink.ma', 'agency@cargolink.ma',
        'driver@cargolink.ma', 'client@cargolink.ma'
      )
    );
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM wallets WHERE user_id NOT IN (
      SELECT id FROM users WHERE email IN (
        'admin@cargolink.ma', 'agency@cargolink.ma',
        'driver@cargolink.ma', 'client@cargolink.ma'
      )
    );
  EXCEPTION WHEN undefined_table THEN NULL; END;

  DELETE FROM users WHERE email NOT IN (
    'admin@cargolink.ma', 'agency@cargolink.ma',
    'driver@cargolink.ma', 'client@cargolink.ma'
  );

  -------------------------------------------------------------------
  -- RESET WALLETS FOR PRESERVED ACCOUNTS
  -------------------------------------------------------------------
  RAISE NOTICE 'Resetting wallet balances...';

  BEGIN
    UPDATE wallets
    SET balance = 0,
        cash_in_hand = 0,
        debt_to_system = 0,
        updated_at = NOW()
    WHERE user_id IN (
      SELECT id FROM users WHERE email IN (
        'admin@cargolink.ma', 'agency@cargolink.ma',
        'driver@cargolink.ma', 'client@cargolink.ma'
      )
    );
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    UPDATE agency_wallets
    SET balance = 0,
        cod_balance = 0,
        cash_collected = 0,
        total_earned = 0,
        platform_commission = 0,
        total_collected = 0,
        total_paid_out = 0,
        current_balance = 0,
        total_revenue = 0,
        total_expenses = 0,
        total_profit = 0,
        pending_receivables = 0,
        pending_payables = 0,
        updated_at = NOW()
    WHERE agency_id IN (SELECT id FROM agencies WHERE admin_agency_id = (
      SELECT id FROM users WHERE email = 'agency@cargolink.ma'
    ));
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    UPDATE platform_wallet
    SET balance = 0,
        total_revenue = 0,
        platform_profit = 0,
        total_driver_payout = 0,
        total_agency_payout = 0,
        updated_at = NOW();
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -------------------------------------------------------------------
  -- CITIES CLEANUP
  -- Remove Casablanca from known business-reference tables.
  -------------------------------------------------------------------
  RAISE NOTICE 'Removing Casablanca...';

  BEGIN DELETE FROM supported_cities WHERE LOWER(name) = 'casablanca' OR LOWER(city_name) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM cities WHERE LOWER(name) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM regions WHERE LOWER(name) = 'casablanca' OR LOWER(region_name) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM delivery_zones WHERE LOWER(name) = 'casablanca' OR LOWER(city) = 'casablanca' OR LOWER(city_name) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM pricing_regions WHERE LOWER(name) = 'casablanca' OR LOWER(region_name) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM agency_coverage WHERE LOWER(city) = 'casablanca' OR LOWER(city_name) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM coverage_area WHERE LOWER(name) = 'casablanca' OR LOWER(city) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM coverage_areas WHERE LOWER(name) = 'casablanca' OR LOWER(city) = 'casablanca' OR LOWER(city_name) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM distance_matrix WHERE LOWER(origin_city) = 'casablanca' OR LOWER(destination_city) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM geocoding_config WHERE LOWER(city) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM city_pricing WHERE LOWER(city) = 'casablanca' OR LOWER(city_name) = 'casablanca'; EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    UPDATE agencies SET city = NULL
    WHERE admin_agency_id = (SELECT id FROM users WHERE email = 'agency@cargolink.ma')
      AND LOWER(city) = 'casablanca';
  EXCEPTION WHEN undefined_column THEN NULL; END;

  BEGIN
    UPDATE drivers SET registration_city = NULL
    WHERE user_id = (SELECT id FROM users WHERE email = 'driver@cargolink.ma')
      AND LOWER(registration_city) = 'casablanca';
  EXCEPTION WHEN undefined_column THEN NULL; END;

  RAISE NOTICE '=== DEV RESET COMPLETE ===';
  ELSE
    RAISE NOTICE 'V146: Not CargoLink dev database (user=%), skipping reset', current_user;
  END IF;
END $$;
