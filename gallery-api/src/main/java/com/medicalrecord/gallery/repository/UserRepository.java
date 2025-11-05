package com.medicalrecord.gallery.repository;

import com.medicalrecord.gallery.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByAccessCode(String accessCode);
    boolean existsByEmail(String email);
    boolean existsByGoogleId(String googleId);
}
