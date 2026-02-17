package com.smartexpenses.whiteboard.websocket;

import com.smartexpenses.whiteboard.websocket.WebSocketSecurityInterceptor.WebSocketUserPrincipal;
import com.smartexpenses.whiteboard.websocket.dto.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.security.Principal;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Event listener for WebSocket connection events
 * Handles user join/leave notifications and presence tracking
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    
    // Track active users per board
    // Key: boardId, Value: Set of userIds
    private final ConcurrentMap<UUID, ConcurrentHashMap<UUID, String>> activeUsersPerBoard = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        
        if (principal instanceof WebSocketUserPrincipal userPrincipal) {
            UUID userId = userPrincipal.getUserId();
            String email = userPrincipal.getEmail();
            log.info("WebSocket connected: user={} ({})", userId, email);
        } else {
            log.warn("WebSocket connected with invalid principal");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        
        if (principal instanceof WebSocketUserPrincipal userPrincipal) {
            UUID userId = userPrincipal.getUserId();
            String email = userPrincipal.getEmail();
            
            log.info("WebSocket disconnected: user={} ({})", userId, email);
            
            // Remove user from all boards and notify others
            removeUserFromAllBoards(userId, email);
        } else {
            log.warn("WebSocket disconnected with invalid principal");
        }
    }

    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        
        if (principal instanceof WebSocketUserPrincipal userPrincipal) {
            UUID userId = userPrincipal.getUserId();
            String email = userPrincipal.getEmail();
            
            // Extract board ID from subscription destination
            String destination = headerAccessor.getDestination();
            if (destination != null && destination.startsWith("/topic/board/")) {
                String boardIdStr = extractBoardIdFromDestination(destination);
                if (boardIdStr != null) {
                    try {
                        UUID boardId = UUID.fromString(boardIdStr);
                        addUserToBoard(boardId, userId, email);
                        log.debug("User subscribed to board: userId={}, boardId={}", userId, boardId);
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid board ID in subscription: {}", boardIdStr);
                    }
                }
            }
        }
    }

    /**
     * Add user to board's active users and notify others
     */
    public void addUserToBoard(UUID boardId, UUID userId, String email) {
        ConcurrentHashMap<UUID, String> activeUsers = activeUsersPerBoard.computeIfAbsent(boardId, k -> new ConcurrentHashMap<>());
        boolean isNewUser = !activeUsers.containsKey(userId);
        activeUsers.put(userId, email);
        
        // Notify other users on this board that a user joined (only if it's a new user)
        if (isNewUser) {
            WebSocketMessage joinMessage = WebSocketMessage.builder()
                    .type(WebSocketMessage.MessageType.USER_JOIN)
                    .boardId(boardId)
                    .userId(userId)
                    .userEmail(email)
                    .timestamp(System.currentTimeMillis())
                    .build();
            
            messagingTemplate.convertAndSend("/topic/board/" + boardId + "/presence", joinMessage);
            log.info("User joined board: userId={}, boardId={}", userId, boardId);
        }
    }

    /**
     * Remove user from board's active users and notify others
     */
    public void removeUserFromBoard(UUID boardId, UUID userId, String email) {
        ConcurrentHashMap<UUID, String> activeUsers = activeUsersPerBoard.get(boardId);
        if (activeUsers != null) {
            activeUsers.remove(userId);
            if (activeUsers.isEmpty()) {
                activeUsersPerBoard.remove(boardId);
            }
        }
        
        // Notify other users on this board that a user left
        WebSocketMessage leaveMessage = WebSocketMessage.builder()
                .type(WebSocketMessage.MessageType.USER_LEAVE)
                .boardId(boardId)
                .userId(userId)
                .userEmail(email)
                .timestamp(System.currentTimeMillis())
                .build();
        
        messagingTemplate.convertAndSend("/topic/board/" + boardId + "/presence", leaveMessage);
        log.info("User left board: userId={}, boardId={}", userId, boardId);
    }

    /**
     * Remove user from all boards (on disconnect)
     */
    private void removeUserFromAllBoards(UUID userId, String email) {
        activeUsersPerBoard.forEach((boardId, users) -> {
            if (users.containsKey(userId)) {
                removeUserFromBoard(boardId, userId, email);
            }
        });
    }

    /**
     * Extract board ID from subscription destination
     * Example: "/topic/board/{boardId}/shapes" -> "{boardId}"
     */
    private String extractBoardIdFromDestination(String destination) {
        // Pattern: /topic/board/{boardId}/...
        if (destination.startsWith("/topic/board/")) {
            String[] parts = destination.split("/");
            if (parts.length >= 4) {
                return parts[3]; // boardId is at index 3
            }
        }
        return null;
    }

    /**
     * Get active users for a board
     */
    public ConcurrentHashMap<UUID, String> getActiveUsersForBoard(UUID boardId) {
        return activeUsersPerBoard.getOrDefault(boardId, new ConcurrentHashMap<>());
    }
}
