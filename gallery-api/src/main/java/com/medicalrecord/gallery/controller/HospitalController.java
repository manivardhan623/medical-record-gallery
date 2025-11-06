package com.medicalrecord.gallery.controller;

import com.medicalrecord.gallery.dto.ApiResponse;
import com.medicalrecord.gallery.entity.Hospital;
import com.medicalrecord.gallery.service.HospitalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospital")
@CrossOrigin(origins = {"http://localhost:3000", "http://10.231.20.144:3000", "${frontend.url}"})
public class HospitalController {

    @Autowired
    private HospitalService hospitalService;

    // Get hospital profile
    @GetMapping("/{hospitalId}")
    public ResponseEntity<ApiResponse> getHospitalProfile(@PathVariable Long hospitalId) {
        try {
            Hospital hospital = hospitalService.getHospitalById(hospitalId)
                    .orElseThrow(() -> new RuntimeException("Hospital not found"));
            return ResponseEntity.ok(new ApiResponse(true, "Hospital found", hospital));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Update hospital profile
    @PutMapping("/{hospitalId}")
    public ResponseEntity<ApiResponse> updateHospitalProfile(
            @PathVariable Long hospitalId,
            @RequestParam String address,
            @RequestParam String licenseNumber,
            @RequestParam String city,
            @RequestParam String state) {
        try {
            Hospital hospital = hospitalService.updateHospitalProfile(hospitalId, address, licenseNumber, city, state);
            return ResponseEntity.ok(new ApiResponse(true, "Profile updated successfully", hospital));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get all hospitals
    @GetMapping("/")
    public ResponseEntity<ApiResponse> getAllHospitals() {
        try {
            var hospitals = hospitalService.getAllHospitals();
            return ResponseEntity.ok(new ApiResponse(true, "Hospitals retrieved", hospitals));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get hospital records by userId (for frontend)
    @GetMapping("/{userId}/records")
    public ResponseEntity<ApiResponse> getHospitalRecordsByUserId(@PathVariable Long userId) {
        try {
            System.out.println("📋 Fetching hospital records for userId: " + userId);
            var records = hospitalService.getHospitalRecordsByUserId(userId);
            
            // Convert to DTOs to avoid nested object serialization issues
            var recordDTOs = records.stream()
                    .map(com.medicalrecord.gallery.dto.MedicalRecordResponse::fromEntity)
                    .collect(java.util.stream.Collectors.toList());
            
            System.out.println("✅ Found " + recordDTOs.size() + " records");
            return ResponseEntity.ok(new ApiResponse(true, "Records retrieved", recordDTOs));
        } catch (Exception e) {
            System.err.println("❌ Error fetching hospital records: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get hospital stats by userId (for frontend)
    @GetMapping("/{userId}/stats")
    public ResponseEntity<ApiResponse> getHospitalStatsByUserId(@PathVariable Long userId) {
        try {
            System.out.println("📊 Fetching hospital stats for userId: " + userId);
            var records = hospitalService.getHospitalRecordsByUserId(userId);
            
            var stats = new java.util.HashMap<String, Object>();
            stats.put("totalUploads", records.size());
            stats.put("activePatients", hospitalService.getActivePatientCount(userId));
            stats.put("pendingReviews", records.stream().filter(r -> r.getStatus().toString().equals("PENDING")).count());
            stats.put("todayUploads", hospitalService.getTodayUploadCount(userId));
            
            System.out.println("✅ Hospital stats: " + stats);
            return ResponseEntity.ok(new ApiResponse(true, "Statistics retrieved", stats));
        } catch (Exception e) {
            System.err.println("❌ Error fetching hospital stats: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get hospital patients by userId
    @GetMapping("/{userId}/patients")
    public ResponseEntity<ApiResponse> getHospitalPatients(@PathVariable Long userId) {
        try {
            System.out.println("👥 Fetching patients for hospital userId: " + userId);
            var patients = hospitalService.getHospitalPatients(userId);
            
            // Convert to simple DTOs
            var patientDTOs = patients.stream()
                    .map(user -> {
                        var dto = new java.util.HashMap<String, Object>();
                        dto.put("userId", user.getUserId());
                        dto.put("name", user.getName());
                        dto.put("email", user.getEmail());
                        dto.put("accessCode", user.getAccessCode());
                        return dto;
                    })
                    .collect(java.util.stream.Collectors.toList());
            
            System.out.println("✅ Found " + patientDTOs.size() + " patients");
            return ResponseEntity.ok(new ApiResponse(true, "Patients retrieved", patientDTOs));
        } catch (Exception e) {
            System.err.println("❌ Error fetching patients: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}
