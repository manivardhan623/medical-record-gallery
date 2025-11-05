package com.medicalrecord.gallery.controller;

import com.medicalrecord.gallery.dto.*;
import com.medicalrecord.gallery.entity.User;
import com.medicalrecord.gallery.service.GoogleAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://10.231.20.144:3000"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class GoogleAuthController {

    @Autowired
    private GoogleAuthService googleAuthService;

    // ==================== HEALTH CHECK ====================
    @GetMapping("/health")
    public ResponseEntity<ApiResponse> health() {
        System.out.println("✅ Backend is running!");
        return ResponseEntity.ok(new ApiResponse(true, "Backend is running!"));
    }

    // ==================== GOOGLE SIGN IN ====================
    @PostMapping("/google-signin")
    public ResponseEntity<ApiResponse> googleSignIn(@RequestBody Map<String, String> request) {
        System.out.println("🔐 GOOGLE SIGN IN ENDPOINT CALLED!");
        String googleId = request.get("googleId");
        String email = request.get("email");
        String name = request.get("name");
        String userTypeStr = request.get("userType");
        
        System.out.println("👤 User Type: " + userTypeStr);
        System.out.println("📧 Email: " + email);
        System.out.println("🆔 Google ID: " + googleId);
        
        try {
            User.UserType userType = User.UserType.valueOf(userTypeStr);
            User user = googleAuthService.authenticateWithGoogle(googleId, email, name, userType);
            
            System.out.println("✅ User authenticated: " + user.getEmail());
            
            return ResponseEntity.ok(new ApiResponse(
                    true, 
                    "Login successful", 
                    UserResponse.fromUser(user)
            ));
        } catch (Exception e) {
            System.err.println("❌ ERROR in googleSignIn: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(
                    new ApiResponse(false, "Authentication failed: " + e.getMessage())
            );
        }
    }

    // ==================== GET USER BY ACCESS CODE ====================
    @GetMapping("/user/{accessCode}")
    public ResponseEntity<ApiResponse> getUserByAccessCode(@PathVariable String accessCode) {
        System.out.println("👤 GET USER BY ACCESS CODE ENDPOINT CALLED!");
        System.out.println("🔑 Access Code: " + accessCode);
        
        try {
            User user = googleAuthService.getUserByAccessCode(accessCode);
            
            System.out.println("✅ User found: " + user.getUserId());
            
            return ResponseEntity.ok(new ApiResponse(true, "User found", UserResponse.fromUser(user)));
        } catch (Exception e) {
            System.err.println("❌ ERROR in getUserByAccessCode: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(
                    new ApiResponse(false, e.getMessage())
            );
        }
    }

    // ==================== EMAIL/PASSWORD SIGN UP ====================
    @PostMapping("/email-signup")
    public ResponseEntity<ApiResponse> emailSignUp(@RequestBody Map<String, String> request) {
        System.out.println("📝 EMAIL SIGN UP ENDPOINT CALLED!");
        String email = request.get("email");
        String password = request.get("password");
        String name = request.get("name");
        String userTypeStr = request.get("userType");
        
        System.out.println("👤 User Type: " + userTypeStr);
        System.out.println("📧 Email: " + email);
        
        try {
            User.UserType userType = User.UserType.valueOf(userTypeStr);
            User user = googleAuthService.registerWithEmail(email, password, name, userType);
            
            System.out.println("✅ User registered: " + user.getEmail());
            
            return ResponseEntity.ok(new ApiResponse(
                    true, 
                    "Registration successful", 
                    UserResponse.fromUser(user)
            ));
        } catch (Exception e) {
            System.err.println("❌ ERROR in emailSignUp: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(
                    new ApiResponse(false, "Registration failed: " + e.getMessage())
            );
        }
    }

    // ==================== EMAIL/PASSWORD SIGN IN ====================
    @PostMapping("/email-signin")
    public ResponseEntity<ApiResponse> emailSignIn(@RequestBody Map<String, String> request) {
        System.out.println("🔐 EMAIL SIGN IN ENDPOINT CALLED!");
        String email = request.get("email");
        String password = request.get("password");
        
        System.out.println("📧 Email: " + email);
        
        try {
            User user = googleAuthService.authenticateWithEmail(email, password);
            
            System.out.println("✅ User authenticated: " + user.getEmail());
            
            return ResponseEntity.ok(new ApiResponse(
                    true, 
                    "Login successful", 
                    UserResponse.fromUser(user)
            ));
        } catch (Exception e) {
            System.err.println("❌ ERROR in emailSignIn: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(
                    new ApiResponse(false, "Authentication failed: " + e.getMessage())
            );
        }
    }

    // ==================== TEST ENDPOINT ====================
    @PostMapping("/test")
    public ResponseEntity<ApiResponse> testEndpoint(@RequestBody Map<String, String> request) {
        System.out.println("🧪 TEST ENDPOINT CALLED!");
        System.out.println("Request: " + request);
        return ResponseEntity.ok(new ApiResponse(true, "Test successful", request));
    }
}
