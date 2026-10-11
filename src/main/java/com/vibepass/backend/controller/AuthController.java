
package com.vibepass.backend.controller;

import com.vibepass.backend.entity.User;
import com.vibepass.backend.service.AuthService;
import com.vibepass.backend.security.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = {
        "http://localhost:*",
        "https://vibe-pass-frontend.vercel.app"
})
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(
            AuthService authService,
            JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (user.getName() == null || user.getName().isBlank()
                || user.getEmail() == null || user.getEmail().isBlank()
                || user.getPassword() == null || user.getPassword().isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Name, email and password are required"));
        }

        try {
            // Every public registration creates a normal user.
            user.setRole("USER");

            User savedUser = authService.register(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registration successful");
            response.put("id", savedUser.getId());
            response.put("name", savedUser.getName());
            response.put("email", savedUser.getEmail());
            response.put("role", savedUser.getRole());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage()));
        }
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> loginRequest) {

        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        if (email == null || email.isBlank()
                || password == null || password.isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Email and password are required"));
        }

        try {
            User user = authService.login(email, password);

            // Generate JWT only after the credentials are verified.
            String token = jwtService.generateToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("token", token);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid email or password"));
        }
    }

    // REQUEST PASSWORD RESET
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Email is required"));
        }

        try {
            String token = authService.createPasswordResetToken(email);

            // Development only: do not expose this token in production.
            return ResponseEntity.ok(
                    Map.of(
                            "message", "Reset token created for testing",
                            "resetToken", token
                    ));

        } catch (RuntimeException e) {
            // Avoid revealing whether an account exists.
            return ResponseEntity.ok(
                    Map.of("message",
                            "If the account exists, recovery can proceed."));
        }
    }

    // RESET PASSWORD
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, String> request) {

        String token = request.get("token");
        String newPassword = request.get("newPassword");

        if (token == null || token.isBlank()
                || newPassword == null || newPassword.length() < 8) {

            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Token and a password of at least 8 characters are required"));
        }

        try {
            authService.resetPassword(token, newPassword);

            return ResponseEntity.ok(
                    Map.of("message",
                            "Password reset successfully. Please log in."));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage()));
        }
    }
}
