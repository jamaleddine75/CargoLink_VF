package com.deliveryplatform;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.deliveryplatform.repository.UserRepository;
import com.deliveryplatform.domain.entity.User;
import java.util.List;

@SpringBootTest
@ActiveProfiles("dev")
class DeliveryPlatformApplicationTests {

    @Test
    void contextLoads() {
    }

}
