package com.deliveryplatform.config;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.pattern.ClassicConverter;

/**
 * Custom Logback converter that provides clean, professional level indicators.
 * Replaces emojis with standard text-based markers.
 */
public class LogCleanConverter extends ClassicConverter {
    @Override
    public String convert(ILoggingEvent event) {
        return switch (event.getLevel().toInt()) {
            case Level.INFO_INT -> "[INFO]";
            case Level.WARN_INT -> "[WARN]";
            case Level.ERROR_INT -> "[ERROR]";
            case Level.DEBUG_INT -> "[DEBUG]";
            case Level.TRACE_INT -> "[TRACE]";
            default -> "[LOG]";
        };
    }
}
