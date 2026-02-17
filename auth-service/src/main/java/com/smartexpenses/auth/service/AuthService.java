package com.smartexpenses.auth.service;


import com.smartexpenses.auth.dto.AuthResponse;
import com.smartexpenses.auth.dto.LoginRequest;
import com.smartexpenses.auth.dto.RegisterRequest;
import com.smartexpenses.auth.exception.AuthException;
import com.smartexpenses.auth.model.RefreshToken;
import com.smartexpenses.auth.model.User;
import com.smartexpenses.auth.repository.RefreshTokenRepository;
import com.smartexpenses.auth.repository.UserRepository;
import com.smartexpenses.auth.security.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);


    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.expiration}")
    private Long expiresIn;


    private AuthResponse generateTokenAndAuthResponse(User user) {
        String accessToken = jwtService.generateToken(user.getId(), user.getEmail());
        String refreshToken = createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(expiresIn / 1000)  // Convert milliseconds → seconds // 24 hours in seconds
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email already registered", HttpStatus.BAD_REQUEST);
        }
        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .isActive(true)
                .isEmailVerified(false)
                .build();

        user = userRepository.save(user);

        return generateTokenAndAuthResponse(user);

    }
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Invalid email or password", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid email or password", HttpStatus.UNAUTHORIZED);
        }

        if (!user.getIsActive()) {
            throw new AuthException("Account is deactivated", HttpStatus.FORBIDDEN);
        }

        return generateTokenAndAuthResponse(user);
    }


    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {

        RefreshToken token = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new AuthException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        User user = token.getUser();

        // 1. Expirat?
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AuthException("Refresh token expired", HttpStatus.UNAUTHORIZED);
        }

        // 2. REUSE DETECTION
        if (token.isUsed()) {

            refreshTokenRepository.deleteAllByUser(user);
            sendTokenReuseAlert(user);
            throw new AuthException("Refresh token reuse detected", HttpStatus.UNAUTHORIZED);
        }

        token.setUsed(true);
        refreshTokenRepository.saveAndFlush(token);

        String newRefreshToken = createRefreshToken(user);

        // 5. Creăm access token nou
        String newAccessToken = jwtService.generateToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(expiresIn / 1000)
                .tokenType("Bearer")
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .build();
    }

    private void sendTokenReuseAlert(User user) {
        logger.warn("TOKEN REUSE DETECTED for user: {}", user.getEmail());
    }

    // În register():



    private String createRefreshToken(User user) {
        String tokenValue = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenValue)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .used(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        return tokenValue;
    }

    @Transactional
    public void logout(String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new AuthException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        refreshTokenRepository.delete(token);
    }
}
