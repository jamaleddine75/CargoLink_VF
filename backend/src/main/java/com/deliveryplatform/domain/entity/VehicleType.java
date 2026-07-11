package com.deliveryplatform.domain.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.stream.Stream;

public enum VehicleType {
    MOTO("MOTO"),
    VOITURE("VOITURE"),
    CAMIONNETTE("CAMIONNETTE"),
    CAMION("CAMION"),
    BICYCLE("BICYCLE"),
    VAN("VAN");

    private final String value;

    VehicleType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static VehicleType fromString(String value) {
        if (value == null) return null;
        
        String upperValue = value.toUpperCase();
        switch (upperValue) {
            case "MOTORCYCLE": return MOTO;
            case "CAR": return VOITURE;
            case "TRUCK": return CAMION;
        }
        
        return Stream.of(VehicleType.values())
                .filter(v -> v.value.equalsIgnoreCase(value) || v.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new com.deliveryplatform.exception.BadRequestException("Unknown vehicle type: " + value));
    }
}
