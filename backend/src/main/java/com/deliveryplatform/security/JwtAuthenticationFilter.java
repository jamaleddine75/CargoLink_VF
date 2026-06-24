package com.deliveryplatform.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Value("${app.dev.allow-query-token:false}")
    private boolean allowQueryToken;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String email = tokenProvider.getEmailFromToken(jwt);

                if (email != null) {
                    org.springframework.security.core.userdetails.UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    
                    // Always use authorities from the DB (userDetails) to ensure data integrity
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    
                    if (request.getRequestURI().startsWith("/api/client/support")) {
                        log.info("Auth Success: User {} accessing support with roles: {}", email, userDetails.getAuthorities());
                    } else {
                        log.debug("Set Authentication for user: {} with authorities: {}", email, userDetails.getAuthorities());
                    }
                }
            } else if (StringUtils.hasText(jwt)) {
                log.warn("Invalid JWT token provided for request: {}", request.getRequestURI());
            } else if (request.getRequestURI().startsWith("/api/client/support")) {
                log.warn("Missing Authorization header for support request: {}", request.getRequestURI());
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        // Development convenience: allow providing access token via query param when header is absent.
        if (allowQueryToken) {
            try {
                String queryToken = request.getParameter("access_token");
                if (StringUtils.hasText(queryToken)) {
                    log.info("Using access_token from query param for request {}", request.getRequestURI());
                    return queryToken;
                }
            } catch (Exception ex) {
                log.warn("Failed to read access_token query param: {}", ex.getMessage());
            }
        }
        return null;
    }
}
