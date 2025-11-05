package com.medicalrecord.gallery.service;

import com.medicalrecord.gallery.entity.MedicalRecord;
import com.medicalrecord.gallery.entity.Patient;
import com.medicalrecord.gallery.entity.Hospital;
import com.medicalrecord.gallery.entity.User;
import com.medicalrecord.gallery.repository.MedicalRecordRepository;
import com.medicalrecord.gallery.repository.PatientRepository;
import com.medicalrecord.gallery.repository.HospitalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MedicalRecordService {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private HospitalRepository hospitalRepository;
    
    @Autowired
    private GoogleAuthService googleAuthService;

    private static final String UPLOAD_DIR = "uploads/medical-records/";
    
    // Initialize upload directory
    private void initUploadDir() {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to create upload directory", e);
        }
    }

    // Upload medical record with file
    public MedicalRecord uploadRecordWithFile(MultipartFile file, String patientAccessCode, Long hospitalId, String recordType, String notes) {
        try {
            System.out.println("📤 Uploading record for patient access code: " + patientAccessCode);
            
            // Initialize upload directory
            initUploadDir();
            
            // Get patient by access code
            User patientUser = googleAuthService.getUserByAccessCode(patientAccessCode);
            System.out.println("👤 Found user: " + patientUser.getEmail() + " Type: " + patientUser.getUserType());
            
            if (patientUser.getUserType() != User.UserType.PATIENT) {
                throw new RuntimeException("Access code does not belong to a patient");
            }
            
            // Find or create patient entity
            Optional<Patient> patientOpt = patientRepository.findByUser(patientUser);
            Patient patient;
            
            if (patientOpt.isEmpty()) {
                System.out.println("⚠️ Patient entity not found, creating new one...");
                patient = new Patient();
                patient.setUser(patientUser);
                patient = patientRepository.save(patient);
                System.out.println("✅ Patient entity created with ID: " + patient.getPatientId());
            } else {
                patient = patientOpt.get();
                System.out.println("✅ Found existing patient with ID: " + patient.getPatientId());
            }
            
            // Get hospital if provided (hospitalId can be either hospitalId or userId)
            Hospital hospital = null;
            if (hospitalId != null) {
                System.out.println("🏥 Looking up hospital with ID: " + hospitalId);
                // Try to find by hospitalId first
                hospital = hospitalRepository.findById(hospitalId).orElse(null);
                if (hospital != null) {
                    System.out.println("✅ Found hospital by hospitalId: " + hospital.getHospitalName());
                } else {
                    // If not found, try to find by userId (in case frontend sends userId)
                    hospital = hospitalRepository.findByUser_UserId(hospitalId).orElse(null);
                    if (hospital != null) {
                        System.out.println("✅ Found hospital by userId: " + hospital.getHospitalName());
                    } else {
                        System.out.println("⚠️ Hospital not found, will create record without hospital link");
                    }
                }
            }
            
            // Save file
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            Path filePath = Paths.get(UPLOAD_DIR + uniqueFileName);
            
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Create medical record
            MedicalRecord record = new MedicalRecord();
            record.setPatient(patient);
            record.setHospital(hospital);
            record.setRecordType(recordType);
            record.setFileName(originalFileName != null ? originalFileName : "unknown");
            record.setFilePath(filePath.toString());
            record.setDescription(notes);
            record.setStatus(MedicalRecord.RecordStatus.PENDING);

            MedicalRecord savedRecord = medicalRecordRepository.save(record);
            System.out.println("✅ Medical record saved successfully with ID: " + savedRecord.getRecordId());
            
            return savedRecord;
        } catch (IOException e) {
            System.err.println("❌ Failed to save file: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Error uploading record: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload record: " + e.getMessage());
        }
    }

    // Upload medical record (legacy method)
    public MedicalRecord uploadRecord(Long patientId, Long hospitalId, String recordType, String fileName, String filePath, String description) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setRecordType(recordType);
        record.setFileName(fileName);
        record.setFilePath(filePath);
        record.setDescription(description);
        record.setStatus(MedicalRecord.RecordStatus.PENDING);

        return medicalRecordRepository.save(record);
    }

    // Get record by ID
    public Optional<MedicalRecord> getRecordById(Long recordId) {
        return medicalRecordRepository.findById(recordId);
    }

    // Update record status
    public MedicalRecord updateRecordStatus(Long recordId, MedicalRecord.RecordStatus status) {
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));
        record.setStatus(status);
        return medicalRecordRepository.save(record);
    }

    // Get all records for patient
    public List<MedicalRecord> getPatientRecords(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return medicalRecordRepository.findByPatientOrderByUploadDateDesc(patient);
    }

    // Delete record
    public void deleteRecord(Long recordId) {
        medicalRecordRepository.deleteById(recordId);
    }

    // Get verified records
    public List<MedicalRecord> getVerifiedRecords(Long patientId) {
        List<MedicalRecord> records = getPatientRecords(patientId);
        return records.stream()
                .filter(r -> r.getStatus() == MedicalRecord.RecordStatus.VERIFIED)
                .toList();
    }

    // Search records
    public List<MedicalRecord> searchRecords(String query, Long hospitalId) {
        List<MedicalRecord> allRecords;
        
        if (hospitalId != null) {
            // Get hospital
            Hospital hospital = hospitalRepository.findById(hospitalId)
                    .orElse(hospitalRepository.findByUser_UserId(hospitalId).orElse(null));
            if (hospital != null) {
                allRecords = medicalRecordRepository.findByHospitalOrderByUploadDateDesc(hospital);
            } else {
                allRecords = medicalRecordRepository.findAll();
            }
        } else {
            allRecords = medicalRecordRepository.findAll();
        }
        
        String lowerQuery = query.toLowerCase();
        return allRecords.stream()
                .filter(r -> 
                    r.getRecordType() != null && r.getRecordType().toLowerCase().contains(lowerQuery) ||
                    r.getFileName() != null && r.getFileName().toLowerCase().contains(lowerQuery) ||
                    (r.getDescription() != null && r.getDescription().toLowerCase().contains(lowerQuery)) ||
                    (r.getPatient() != null && r.getPatient().getUser() != null && 
                     (r.getPatient().getUser().getName().toLowerCase().contains(lowerQuery) ||
                      r.getPatient().getUser().getAccessCode().toLowerCase().contains(lowerQuery)))
                )
                .toList();
    }
}
