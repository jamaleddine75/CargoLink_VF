package com.deliveryplatform.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@Slf4j
public class DatasourcePropertiesValidator implements BeanFactoryPostProcessor, EnvironmentAware {

    private Environment env;

    @Override
    public void setEnvironment(Environment environment) {
        this.env = environment;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        if (!env.acceptsProfiles(Profiles.of("prod"))) {
            log.info("Non-production profile active — skipping strict datasource validation.");
            return;
        }
        try {
            String url = env.getProperty("spring.datasource.url");
            String username = env.getProperty("spring.datasource.username");
            String password = env.getProperty("spring.datasource.password");

            validateProperty(url, "spring.datasource.url");
            validateProperty(username, "spring.datasource.username");
            validateProperty(password, "spring.datasource.password");
        } catch (Exception e) {
            log.error("CRITICAL STARTUP FAILURE: PostgreSQL configuration is missing. " + e.getMessage());
            throw new IllegalStateException("CRITICAL STARTUP FAILURE: Required datasource properties are missing. Provide DATABASE_URL, DATABASE_USERNAME, and DATABASE_PASSWORD.", e);
        }

        log.info("Datasource properties validated successfully. Proceeding with Spring Boot initialization.");
    }

    private void validateProperty(String value, String propertyName) {
        if (!StringUtils.hasText(value) || value.contains("${")) {
            String errorMsg = "CRITICAL STARTUP FAILURE: Required property '" + propertyName + "' is missing or unresolved. Value: " + value;
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }
    }
}
