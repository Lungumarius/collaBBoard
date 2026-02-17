package com.smartexpenses.whiteboard.security;

import com.smartexpenses.whiteboard.exception.UnauthorizedException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

/**
 * JWT Service for validating tokens from auth-service
 * This service only validates JWT tokens, it doesn't generate them.
 * Token generation is handled by auth-service.
 */
@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret; // Same secret as auth-service for validation

    /**
     * Extract user ID from JWT token
     * @param token JWT token from Authorization header
     * @return User ID (UUID)
     * @throws UnauthorizedException if token is invalid
     */
    public UUID extractUserId(String token) {
        try {
            Claims claims = extractAllClaims(token);
            String userIdStr = claims.get("userId", String.class);
            if (userIdStr == null) {
                throw new UnauthorizedException("Token does not contain user ID");
            }
            return UUID.fromString(userIdStr);
        } catch (Exception e) {
            log.error("Failed to extract user ID from token: {}", e.getMessage());
            throw new UnauthorizedException("Invalid token: unable to extract user ID");
        }
    }

    /**
     * Extract email from JWT token
     * @param token JWT token
     * @return Email (subject of the token)
     */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Validate JWT token
     * @param token JWT token
     * @return true if token is valid, false otherwise
     */
    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            log.error("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            log.error("Failed to parse JWT claims: {}", e.getMessage());
            throw new UnauthorizedException("Invalid token: unable to parse claims");
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private SecretKey getSigningKey() {
        try {
            // Try to decode as base64 first
            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
            // Ensure minimum 32 bytes (256 bits) for HS256
            if (keyBytes.length < 32) {
                byte[] padded = new byte[32];
                System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
                keyBytes = padded;
            }
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            // If not base64, treat as hex string
            try {
                byte[] keyBytes = hexStringToByteArray(jwtSecret);
                // Ensure minimum 32 bytes (256 bits) for HS256
                if (keyBytes.length < 32) {
                    byte[] padded = new byte[32];
                    System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
                    keyBytes = padded;
                }
                return Keys.hmacShaKeyFor(keyBytes);
            } catch (Exception ex) {
                // Fallback: use raw string bytes
                log.warn("JWT secret is not base64 or hex encoded, using raw string");
                byte[] keyBytes = jwtSecret.getBytes();
                if (keyBytes.length < 32) {
                    byte[] padded = new byte[32];
                    System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
                    keyBytes = padded;
                }
                return Keys.hmacShaKeyFor(keyBytes);
            }
        }
    }

    private byte[] hexStringToByteArray(String s) {
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i+1), 16));
        }
        return data;
    }
}
