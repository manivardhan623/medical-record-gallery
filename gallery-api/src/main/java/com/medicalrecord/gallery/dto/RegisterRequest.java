package com.medicalrecord.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String userType; // PATIENT or HOSPITAL
    private String name;
    private String phoneNumber;
    private String email;
    private String hospitalName; // For hospital registration
}
