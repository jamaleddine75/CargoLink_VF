package com.deliveryplatform.security;

import com.deliveryplatform.domain.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    @InjectMocks
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Provide a test secret (at least 32 characters)
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", "ThisIsAVerySecretKeyThatIsAtLeast32BytesLong");
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationInMs", 3600000L); // 1 hour
        jwtTokenProvider.init();
    }

    @Test
    void testGenerateAndValidateToken() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setRole(com.deliveryplatform.domain.entity.Role.CUSTOMER);
        
        UserPrincipal principal = new UserPrincipal(user);

        String token = jwtTokenProvider.generateToken(principal);
        
        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("test@example.com", jwtTokenProvider.getEmailFromToken(token));
    }

    @Test
    void testInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalidToken"));
    }

    @Test
    void testGetAuthoritiesFromToken() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("admin@example.com");
        user.setRole(com.deliveryplatform.domain.entity.Role.ADMIN);
        
        UserPrincipal principal = new UserPrincipal(user);

        String token = jwtTokenProvider.generateToken(principal);
        List<SimpleGrantedAuthority> authorities = jwtTokenProvider.getAuthoritiesFromToken(token);
        
        assertNotNull(authorities);
        assertEquals(2, authorities.size());
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN")));
    }
}
