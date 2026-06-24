package com.deliveryplatform.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

 

/**
 * Demo class to showcase the professional minimalist logging system.
 */
@Slf4j
@Component
public class LoggingDemo {

    public void showExamples() {
        // Professional INFO logs
        log.info("Server is RUNNING");
        
        // Professional WARN logs
        log.warn("Dispatch: No drivers found for region [NORTH]");
        
        // Professional ERROR logs
        log.error("Database error occurred while processing order #1024");
        
        // Throttling Example (Ideal for Schedulers)
        for (int i = 0; i < 5; i++) {
            log.info("order-sync-task: Syncing orders with Supabase... (throttle not available)");
        }
    }
}
