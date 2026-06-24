package com.deliveryplatform.dto.request;

import lombok.Data;

@Data
public class AdminUpdateRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String status;
}
