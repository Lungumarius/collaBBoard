package com.smartexpenses.whiteboard.websocket.dto;

import com.smartexpenses.whiteboard.model.enums.ShapeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * WebSocket message DTO for shape events
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {

    /**
     * Message type: CREATE, UPDATE, DELETE, CURSOR_MOVE, USER_JOIN, USER_LEAVE
     */
    private MessageType type;

    /**
     * Board ID where the event occurred
     */
    private UUID boardId;

    /**
     * Shape ID (for shape events)
     */
    private UUID shapeId;

    /**
     * Shape type (for shape events)
     */
    private ShapeType shapeType;

    /**
     * Shape data (JSON properties)
     */
    private Map<String, Object> shapeData;

    /**
     * Layer order (for shape events)
     */
    private Integer layerOrder;

    /**
     * User ID who performed the action
     */
    private UUID userId;

    /**
     * User email (optional, for presence)
     */
    private String userEmail;

    /**
     * Cursor position (for cursor tracking)
     */
    private CursorPosition cursor;

    /**
     * Timestamp of the event
     */
    private Long timestamp;

    public enum MessageType {
        // Shape events
        SHAPE_CREATE,
        SHAPE_UPDATE,
        SHAPE_DELETE,
        
        // User presence
        USER_JOIN,
        USER_LEAVE,
        
        // Cursor tracking
        CURSOR_MOVE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CursorPosition {
        private Double x;
        private Double y;
    }
}
