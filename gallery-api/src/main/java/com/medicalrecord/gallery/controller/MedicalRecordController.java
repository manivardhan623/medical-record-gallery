package com.medicalrecord.gallery.controller;

import com.medicalrecord.gallery.dto.ApiResponse;
import com.medicalrecord.gallery.dto.MedicalRecordRequest;
import com.medicalrecord.gallery.entity.MedicalRecord;
import com.medicalrecord.gallery.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/records")
@CrossOrigin(origins = {"http://localhost:3000", "http://10.231.20.144:3000"})
public class MedicalRecordController {

    @Autowired
    private MedicalRecordService medicalRecordService;

    // Upload medical record with file
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse> uploadRecord(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientAccessCode") String patientAccessCode,
            @RequestParam("recordType") String recordType,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "hospitalId", required = false) Long hospitalId) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "File is required"));
            }
            
            MedicalRecord record = medicalRecordService.uploadRecordWithFile(
                    file, patientAccessCode, hospitalId, recordType, notes);
            return ResponseEntity.ok(new ApiResponse(true, "Record uploaded successfully", record));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get record by ID
    @GetMapping("/{recordId}")
    public ResponseEntity<ApiResponse> getRecord(@PathVariable Long recordId) {
        try {
            MedicalRecord record = medicalRecordService.getRecordById(recordId)
                    .orElseThrow(() -> new RuntimeException("Record not found"));
            return ResponseEntity.ok(new ApiResponse(true, "Record found", record));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Update record status
    @PutMapping("/{recordId}/status")
    public ResponseEntity<ApiResponse> updateRecordStatus(
            @PathVariable Long recordId,
            @RequestParam String status) {
        try {
            MedicalRecord.RecordStatus recordStatus = MedicalRecord.RecordStatus.valueOf(status.toUpperCase());
            MedicalRecord record = medicalRecordService.updateRecordStatus(recordId, recordStatus);
            return ResponseEntity.ok(new ApiResponse(true, "Status updated successfully", record));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Delete record
    @DeleteMapping("/{recordId}")
    public ResponseEntity<ApiResponse> deleteRecord(@PathVariable Long recordId) {
        try {
            medicalRecordService.deleteRecord(recordId);
            return ResponseEntity.ok(new ApiResponse(true, "Record deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get verified records
    @GetMapping("/verified/{patientId}")
    public ResponseEntity<ApiResponse> getVerifiedRecords(@PathVariable Long patientId) {
        try {
            var records = medicalRecordService.getVerifiedRecords(patientId);
            return ResponseEntity.ok(new ApiResponse(true, "Verified records retrieved", records));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Download medical record file
    @GetMapping("/{recordId}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadRecord(@PathVariable Long recordId) {
        try {
            System.out.println("📥 Download request for recordId: " + recordId);
            MedicalRecord record = medicalRecordService.getRecordById(recordId)
                    .orElseThrow(() -> new RuntimeException("Record not found"));
            
            java.io.File file = new java.io.File(record.getFilePath());
            if (!file.exists()) {
                System.err.println("❌ File not found at: " + record.getFilePath());
                return ResponseEntity.notFound().build();
            }
            
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(file.toURI());
            
            String contentType = "application/octet-stream";
            String fileName = record.getFileName();
            
            // Detect content type
            if (fileName.toLowerCase().endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (fileName.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            }
            
            System.out.println("✅ Downloading file: " + fileName);
            
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + fileName + "\"")
                    .body(resource);
        } catch (Exception e) {
            System.err.println("❌ Error downloading file: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // Preview/View medical record file (for images)
    @GetMapping("/{recordId}/preview")
    public ResponseEntity<org.springframework.core.io.Resource> previewRecord(@PathVariable Long recordId) {
        try {
            MedicalRecord record = medicalRecordService.getRecordById(recordId)
                    .orElseThrow(() -> new RuntimeException("Record not found"));
            
            java.io.File file = new java.io.File(record.getFilePath());
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(file.toURI());
            
            String fileName = record.getFileName().toLowerCase();
            String contentType = "application/octet-stream";
            
            if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (fileName.endsWith(".png")) {
                contentType = "image/png";
            } else if (fileName.endsWith(".pdf")) {
                contentType = "application/pdf";
            }
            
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                            "inline; filename=\"" + record.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // Search records
    @GetMapping("/search")
    public ResponseEntity<ApiResponse> searchRecords(
            @RequestParam String q,
            @RequestParam(required = false) Long hospitalId) {
        try {
            var results = medicalRecordService.searchRecords(q, hospitalId);
            return ResponseEntity.ok(new ApiResponse(true, "Search results", results));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}
