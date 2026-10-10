
package com.vibepass.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        System.out.println("JWT FILTER REACHED: "
                + request.getMethod() + " " + request.getRequestURI());

        // Continue without authentication if no Bearer token is supplied.
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7).trim();

        try {
            JwtService.TokenData data = jwtService.validateAndRead(token);

            if (data != null
                    && data.userId() > 0
                    && data.email() != null
                    && !data.email().isBlank()
                    && ("USER".equals(data.role())
                    || "ADMIN".equals(data.role()))) {

                UserIdentity identity = new UserIdentity(
                        data.userId(),
                        data.email(),
                        data.role()
                );

                var authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + data.role())
                );

                var authentication =
                        new UsernamePasswordAuthenticationToken(
                                identity,
                                null,
                                authorities
                        );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);

                // Debug messages: confirm successful JWT authentication.
                System.out.println("JWT AUTHENTICATED: "
                        + authentication.getAuthorities());
                System.out.println("JWT USER ID: " + identity.id());

            } else {
                System.out.println(
                        "JWT AUTHENTICATION FAILED: validateAndRead returned null");
                SecurityContextHolder.clearContext();
            }

        } catch (RuntimeException e) {
            System.out.println("JWT AUTHENTICATION FAILED: "
                    + e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    public record UserIdentity(
            long id,
            String email,
            String role) {
    }
}
