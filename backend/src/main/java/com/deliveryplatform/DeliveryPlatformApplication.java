package com.deliveryplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;

@SpringBootApplication(scanBasePackages = "com.deliveryplatform")
@EnableJpaAuditing
@EnableScheduling
@EnableAsync
@Slf4j
public class DeliveryPlatformApplication {

    @Autowired
    private Environment env;

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(DeliveryPlatformApplication.class);
        app.setLogStartupInfo(false);
        app.run(args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        String port = env.getProperty("server.port", "8080");
        log.info("Server is RUNNING on port {}", port);
    }
}
 
