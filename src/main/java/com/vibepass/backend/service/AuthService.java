
package com.vibepass.backend.service;

import com.vibepass.backend.entity.User;
import com.vibepass.backend.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // REGISTER
    @Transactional
    public User register(User user) {

        if (user == null
                || user.getName() == null
                || user.getName().isBlank()
                || user.getEmail() == null
                || user.getEmail().isBlank()
                || user.getPassword() == null
                || user.getPassword().length() < 8) {

            throw new RuntimeException(
                    "Name, email and a password of at least 8 characters are required");
        }

        String email = normalizeEmail(user.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already registered");
        }

        user.setName(user.getName().trim());
        user.setEmail(email);

        // Never store the original password.
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Public registrations must not create administrators.
        user.setRole("USER");

        return userRepository.save(user);
    }

    // LOGIN
    @Transactional
    public User login(String email, String password) {

        if (email == null || email.isBlank()
                || password == null || password.isBlank()) {
            throw new RuntimeException("Invalid email or password");
        }

        String normalizedEmail = normalizeEmail(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password"));

        String storedPassword = user.getPassword();

        if (storedPassword == null || storedPassword.isBlank()) {
            throw new RuntimeException("Invalid email or password");
        }

        if (isBcryptHash(storedPassword)) {

            // Verify a BCrypt password.
            if (!passwordEncoder.matches(password, storedPassword)) {
                throw new RuntimeException("Invalid email or password");
            }

        } else {

            // Compatibility with accounts created before BCrypt was added.
            if (!storedPassword.equals(password)) {
                throw new RuntimeException("Invalid email or password");
            }

            // Upgrade the legacy password after successful verification.
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
        }

        return user;
    }

    // NORMALIZE EMAIL
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    // IDENTIFY BCRYPT HASHES
    private boolean isBcryptHash(String password) {
        return password.startsWith("$2a$")
                || password.startsWith("$2b$")
                || password.startsWith("$2y$");
    }

    // FIND USER BY EMAIL
    public User findUserByEmail(String email) {

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Account not found");
        }

        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() ->
                        new RuntimeException("Account not found"));
    }

    // GENERATE PASSWORD RESET TOKEN
    @Transactional
    public String createPasswordResetToken(String email) {

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Account not found");
        }

        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() ->
                        new RuntimeException("Account not found"));

        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);

        user.setResetToken(token);
        user.setResetTokenExpiry(
                LocalDateTime.now().plusMinutes(15));

        userRepository.save(user);

        return token;
    }

    // RESET PASSWORD
    @Transactional
    public void resetPassword(String token, String newPassword) {

        if (token == null || token.isBlank()
                || newPassword == null
                || newPassword.length() < 8) {

            throw new RuntimeException(
                    "A valid token and password of at least 8 characters are required");
        }

        // Find the account associated with this reset token.
        User user = userRepository.findAll().stream()
                .filter(u -> token.equals(u.getResetToken()))
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid or expired reset token"));

        if (user.getResetTokenExpiry() == null
                || !user.getResetTokenExpiry()
                .isAfter(LocalDateTime.now())) {

            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);

            throw new RuntimeException("Reset token has expired");
        }

        // Hash the new password.
        user.setPassword(passwordEncoder.encode(newPassword));

        // Reset tokens can only be used once.
        user.setResetToken(null);
        user.setResetTokenExpiry(null);

        userRepository.save(user);
    }
}
