package com.deliveryplatform.mapper;

import com.deliveryplatform.domain.entity.Role;
import com.deliveryplatform.domain.entity.User;
import com.deliveryplatform.dto.response.UserResponse;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import static org.junit.jupiter.api.Assertions.*;

class UserMapperTest {

    private final UserMapper userMapper = Mappers.getMapper(UserMapper.class);

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
