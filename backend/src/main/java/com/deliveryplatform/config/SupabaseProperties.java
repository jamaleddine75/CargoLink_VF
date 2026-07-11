package com.deliveryplatform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.supabase")
public class SupabaseProperties {
    private String url;
    private String key;
    private Map<String, String> buckets;

    public String getBucket(String name) {
        if (buckets != null && buckets.containsKey(name)) {
            return buckets.get(name);
        }
        return name;
    }
}
