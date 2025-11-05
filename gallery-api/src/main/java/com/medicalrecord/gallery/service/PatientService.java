package com.medicalrecord.gallery.service;

import com.medicalrecord.gallery.entity.Patient;
import com.medicalrecord.gallery.entity.User;
import com.medicalrecord.gallery.entity.MedicalRecord;
import com.medicalrecord.gallery.repository.PatientRepository;
import com.medicalrecord.gallery.repository.MedicalRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    // Get patient by user
    public Optional<Patient> getPatientByUser(User user) {
        return patientRepository.findByUser(user);
    }

    // Get patient by ID
    public Optional<Patient> getPatientById(Long patientId) {
        return patientRepository.findById(patientId);
    }

    // Update patient profile
    public Patient updatePatientProfile(Long patientId, String gender, java.time.LocalDate dateOfBirth, String bloodGroup, String address, String emergencyContact) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        if (gender != null) patient.setGender(gender);
        if (dateOfBirth != null) patient.setDateOfBirth(dateOfBirth);
        if (bloodGroup != null) patient.setBloodGroup(bloodGroup);
        if (address != null) patient.setAddress(address);
        if (emergencyContact != null) patient.setEmergencyContact(emergencyContact);

        return patientRepository.save(patient);
    }

    // Get all medical records for patient
    public List<MedicalRecord> getPatientRecords(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return medicalRecordRepository.findByPatientOrderByUploadDateDesc(patient);
    }

    // Get record count
    public Long getPatientRecordCount(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return (long) medicalRecordRepository.findByPatient(patient).size();
    }

    // Get verified record count
    public Long getVerifiedRecordCount(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        return medicalRecordRepository.findByPatient(patient).stream()
                .filter(r -> r.getStatus() == MedicalRecord.RecordStatus.VERIFIED)
                .count();
    }
}
