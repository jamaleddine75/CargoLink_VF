package com.deliveryplatform.config;

import com.deliveryplatform.security.JwtChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Senior-level WebSocket Configuration
 * Fixes CORS errors for WebSocket and SockJS connections.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origin-patterns:http://localhost:5173}")
    private String[] allowedOrigins;

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Allow configured origins dynamically
        // Endpoint MUST match the frontend WS_URL (e.g., /ws)
        
        // 1. SockJS Support (Requires /ws/info to be open in Security)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();
        
        // 2. Direct WebSocket Support (No SockJS)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins);
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }
}