package com.smartexpenses.whiteboard.util;

import com.smartexpenses.whiteboard.exception.UnauthorizedException;
import com.smartexpenses.whiteboard.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Utility class for extracting and validating JWT tokens from Authorization header
 */
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final JwtService jwtService;

    /**
     * Extract user ID from Authorization header
     * @param authorizationHeader "Bearer <token>" format
     * @return User ID (UUID)
     * @throws UnauthorizedException if token is missing or invalid
     */
    public UUID extractUserIdFromHeader(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing or invalid Authorization header");
        }

        String token = authorizationHeader.substring(7); // Remove "Bearer " prefix

        if (!jwtService.isTokenValid(token)) {
            throw new UnauthorizedException("Invalid or expired token");
        }

        return jwtService.extractUserId(token);
    }
}
