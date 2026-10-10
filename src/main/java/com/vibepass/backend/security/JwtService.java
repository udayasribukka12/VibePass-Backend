
package com.vibepass.backend.security;

import com.vibepass.backend.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class JwtService {

    private final byte[] secret;
    private final long expirationSeconds;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-seconds:3600}")
            long expirationSeconds) {

        this.secret = Base64.getDecoder().decode(secret);
        this.expirationSeconds = expirationSeconds;

        if (this.secret.length < 32) {
            throw new IllegalArgumentException(
                    "JWT secret must contain at least 32 random bytes");
        }
    }

    public String generateToken(User user) {
        long now = Instant.now().getEpochSecond();

        String header =
                "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

        String payload = "{"
                + "\"sub\":\"" + escape(user.getEmail()) + "\","
                + "\"uid\":" + user.getId() + ","
                + "\"role\":\"" + escape(user.getRole()) + "\","
                + "\"iat\":" + now + ","
                + "\"exp\":" + (now + expirationSeconds)
                + "}";

        String content = encode(header) + "." + encode(payload);

        return content + "." + sign(content);
    }

    public TokenData validateAndRead(String token) {
        try {
            String[] parts = token.split("\\.", -1);

            if (parts.length != 3) {
                System.out.println("JWT DEBUG: Incorrect token format");
                return null;
            }

            String header = new String(
                    Base64.getUrlDecoder().decode(parts[0]),
                    StandardCharsets.UTF_8);

            if (!"{\"alg\":\"HS256\",\"typ\":\"JWT\"}".equals(header)) {
                System.out.println("JWT DEBUG: Header mismatch");
                return null;
            }

            String content = parts[0] + "." + parts[1];

            byte[] actual =
                    Base64.getUrlDecoder().decode(parts[2]);

            byte[] expected =
                    Base64.getUrlDecoder().decode(sign(content));

            if (!MessageDigest.isEqual(expected, actual)) {
                System.out.println("JWT DEBUG: Signature mismatch");
                return null;
            }

            String payload = new String(
                    Base64.getUrlDecoder().decode(parts[1]),
                    StandardCharsets.UTF_8);

            String email = readString(payload, "sub");
            String role = readString(payload, "role");
            long userId = readNumber(payload, "uid");
            long expiry = readNumber(payload, "exp");

            if (email == null || email.isBlank()
                    || role == null || userId <= 0) {
                System.out.println(
                        "JWT DEBUG: Missing or invalid claims");
                return null;
            }

            if (expiry <= Instant.now().getEpochSecond()) {
                System.out.println("JWT DEBUG: Token expired");
                return null;
            }

            if (!role.equals("USER") && !role.equals("ADMIN")) {
                System.out.println("JWT DEBUG: Invalid role");
                return null;
            }

            System.out.println("JWT DEBUG: Validation successful");

            return new TokenData(userId, email, role);

        } catch (Exception ex) {
            System.out.println("JWT DEBUG: "
                    + ex.getClass().getSimpleName()
                    + " - " + ex.getMessage());
            return null;
        }
    }

    private String sign(String content) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");

            mac.init(new SecretKeySpec(secret, "HmacSHA256"));

            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(
                            mac.doFinal(
                                    content.getBytes(
                                            StandardCharsets.UTF_8)));

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Could not sign JWT", e);
        }
    }

    private String encode(String value) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                        value.getBytes(StandardCharsets.UTF_8));
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }

    private String readString(String json, String key) {
        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(key)
                        + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");

        Matcher matcher = pattern.matcher(json);

        if (!matcher.find()) {
            return null;
        }

        return matcher.group(1)
                .replace("\\\"", "\"")
                .replace("\\\\", "\\");
    }

    private long readNumber(String json, String key) {
        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(key)
                        + "\"\\s*:\\s*(\\d+)(?=\\s*[,}])");

        Matcher matcher = pattern.matcher(json);

        if (!matcher.find()) {
            return -1;
        }

        return Long.parseLong(matcher.group(1));
    }

    public record TokenData(
            long userId,
            String email,
            String role) {
    }
}
