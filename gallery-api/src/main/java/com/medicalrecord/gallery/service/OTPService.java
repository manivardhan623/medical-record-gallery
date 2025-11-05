package com.medicalrecord.gallery.service;

import com.medicalrecord.gallery.entity.OTP;
import com.medicalrecord.gallery.repository.OTPRepository;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OTPService {

    @Autowired
    private OTPRepository otpRepository;

    @Value("${twilio.phone.number}")
    private String twilioPhoneNumber;

    // Generate random 6-digit OTP
    public String generateOTP() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    // Save OTP to database
    public OTP saveOTP(String contact) {
        String otpCode = generateOTP();
        OTP otp = new OTP();
        otp.setContact(contact);
        otp.setOtpCode(otpCode);
        otp.setCreatedAt(LocalDateTime.now());
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5)); // Valid for 5 minutes
        otp.setIsUsed(false);
        otp.setIsVerified(false);
        
        return otpRepository.save(otp);
    }

    // Verify OTP
    public Boolean verifyOTP(String contact, String otpCode) {
        OTP otp = otpRepository
                .findByContactAndOtpCodeAndIsUsedFalse(contact, otpCode)
                .orElse(null);

        if (otp == null) {
            return false;
        }

        // Check if OTP is expired
        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            return false;
        }

        // Mark OTP as used and verified
        otp.setIsUsed(true);
        otp.setIsVerified(true);
        otpRepository.save(otp);

        return true;
    }

    // Send OTP via Twilio SMS
    public void sendOTP(String contact, String otpCode) {
        try {
            // Format phone number (add +91 for India if not present)
            String formattedNumber = contact.startsWith("+") ? contact : "+91" + contact;
            
            Message message = Message.creator(
                    new PhoneNumber(formattedNumber), // To number
                    new PhoneNumber(twilioPhoneNumber), // From Twilio number
                    "Your Medical Gallery OTP is: " + otpCode + ". Valid for 5 minutes. Do not share this code."
            ).create();

            System.out.println("✅ OTP sent successfully to " + contact);
            System.out.println("Message SID: " + message.getSid());
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send OTP: " + e.getMessage());
            // Fallback: Print to console for testing
            System.out.println("🔔 OTP for " + contact + ": " + otpCode);
            throw new RuntimeException("Failed to send OTP: " + e.getMessage());
        }
    }

    // Send OTP via Email (Alternative - using JavaMail)
    public void sendOTPEmail(String email, String otpCode) {
        // TODO: Implement email OTP if needed
        System.out.println("📧 Email OTP to " + email + ": " + otpCode);
    }
}
