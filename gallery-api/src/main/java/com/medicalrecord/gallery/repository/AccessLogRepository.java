package com.medicalrecord.gallery.repository;

import com.medicalrecord.gallery.entity.AccessLog;
import com.medicalrecord.gallery.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {
    List<AccessLog> findByPatient(Patient patient);
    List<AccessLog> findByPatient_PatientIdOrderByAccessTimeDesc(Long patientId);
}
