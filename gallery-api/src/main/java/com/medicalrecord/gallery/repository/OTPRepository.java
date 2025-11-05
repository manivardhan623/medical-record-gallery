package com.medicalrecord.gallery.repository;

import com.medicalrecord.gallery.entity.OTP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OTPRepository extends JpaRepository<OTP, Long> {
    Optional<OTP> findByContactAndOtpCodeAndIsUsedFalse(String contact, String otpCode);
    Optional<OTP> findTopByContactAndIsUsedFalseOrderByCreatedAtDesc(String contact);
}
