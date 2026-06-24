package com.deliveryplatform.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Utility to prevent log spam by deduplicating and throttling messages.
 * Ideal for scheduled tasks or high-frequency events.
 */
@Slf4j
@Component
public class LogThrottler {

    private final Map<String, Long> lastLoggedTime = new ConcurrentHashMap<>();

    /**
     * Logs an INFO message only if it hasn't been logged for the same key 
     * within the specified throttle period.
     * 
     * @param key Unique identifier for the event (e.g., "order-123")
     * @param message The message to log
     * @param interval Throttle interval
     * @param unit Time unit for the interval
     */
    public void info(String key, String message, long interval, TimeUnit unit) {
        if (shouldLog(key, interval, unit)) {
            log.info(message);
        }
    }

    /**
     * Logs a WARN message with throttling.
     */
    public void warn(String key, String message, long interval, TimeUnit unit) {
        if (shouldLog(key, interval, unit)) {
            log.warn(message);
        }
    }

    /**
     * Logs an ERROR message with throttling.
     */
    public void error(String key, String message, long interval, TimeUnit unit) {
        if (shouldLog(key, interval, unit)) {
            log.error(message);
        }
    }

    private boolean shouldLog(String key, long interval, TimeUnit unit) {
        long now = System.currentTimeMillis();
        long intervalMs = unit.toMillis(interval);
        
        Long last = lastLoggedTime.get(key);
        if (last == null || (now - last) > intervalMs) {
            lastLoggedTime.put(key, now);
            return true;
        }
        return false;
    }

    /**
     * Clears the cache to allow immediate logging of all keys.
     */
    public void clear() {
        lastLoggedTime.clear();
    }
}
