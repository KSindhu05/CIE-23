package com.example.ia.service;

import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private final SecureRandom secureRandom = new SecureRandom();

    // Stores username -> {otp, generatedTime}
    private final Map<String, OtpData> otpCache = new ConcurrentHashMap<>();

    private static class OtpData {
        String otp;
        LocalDateTime generatedTime;
        boolean isVerified;

        OtpData(String otp, LocalDateTime generatedTime) {
            this.otp = otp;
            this.generatedTime = generatedTime;
            this.isVerified = false;
        }
    }

    public String generateOtp(String username) {
        // Generate 6-digit OTP
        int otpValue = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpValue);

        otpCache.put(username.toLowerCase(), new OtpData(otp, LocalDateTime.now()));
        return otp;
    }

    public boolean verifyOtp(String username, String providedOtp) {
        String key = username.toLowerCase();
        OtpData otpData = otpCache.get(key);

        if (otpData == null) {
            return false;
        }

        if (otpData.generatedTime.plusMinutes(OTP_EXPIRY_MINUTES).isBefore(LocalDateTime.now())) {
            otpCache.remove(key); // Expired
            return false;
        }

        if (otpData.otp.equals(providedOtp)) {
            otpData.isVerified = true;
            return true;
        }

        return false;
    }

    public boolean isOtpVerified(String username) {
        String key = username.toLowerCase();
        OtpData otpData = otpCache.get(key);
        return otpData != null && otpData.isVerified;
    }

    public void clearOtp(String username) {
        otpCache.remove(username.toLowerCase());
    }
}
