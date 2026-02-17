package com.smartexpenses.whiteboard.websocket;

import com.smartexpenses.whiteboard.dto.CreateShapeRequest;
import com.smartexpenses.whiteboard.dto.UpdateShapeRequest;
import com.smartexpenses.whiteboard.exception.ResourceNotFoundException;
import com.smartexpenses.whiteboard.exception.UnauthorizedException;
import com.smartexpenses.whiteboard.model.Board;
import com.smartexpenses.whiteboard.model.Shape;
import com.smartexpenses.whiteboard.model.enums.CollaboratorRole;
import com.smartexpenses.whiteboard.repository.BoardCollaboratorRepository;
import com.smartexpenses.whiteboard.repository.BoardRepository;
import com.smartexpenses.whiteboard.repository.ShapeRepository;
import com.smartexpenses.whiteboard.security.JwtService;
import com.smartexpenses.whiteboard.service.ShapeService;
import com.smartexpenses.whiteboard.websocket.dto.WebSocketMessage;
import com.smartexpenses.whiteboard.websocket.WebSocketSecurityInterceptor.WebSocketUserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * WebSocket controller for real-time collaboration
 * Handles shape events (create, update, delete) and broadcasts to all connected clients
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ShapeService shapeService;
    private final ShapeRepository shapeRepository;
    private final BoardRepository boardRepository;
    private final BoardCollaboratorRepository collaboratorRepository;
    private final JwtService jwtService;
    private final WebSocketEventListener webSocketEventListener;

    /**
     * Handle shape creation via WebSocket
     * Client sends: /app/shape/create
     * Broadcasts to: /topic/board/{boardId}/shapes
     */
    @MessageMapping("/shape/create")
    public void createShape(@Payload WebSocketMessage message, Principal principal) {
        WebSocketUserPrincipal user = (WebSocketUserPrincipal) principal;
        UUID userId = user.getUserId();
        
        log.debug("WebSocket shape create: boardId={}, userId={}", message.getBoardId(), userId);

        try {
            // Validate board access
            validateBoardAccess(message.getBoardId(), userId, true);

            // Create shape via service (which persists to DB)
            CreateShapeRequest request = CreateShapeRequest.builder()
                    .boardId(message.getBoardId())
                    .type(message.getShapeType())
                    .data(message.getShapeData())
                    .layerOrder(message.getLayerOrder())
                    .build();

            var shapeResponse = shapeService.createShape(request, userId);

            // Build WebSocket message for broadcast
            WebSocketMessage broadcastMessage = WebSocketMessage.builder()
                    .type(WebSocketMessage.MessageType.SHAPE_CREATE)
                    .boardId(message.getBoardId())
                    .shapeId(shapeResponse.getId())
                    .shapeType(shapeResponse.getType())
                    .shapeData(shapeResponse.getData())
                    .layerOrder(shapeResponse.getLayerOrder())
                    .userId(userId)
                    .userEmail(user.getEmail())
                    .timestamp(System.currentTimeMillis())
                    .build();

            // Notify user joined board (for presence tracking)
            webSocketEventListener.addUserToBoard(message.getBoardId(), userId, user.getEmail());

            // Broadcast to all clients subscribed to this board
            messagingTemplate.convertAndSend("/topic/board/" + message.getBoardId() + "/shapes", broadcastMessage);
            log.info("Shape created and broadcasted: {} on board: {}", shapeResponse.getId(), message.getBoardId());

        } catch (Exception e) {
            log.error("Error creating shape via WebSocket: {}", e.getMessage());
            sendErrorToUser(userId, "Failed to create shape: " + e.getMessage());
        }
    }

    /**
     * Handle shape update via WebSocket
     * Client sends: /app/shape/update
     * Broadcasts to: /topic/board/{boardId}/shapes
     */
    @MessageMapping("/shape/update")
    public void updateShape(@Payload WebSocketMessage message, Principal principal) {
        WebSocketUserPrincipal user = (WebSocketUserPrincipal) principal;
        UUID userId = user.getUserId();
        
        log.debug("WebSocket shape update: shapeId={}, boardId={}, userId={}", 
                message.getShapeId(), message.getBoardId(), userId);

        try {
            // Validate board access and edit permission
            validateBoardAccess(message.getBoardId(), userId, true);

            // Update shape via service
            UpdateShapeRequest request = UpdateShapeRequest.builder()
                    .data(message.getShapeData())
                    .layerOrder(message.getLayerOrder())
                    .build();

            var shapeResponse = shapeService.updateShape(
                    message.getShapeId(), 
                    message.getBoardId(), 
                    request, 
                    userId
            );

            // Build broadcast message
            WebSocketMessage broadcastMessage = WebSocketMessage.builder()
                    .type(WebSocketMessage.MessageType.SHAPE_UPDATE)
                    .boardId(message.getBoardId())
                    .shapeId(shapeResponse.getId())
                    .shapeType(shapeResponse.getType())
                    .shapeData(shapeResponse.getData())
                    .layerOrder(shapeResponse.getLayerOrder())
                    .userId(userId)
                    .userEmail(user.getEmail())
                    .timestamp(System.currentTimeMillis())
                    .build();

            // Broadcast to all clients
            messagingTemplate.convertAndSend("/topic/board/" + message.getBoardId() + "/shapes", broadcastMessage);
            log.info("Shape updated and broadcasted: {} on board: {}", message.getShapeId(), message.getBoardId());

        } catch (Exception e) {
            log.error("Error updating shape via WebSocket: {}", e.getMessage());
            sendErrorToUser(userId, "Failed to update shape: " + e.getMessage());
        }
    }

    /**
     * Handle shape deletion via WebSocket
     * Client sends: /app/shape/delete
     * Broadcasts to: /topic/board/{boardId}/shapes
     */
    @MessageMapping("/shape/delete")
    public void deleteShape(@Payload WebSocketMessage message, Principal principal) {
        WebSocketUserPrincipal user = (WebSocketUserPrincipal) principal;
        UUID userId = user.getUserId();
        
        log.debug("WebSocket shape delete: shapeId={}, boardId={}, userId={}", 
                message.getShapeId(), message.getBoardId(), userId);

        try {
            // Validate board access and edit permission
            validateBoardAccess(message.getBoardId(), userId, true);

            // Delete shape via service
            shapeService.deleteShape(message.getShapeId(), message.getBoardId(), userId);

            // Build broadcast message
            WebSocketMessage broadcastMessage = WebSocketMessage.builder()
                    .type(WebSocketMessage.MessageType.SHAPE_DELETE)
                    .boardId(message.getBoardId())
                    .shapeId(message.getShapeId())
                    .userId(userId)
                    .userEmail(user.getEmail())
                    .timestamp(System.currentTimeMillis())
                    .build();

            // Broadcast to all clients
            messagingTemplate.convertAndSend("/topic/board/" + message.getBoardId() + "/shapes", broadcastMessage);
            log.info("Shape deleted and broadcasted: {} on board: {}", message.getShapeId(), message.getBoardId());

        } catch (Exception e) {
            log.error("Error deleting shape via WebSocket: {}", e.getMessage());
            sendErrorToUser(userId, "Failed to delete shape: " + e.getMessage());
        }
    }

    /**
     * Handle cursor movement for tracking
     * Client sends: /app/cursor/move
     * Broadcasts to: /topic/board/{boardId}/cursors (except sender)
     */
    @MessageMapping("/cursor/move")
    public void handleCursorMove(@Payload WebSocketMessage message, Principal principal) {
        WebSocketUserPrincipal user = (WebSocketUserPrincipal) principal;
        UUID userId = user.getUserId();
        
        log.trace("WebSocket cursor move: boardId={}, userId={}", message.getBoardId(), userId);

        try {
            // Validate board access
            validateBoardAccess(message.getBoardId(), userId, false);

            // Build cursor message
            WebSocketMessage cursorMessage = WebSocketMessage.builder()
                    .type(WebSocketMessage.MessageType.CURSOR_MOVE)
                    .boardId(message.getBoardId())
                    .userId(userId)
                    .userEmail(user.getEmail())
                    .cursor(message.getCursor())
                    .timestamp(System.currentTimeMillis())
                    .build();

            // Broadcast to all clients except sender (for cursor tracking)
            messagingTemplate.convertAndSend("/topic/board/" + message.getBoardId() + "/cursors", cursorMessage);

        } catch (Exception e) {
            log.debug("Error handling cursor move: {}", e.getMessage());
            // Don't send error for cursor moves, just log
        }
    }

    // Helper method to validate board access and edit permission
    private void validateBoardAccess(UUID boardId, UUID userId, boolean requireEditPermission) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Owner always has access
        if (board.getOwnerId().equals(userId)) {
            if (requireEditPermission) {
                return; // Owner has edit permission
            }
            return; // Owner has access
        }

        // Public boards are accessible to everyone (view only)
        if (Boolean.TRUE.equals(board.getIsPublic())) {
            if (!requireEditPermission) {
                return; // Public board, view access granted
            }
            // For edit, need to check collaborator role
        }

        // Check if user is a collaborator
        var collaboratorRole = collaboratorRepository.findUserRoleOnBoard(boardId, userId);
        if (collaboratorRole.isPresent()) {
            if (requireEditPermission) {
                CollaboratorRole role = collaboratorRole.get();
                if (role == CollaboratorRole.EDITOR || role == CollaboratorRole.OWNER) {
                    return; // Editor or owner has edit permission
                }
                throw new UnauthorizedException("You don't have permission to edit this board");
            }
            return; // Collaborator has access
        }

        throw new UnauthorizedException("You don't have access to this board");
    }

    // Helper method to send error message to specific user
    private void sendErrorToUser(UUID userId, String errorMessage) {
        WebSocketMessage errorMessageObj = WebSocketMessage.builder()
                .type(WebSocketMessage.MessageType.SHAPE_DELETE) // Use any type, we'll check message content
                .timestamp(System.currentTimeMillis())
                .build();

        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/errors", errorMessageObj);
    }
}
