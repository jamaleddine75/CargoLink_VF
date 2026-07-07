package com.deliveryplatform.config;

import com.deliveryplatform.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

/**
 * Senior-level Security Configuration
 * Fixes ALL CORS issues for REST and WebSocket communication.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origin-patterns:http://localhost:5173}")
    private java.util.List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults()) // Uses the CorsConfigurationSource bean below
            .csrf(csrf -> csrf.disable()) // JWT is stateless — CSRF not applicable
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 1. ALWAYS allow OPTIONS for preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // 2. Publicly accessible endpoints
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/refresh",
                    "/api/test/paypal-payout",   // PayPal webhook callback — must stay public
                    "/api/auth/status",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/uploads/**",
                    "/api/public/**",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/ws/**",
                    "/ws/info/**",
                    "/api/webhooks/**"

                ).permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")

                // 3. Authenticated Auth Endpoints
                .requestMatchers(
                    "/api/auth/me",
                    "/api/auth/update",
                    "/api/auth/password",
                    "/api/auth/avatar"
                ).authenticated()

                // 4. Role-based access
                .requestMatchers("/api/address-book", "/api/address-book/**").hasRole("CLIENT")
                .requestMatchers("/api/client/support/**").hasRole("CLIENT")
                .requestMatchers("/api/driver/**").hasAnyAuthority("DRIVER", "ROLE_DRIVER")
                .requestMatchers("/api/drivers/**").hasAnyRole("DRIVER", "ADMIN", "AGENCY")
                .requestMatchers(HttpMethod.POST, "/api/orders", "/api/orders/").authenticated()
                .requestMatchers("/api/orders", "/api/orders/**").hasAnyRole("CLIENT", "DRIVER", "ADMIN")
                .requestMatchers("/api/admin", "/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/agency", "/api/agency/**").hasRole("AGENCY")
                .requestMatchers("/api/agencies", "/api/agencies/**").hasAnyRole("AGENCY", "ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    log.error("Unauthorized error: {}", authException.getMessage());
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"message\": \"Session expired or invalid token. Please log in again.\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    log.error("Access denied error: {}", accessDeniedException.getMessage());
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("{\"message\": \"Access denied. You do not have permission to access this resource.\"}");
                })
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Centralized Global CORS Configuration
     * This bean is used by Spring Security and REST controllers.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow configured origins dynamically
        configuration.setAllowedOriginPatterns(allowedOrigins);
        
        // Allowed Methods: MUST include OPTIONS for preflight
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Allowed Headers: Use "*" to be robust, or specify exactly what's needed
        configuration.setAllowedHeaders(Collections.singletonList("*"));
        
        // Exposed Headers: Important for JWT and content types
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "Set-Cookie"));
        
        // MUST support credentials for Cookies/Authorization headers
        configuration.setAllowCredentials(true);
        
        // Cache preflight results for 1 hour
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
