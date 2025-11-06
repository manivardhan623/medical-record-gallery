package com.medicalrecord.gallery.controller;

import com.medicalrecord.gallery.dto.ApiResponse;
import com.medicalrecord.gallery.entity.Patient;
import com.medicalrecord.gallery.entity.User;
import com.medicalrecord.gallery.service.PatientService;
import com.medicalrecord.gallery.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patient")
@CrossOrigin(origins = {"http://localhost:3000", "http://10.231.20.144:3000", "${frontend.url}"})
public class PatientController {

    @Autowired
    private PatientService patientService;

    @Autowired
    private UserRepository userRepository;

    // Get patient profile
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse> getPatientProfile(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Patient patient = patientService.getPatientByUser(user)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            return ResponseEntity.ok(new ApiResponse(true, "Patient found", patient));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Update patient profile
    @PutMapping("/{patientId}")
    public ResponseEntity<ApiResponse> updatePatientProfile(
            @PathVariable Long patientId,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String dateOfBirth,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String emergencyContact) {
        try {
            java.time.LocalDate dob = null;
            if (dateOfBirth != null && !dateOfBirth.isEmpty()) {
                dob = java.time.LocalDate.parse(dateOfBirth);
            }
            Patient patient = patientService.updatePatientProfile(patientId, gender, dob, bloodGroup, address, emergencyContact);
            return ResponseEntity.ok(new ApiResponse(true, "Profile updated successfully", patient));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
    
    // Get patient profile by userId
    @GetMapping("/user/{userId}/profile")
    public ResponseEntity<ApiResponse> getPatientProfileByUserId(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Patient patient = patientService.getPatientByUser(user)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            
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
            
            return ResponseEntity.ok(new ApiResponse(true, "Profile retrieved", profileData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get patient records
    @GetMapping("/{patientId}/records")
    public ResponseEntity<ApiResponse> getPatientRecords(@PathVariable Long patientId) {
        try {
            var records = patientService.getPatientRecords(patientId);
            return ResponseEntity.ok(new ApiResponse(true, "Records retrieved", records));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get record statistics
    @GetMapping("/{patientId}/stats")
    public ResponseEntity<ApiResponse> getPatientStats(@PathVariable Long patientId) {
        try {
            var stats = new java.util.HashMap<>();
            stats.put("totalRecords", patientService.getPatientRecordCount(patientId));
            stats.put("verifiedRecords", patientService.getVerifiedRecordCount(patientId));
            return ResponseEntity.ok(new ApiResponse(true, "Statistics retrieved", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get patient records by userId (for frontend)
    @GetMapping("/user/{userId}/records")
    public ResponseEntity<ApiResponse> getRecordsByUserId(@PathVariable Long userId) {
        try {
            System.out.println("📋 Fetching records for userId: " + userId);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Patient patient = patientService.getPatientByUser(user)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            
            var records = patientService.getPatientRecords(patient.getPatientId());
            
            // Convert to DTOs to avoid nested object serialization issues
            var recordDTOs = records.stream()
                    .map(com.medicalrecord.gallery.dto.MedicalRecordResponse::fromEntity)
                    .collect(java.util.stream.Collectors.toList());
            
            System.out.println("✅ Found " + recordDTOs.size() + " records");
            return ResponseEntity.ok(new ApiResponse(true, "Records retrieved", recordDTOs));
        } catch (Exception e) {
            System.err.println("❌ Error fetching records: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get patient stats by userId (for frontend)
    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<ApiResponse> getStatsByUserId(@PathVariable Long userId) {
        try {
            System.out.println("📊 Fetching stats for userId: " + userId);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Patient patient = patientService.getPatientByUser(user)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            
            Long patientId = patient.getPatientId();
            var records = patientService.getPatientRecords(patientId);
            
            var stats = new java.util.HashMap<String, Object>();
            stats.put("totalRecords", records.size());
            stats.put("verifiedRecords", records.stream().filter(r -> r.getStatus().toString().equals("VERIFIED")).count());
            stats.put("pendingRecords", records.stream().filter(r -> r.getStatus().toString().equals("PENDING")).count());
            stats.put("sharedRecords", 0); // Placeholder
            
            System.out.println("✅ Stats: " + stats);
            return ResponseEntity.ok(new ApiResponse(true, "Statistics retrieved", stats));
        } catch (Exception e) {
            System.err.println("❌ Error fetching stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}
