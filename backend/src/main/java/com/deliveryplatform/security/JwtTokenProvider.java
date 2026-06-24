package com.deliveryplatform.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpirationInMs;

    private Key signingKey;

    @jakarta.annotation.PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty() || jwtSecret.equals("${APP_JWT_SECRET}")) {
            log.warn("⚠️ No JWT secret provided. Generating temporary secure key (NOT for production).");
            this.signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        } else if (jwtSecret.length() < 32) {
            log.error("⚠️ Provided JWT secret is too short (min 32 chars). Falling back to temporary secure key.");
            this.signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        } else {
            log.info("✅ JWT Secret validated and loaded successfully.");
            this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        }
    }

        public String generateToken(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        // Extract primary role from authorities
        String primaryRole = principal.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .findFirst()
            .map(role -> role.startsWith("ROLE_") ? role.substring(5) : role)
            .orElse("CUSTOMER");

        return Jwts.builder()
            .setSubject(principal.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(expiryDate)
            .claim("id", principal.getId().toString())
            .claim("role", primaryRole)
            .claim("roles", principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()))
            .claim("agencyId", principal.getUser().getAgency() != null 
                ? principal.getUser().getAgency().getId().toString() 
                : null)
            .signWith(signingKey, SignatureAlgorithm.HS256)
            .compact();
        }

    public String getEmailFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.error("JWT validation error: {}", ex.getMessage());
        }
        return false;
    }

    public List<SimpleGrantedAuthority> getAuthoritiesFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        Object roles = claims.get("roles");
        if (roles instanceof List<?>) {
            List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
            for (Object role : (List<?>) roles) {
                String roleStr = (String) role;
                String prefixedRole = roleStr.startsWith("ROLE_") ? roleStr : "ROLE_" + roleStr;
                authorities.add(new SimpleGrantedAuthority(prefixedRole));
            }
            return authorities;
        }
        return java.util.Collections.emptyList();
    }
}