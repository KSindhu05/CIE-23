package com.example.ia.controller;

import com.example.ia.entity.User;
import com.example.ia.repository.UserRepository;
import com.example.ia.service.EmailService;
import com.example.ia.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth/password")
public class PasswordResetController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/forgot")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username.trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        String role = user.getRole();

        // Only allow staff/admin to use this flow, not students
        if (!"FACULTY".equals(role) && !"HOD".equals(role) && !"PRINCIPAL".equals(role)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Students cannot use this password reset flow. Please contact your HOD."));
        }

        String email = user.getEmail();
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.status(400)
                    .body(Map.of("message", "No email address is registered for this user. Contact administrator."));
        }

        String otp = otpService.generateOtp(username);
        emailService.sendOtpEmail(email, otp);

        // Hide email partially for security
        String maskedEmail = email.replaceAll("(^[^@]{3}|(?!^)\\G)[^@]", "$1*");

        return ResponseEntity.ok(Map.of("message", "OTP sent successfully to " + maskedEmail));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String otp = request.get("otp");

        if (username == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and OTP are required"));
        }

        boolean isValid = otpService.verifyOtp(username, otp);
        if (isValid) {
            return ResponseEntity.ok(Map.of("message", "OTP verified successfully. You can now reset your password."));
        } else {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));
        }
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String newPassword = request.get("newPassword");

        if (username == null || newPassword == null || newPassword.length() < 4) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Username and a valid new password (min 4 chars) are required"));
        }

        // Verify they actually passed the OTP step
        if (!otpService.isOtpVerified(username)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cannot reset password. OTP verification is missing or expired."));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Clear the OTP to prevent re-use
        otpService.clearOtp(username);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now login."));
    }
}
