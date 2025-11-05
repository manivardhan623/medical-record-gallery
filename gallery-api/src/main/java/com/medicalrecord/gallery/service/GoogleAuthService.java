package com.medicalrecord.gallery.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.medicalrecord.gallery.entity.User;
import com.medicalrecord.gallery.entity.Patient;
import com.medicalrecord.gallery.entity.Hospital;
import com.medicalrecord.gallery.repository.UserRepository;
import com.medicalrecord.gallery.repository.PatientRepository;
import com.medicalrecord.gallery.repository.HospitalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Service
public class GoogleAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Verify Google ID token and get user info
    public GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken != null) {
                return googleIdToken.getPayload();
            }
            throw new RuntimeException("Invalid Google token");
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify Google token: " + e.getMessage());
        }
    }

    // Register or login user with Google (simplified - using direct user info)
    public User authenticateWithGoogle(String googleId, String email, String name, User.UserType userType) {
        // Note: In production, you should verify the access token with Google
        // For now, we trust the frontend has verified with Google OAuth

        // Check if user already exists
        Optional<User> existingUser = userRepository.findByGoogleId(googleId);
        
        if (existingUser.isPresent()) {
            // User exists, just return
            User user = existingUser.get();
            user.setLastLogin(java.time.LocalDateTime.now());
            return userRepository.save(user);
        }

        // Check if email already exists (different Google account)
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered with different account");
        }

        // Create new user
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setGoogleId(googleId);
        user.setUserType(userType);
        user.setAccessCode(generateAccessCode());
        user.setIsVerified(true);

        User savedUser = userRepository.save(user);

        // Create profile based on user type
        if (userType == User.UserType.PATIENT) {
            Patient patient = new Patient();
            patient.setUser(savedUser);
            patientRepository.save(patient);
        } else if (userType == User.UserType.HOSPITAL) {
            Hospital hospital = new Hospital();
            hospital.setUser(savedUser);
            hospital.setHospitalName(name);
            hospitalRepository.save(hospital);
        }

        return savedUser;
    }

    // Get user by access code
    public User getUserByAccessCode(String accessCode) {
        return userRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new RuntimeException("User not found with access code: " + accessCode));
    }

    // Register with email and password
    public User registerWithEmail(String email, String password, String name, User.UserType userType) {
        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setUserType(userType);
        user.setAccessCode(generateAccessCode());
        user.setIsVerified(true);

        User savedUser = userRepository.save(user);

        // Create profile based on user type
        if (userType == User.UserType.PATIENT) {
            Patient patient = new Patient();
            patient.setUser(savedUser);
            patientRepository.save(patient);
        } else if (userType == User.UserType.HOSPITAL) {
            Hospital hospital = new Hospital();
            hospital.setUser(savedUser);
            hospital.setHospitalName(name);
            hospitalRepository.save(hospital);
        }

        return savedUser;
    }

    // Authenticate with email and password
    public User authenticateWithEmail(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getPassword() == null) {
            throw new RuntimeException("This account uses Google Sign-In. Please sign in with Google.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        user.setLastLogin(java.time.LocalDateTime.now());
        return userRepository.save(user);
    }

    // Generate unique access code
    private String generateAccessCode() {
        return "MG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
