package com.medicalrecord.gallery.service;

import com.medicalrecord.gallery.entity.Hospital;
import com.medicalrecord.gallery.entity.MedicalRecord;
import com.medicalrecord.gallery.entity.User;
import com.medicalrecord.gallery.repository.HospitalRepository;
import com.medicalrecord.gallery.repository.MedicalRecordRepository;
import com.medicalrecord.gallery.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class HospitalService {

    @Autowired
    private HospitalRepository hospitalRepository;
    
    @Autowired
    private MedicalRecordRepository medicalRecordRepository;
    
    @Autowired
    private UserRepository userRepository;

    // Get hospital by user
    public Optional<Hospital> getHospitalByUser(User user) {
        return hospitalRepository.findByUser(user);
    }

    // Get hospital by ID
    public Optional<Hospital> getHospitalById(Long hospitalId) {
        return hospitalRepository.findById(hospitalId);
    }

    // Update hospital profile
    public Hospital updateHospitalProfile(Long hospitalId, String address, String licenseNumber, String city, String state) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        hospital.setAddress(address);
        hospital.setLicenseNumber(licenseNumber);
        hospital.setCity(city);
        hospital.setState(state);

        return hospitalRepository.save(hospital);
    }

    // Get hospital by name
    public Optional<Hospital> getHospitalByName(String name) {
        return hospitalRepository.findByHospitalName(name);
    }

    // Get all hospitals
    public java.util.List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    // Get hospital records by userId
    public List<MedicalRecord> getHospitalRecordsByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital not found for this user"));
        
        return medicalRecordRepository.findByHospitalOrderByUploadDateDesc(hospital);
    }

    // Get active patient count for hospital
    public int getActivePatientCount(Long userId) {
        List<MedicalRecord> records = getHospitalRecordsByUserId(userId);
        Set<Long> uniquePatients = new HashSet<>();
        
        for (MedicalRecord record : records) {
            if (record.getPatient() != null) {
                uniquePatients.add(record.getPatient().getPatientId());
            }
        }
        
        return uniquePatients.size();
    }

    // Get today's upload count
    public long getTodayUploadCount(Long userId) {
        List<MedicalRecord> records = getHospitalRecordsByUserId(userId);
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        
        return records.stream()
                .filter(r -> r.getUploadDate() != null && r.getUploadDate().isAfter(startOfDay))
                .count();
    }

    // Get hospital patients
    public List<User> getHospitalPatients(Long userId) {
        List<MedicalRecord> records = getHospitalRecordsByUserId(userId);
        Set<User> uniquePatients = new HashSet<>();
        
        for (MedicalRecord record : records) {
            if (record.getPatient() != null && record.getPatient().getUser() != null) {
                uniquePatients.add(record.getPatient().getUser());
            }
        }
        
        return new java.util.ArrayList<>(uniquePatients);
    }
}
