package com.example.ia.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@iamanagement.com"); // Replaced by actual sender config
            message.setTo(toEmail);
            message.setSubject("Your IA Management System Password Reset OTP");
            message.setText("Hello,\n\n" +
                    "Your One-Time Password (OTP) for resetting your account password is: " + otp + "\n\n" +
                    "This OTP is valid for 5 minutes. Do not share this code with anyone.\n\n" +
                    "Thanks,\nIA Management System Team");

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ". Error: " + e.getMessage());
            // For development without real credentials: log it to console
            System.out.println("DEV FALLBACK -> Sending OTP to " + toEmail + ": " + otp);
        }
    }
}
