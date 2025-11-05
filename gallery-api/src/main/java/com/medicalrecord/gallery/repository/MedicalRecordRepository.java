package com.medicalrecord.gallery.repository;

import com.medicalrecord.gallery.entity.Hospital;
import com.medicalrecord.gallery.entity.MedicalRecord;
import com.medicalrecord.gallery.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByPatient(Patient patient);
    List<MedicalRecord> findByPatient_PatientId(Long patientId);
    List<MedicalRecord> findByPatientOrderByUploadDateDesc(Patient patient);
    List<MedicalRecord> findByHospitalOrderByUploadDateDesc(Hospital hospital);
}
