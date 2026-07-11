package com.deliveryplatform.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class NominatimResponse {
    @JsonProperty("display_name")
    private String displayName;
    
    private Address address;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Address {
        private String road;
        
        @JsonProperty("house_number")
        private String houseNumber;
        
        private String suburb;
        private String neighbourhood;
        private String quarter;
        private String city;
        private String town;
        private String village;
        private String municipality;
        private String postcode;
        private String state;
        private String country;
    }
}
