package com.deliveryplatform.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AgencyWalletSchemaCompatibility {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void ensureAgencyWalletProjectionColumns() {
        log.info("AgencyWalletSchemaCompatibility: ensuring projection columns exist on agency_wallets...");
        jdbcTemplate.execute("ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS projection_rebuilt_at TIMESTAMP WITHOUT TIME ZONE");
        jdbcTemplate.execute("ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS projection_source_journal_id UUID");
        jdbcTemplate.execute("ALTER TABLE agency_wallets ADD COLUMN IF NOT EXISTS projection_status VARCHAR(30) NOT NULL DEFAULT 'CURRENT'");
    }
}