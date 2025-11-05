package com.medicalrecord.gallery.service;

import com.medicalrecord.gallery.entity.Patient;
import com.medicalrecord.gallery.entity.User;
import com.medicalrecord.gallery.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ShareAccessService {

    @Autowired
    private PatientRepository patientRepository;

    // Generate temporary share access code for patient
    public String generateShareAccessCode(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));
        
        // Generate unique temporary code (different each time)
        String shareCode = "SHARE-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        
        // In production, you would save this to a ShareAccessCode entity with expiration
        // For now, we just generate a new unique code each time
        
        return shareCode;
    }

    // Validate share access code (future implementation)
    public boolean validateShareAccessCode(String shareCode, Long hospitalId) {
        // In production, check if code exists, is not expired, and is valid
        return shareCode != null && shareCode.startsWith("SHARE-");
    }
}

