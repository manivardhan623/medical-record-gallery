package com.medicalrecord.gallery.dto;

import com.medicalrecord.gallery.entity.MedicalRecord;
import java.time.LocalDateTime;

public class MedicalRecordResponse {
    private Long recordId;
    private String recordType;
    private String fileName;
    private String description;
    private String status;
    private LocalDateTime uploadDate;
    private String patientName;
    private String patientEmail;
    private String patientAccessCode;
    private String hospitalName;

    public static MedicalRecordResponse fromEntity(MedicalRecord record) {
        MedicalRecordResponse response = new MedicalRecordResponse();
        response.setRecordId(record.getRecordId());
        response.setRecordType(record.getRecordType());
        response.setFileName(record.getFileName());
        response.setDescription(record.getDescription());
        response.setStatus(record.getStatus() != null ? record.getStatus().toString() : "PENDING");
        response.setUploadDate(record.getUploadDate());
        
        // Flatten patient data
        if (record.getPatient() != null && record.getPatient().getUser() != null) {
            response.setPatientName(record.getPatient().getUser().getName());
            response.setPatientEmail(record.getPatient().getUser().getEmail());
            response.setPatientAccessCode(record.getPatient().getUser().getAccessCode());
        }
        
        // Flatten hospital data
        if (record.getHospital() != null) {
            response.setHospitalName(record.getHospital().getHospitalName());
        }
        
        return response;
    }

    // Getters and Setters
    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }

    public String getRecordType() { return recordType; }
    public void setRecordType(String recordType) { this.recordType = recordType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getUploadDate() { return uploadDate; }
    public void setUploadDate(LocalDateTime uploadDate) { this.uploadDate = uploadDate; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientEmail() { return patientEmail; }
    public void setPatientEmail(String patientEmail) { this.patientEmail = patientEmail; }

    public String getPatientAccessCode() { return patientAccessCode; }
    public void setPatientAccessCode(String patientAccessCode) { this.patientAccessCode = patientAccessCode; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
}
