package com.medicalrecord.gallery.repository;

import com.medicalrecord.gallery.entity.Patient;
import com.medicalrecord.gallery.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUser(User user);
    Optional<Patient> findByUser_UserId(Long userId);
}
