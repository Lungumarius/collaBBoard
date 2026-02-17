package com.smartexpenses.whiteboard.websocket;

import com.smartexpenses.whiteboard.exception.UnauthorizedException;
import com.smartexpenses.whiteboard.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

/**
 * WebSocket interceptor for JWT authentication
 * Validates JWT token from WebSocket connection headers
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketSecurityInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract JWT token from headers
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            
            if (authHeaders == null || authHeaders.isEmpty()) {
                log.warn("WebSocket connection attempt without Authorization header");
                throw new UnauthorizedException("Missing Authorization header");
            }

            String authHeader = authHeaders.get(0);
            
            if (!authHeader.startsWith("Bearer ")) {
                log.warn("WebSocket connection with invalid Authorization header format");
                throw new UnauthorizedException("Invalid Authorization header format");
            }

            String token = authHeader.substring(7); // Remove "Bearer " prefix

            try {
                // Validate token and extract user info
                if (!jwtService.isTokenValid(token)) {
                    log.warn("WebSocket connection with invalid token");
                    throw new UnauthorizedException("Invalid or expired token");
                }

                UUID userId = jwtService.extractUserId(token);
                String email = jwtService.extractEmail(token);

                // Set user principal for this connection
                accessor.setUser(new WebSocketUserPrincipal(userId, email));
                log.info("WebSocket connection authenticated for user: {} ({})", userId, email);

            } catch (Exception e) {
                log.error("WebSocket authentication failed: {}", e.getMessage());
                throw new UnauthorizedException("Authentication failed: " + e.getMessage());
            }
        }

        return message;
    }

    /**
     * Simple Principal implementation for WebSocket user
     */
    public static class WebSocketUserPrincipal implements Principal {
        private final UUID userId;
        private final String email;

        public WebSocketUserPrincipal(UUID userId, String email) {
            this.userId = userId;
            this.email = email;
        }

        @Override
        public String getName() {
            return userId.toString();
        }

        public UUID getUserId() {
            return userId;
        }

        public String getEmail() {
            return email;
        }
    }
}
