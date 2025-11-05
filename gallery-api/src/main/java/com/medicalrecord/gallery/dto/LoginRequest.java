package com.medicalrecord.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String contact; // Phone or Email
    private String userType; // PATIENT or HOSPITAL
}
