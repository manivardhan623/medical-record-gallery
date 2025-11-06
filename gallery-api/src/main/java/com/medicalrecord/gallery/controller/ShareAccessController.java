package com.medicalrecord.gallery.controller;

import com.medicalrecord.gallery.dto.ApiResponse;
import com.medicalrecord.gallery.entity.Patient;
import com.medicalrecord.gallery.entity.User;
import com.medicalrecord.gallery.repository.PatientRepository;
import com.medicalrecord.gallery.repository.UserRepository;
import com.medicalrecord.gallery.service.ShareAccessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/share")
@CrossOrigin(origins = {"http://localhost:3000", "http://10.231.20.144:3000", "${frontend.url}"})
public class ShareAccessController {

    @Autowired
    private ShareAccessService shareAccessService;
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private UserRepository userRepository;

    // Generate share access code for patient (by userId) - returns profile URL for QR code
    @PostMapping("/generate/{userId}")
    public ResponseEntity<ApiResponse> generateShareCode(@PathVariable Long userId) {
        try {
            System.out.println("📤 Generating share code for userId: " + userId);
            
            // Find user first
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
            
            System.out.println("👤 Found user: " + user.getEmail() + " Type: " + user.getUserType());
            
            // Check if user is a patient
            if (user.getUserType() != User.UserType.PATIENT) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "User is not a patient"));
            }
            
            // Find or create patient entity
            Optional<Patient> patientOpt = patientRepository.findByUser_UserId(userId);
            Patient patient;
            
            if (patientOpt.isEmpty()) {
                System.out.println("⚠️ Patient entity not found, creating new one...");
                patient = new Patient();
                patient.setUser(user);
                patient = patientRepository.save(patient);
                System.out.println("✅ Patient entity created with ID: " + patient.getPatientId());
            } else {
                patient = patientOpt.get();
                System.out.println("✅ Found existing patient with ID: " + patient.getPatientId());
            }
            
            // Generate a unique code and create profile URL
            String shareCode = shareAccessService.generateShareAccessCode(patient.getPatientId());
            // URL that hospitals can access - contains access code for direct upload
            String profileUrl = "http://localhost:3000/hospital/patient-profile?code=" + user.getAccessCode();
            
            System.out.println("✅ Share code generated: " + shareCode);
            System.out.println("✅ Profile URL: " + profileUrl);
            
            // Return profile URL for QR code
            return ResponseEntity.ok(new ApiResponse(true, "Profile URL generated successfully", profileUrl));
        } catch (Exception e) {
            System.err.println("❌ ERROR generating share code: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Failed to generate share code: " + e.getMessage()));
        }
    }
    
    // Get patient profile by access code (for hospitals scanning QR code)
    @GetMapping("/profile/{accessCode}")
    public ResponseEntity<ApiResponse> getPatientProfileByAccessCode(@PathVariable String accessCode) {
        try {
            User user = userRepository.findByAccessCode(accessCode)
                    .orElseThrow(() -> new RuntimeException("Patient not found with access code: " + accessCode));
            
            if (user.getUserType() != User.UserType.PATIENT) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Access code does not belong to a patient"));
            }
            
            Optional<Patient> patientOpt = patientRepository.findByUser(user);
            if (patientOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Patient profile not found"));
            }
            
            Patient patient = patientOpt.get();
            
            // Create response DTO
            var profileData = new java.util.HashMap<String, Object>();
            profileData.put("userId", user.getUserId());
            profileData.put("patientId", patient.getPatientId());
            profileData.put("name", user.getName());
            profileData.put("email", user.getEmail());
            profileData.put("accessCode", user.getAccessCode());
            profileData.put("dateOfBirth", patient.getDateOfBirth());
            profileData.put("gender", patient.getGender());
            profileData.put("bloodGroup", patient.getBloodGroup());
            profileData.put("address", patient.getAddress());
            profileData.put("emergencyContact", patient.getEmergencyContact());
            
            return ResponseEntity.ok(new ApiResponse(true, "Patient profile retrieved", profileData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Validate share access code
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse> validateShareCode(
            @RequestParam String shareCode,
            @RequestParam Long hospitalId) {
        try {
            boolean isValid = shareAccessService.validateShareAccessCode(shareCode, hospitalId);
            return ResponseEntity.ok(new ApiResponse(true, isValid ? "Code is valid" : "Code is invalid", isValid));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}

