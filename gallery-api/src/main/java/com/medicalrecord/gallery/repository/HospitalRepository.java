package com.medicalrecord.gallery.repository;

import com.medicalrecord.gallery.entity.Hospital;
import com.medicalrecord.gallery.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    Optional<Hospital> findByUser(User user);
    Optional<Hospital> findByUser_UserId(Long userId);
    Optional<Hospital> findByHospitalName(String hospitalName);
}
