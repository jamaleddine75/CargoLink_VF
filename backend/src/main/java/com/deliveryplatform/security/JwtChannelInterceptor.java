package com.deliveryplatform.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;


/**
 * Interceptor to validate JWT tokens for WebSocket connections using STOMP.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String bearerToken = accessor.getFirstNativeHeader("Authorization");
            log.debug("WebSocket CONNECT: Authorization header: {}", bearerToken);

            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String jwt = bearerToken.substring(7);
                if (tokenProvider.validateToken(jwt)) {
                    String email = tokenProvider.getEmailFromToken(jwt);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    
                    accessor.setUser(authentication);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("WebSocket user authenticated: {}", email);
                } else {
                    log.warn("WebSocket CONNECT: Invalid JWT token");
                }
            } else {
                log.warn("WebSocket CONNECT: Missing or malformed Authorization header");
            }
        }

        return message;
    }
}
