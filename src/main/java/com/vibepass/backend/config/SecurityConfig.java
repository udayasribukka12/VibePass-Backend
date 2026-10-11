
package com.vibepass.backend.config;

import com.vibepass.backend.security.JwtAuthenticationFilter;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(auth -> auth

                        // Login, registration and password recovery
                        .requestMatchers("/api/auth/**").permitAll()

                        // Public event browsing
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/events",
                                "/api/events/"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/events/**"
                        ).permitAll()

                        // Event creation, update and deletion: ADMIN only
                        .requestMatchers("/api/events/**").hasRole("ADMIN")

                        // Admin-only access to all bookings
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/bookings"
                        ).hasRole("ADMIN")

                        // A logged-in user can request their booking list.
                        // The controller must verify ownership of the user ID.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/bookings/user/**"
                        ).authenticated()

                        // Other booking operations require authentication
                        .requestMatchers("/api/bookings/**").authenticated()

                        // Profile and other API endpoints require authentication
                        .requestMatchers("/api/**").authenticated()

                        // Non-API frontend routes
                        .anyRequest().permitAll()
                )
                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // Allow Vite on localhost ports during development
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://vibe-pass-frontend.vercel.app"
        ));

        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept"
        ));

        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
