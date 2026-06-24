package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Role;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.dto.response.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class UserMapperTest {

    @Autowired
    private UserMapper userMapper;

    @Test
    void shouldMapUserToUserResponseCorrectly() {
        // Given
        User user = User.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .isActive(true)
                .role(Role.DRIVER)
                .build();

        // When
        UserResponse response = userMapper.toResponse(user);

        // Then
        assertNotNull(response);
        assertEquals("John", response.getFirstName());
        assertEquals("Doe", response.getLastName());
        assertEquals("john@example.com", response.getEmail());
        assertTrue(response.isActive(), "isActive should be mapped correctly");
        assertEquals("DRIVER", response.getRole());
    }

    @Test
    void shouldMapInactiveUserToUserResponse() {
        // Given
        User user = User.builder()
                .isActive(false)
                .build();

        // When
        UserResponse response = userMapper.toResponse(user);

        // Then
        assertFalse(response.isActive(), "isActive should be false for inactive user");
    }
}
