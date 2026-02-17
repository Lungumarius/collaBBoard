package com.smartexpenses.whiteboard.dto;

import com.smartexpenses.whiteboard.model.enums.ShapeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShapeResponse {

    private UUID id;
    private UUID boardId;
    private ShapeType type;
    private Map<String, Object> data;
    private Integer layerOrder;
    private UUID createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
