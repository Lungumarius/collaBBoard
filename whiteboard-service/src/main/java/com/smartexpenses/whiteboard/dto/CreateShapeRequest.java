package com.smartexpenses.whiteboard.dto;

import com.smartexpenses.whiteboard.model.enums.ShapeType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateShapeRequest {

    // Board ID comes from path variable, not request body
    // This field is set by controller from @PathVariable
    private UUID boardId;

    @NotNull(message = "Shape type is required")
    private ShapeType type;

    @NotNull(message = "Shape data is required")
    private Map<String, Object> data; // Flexible JSON for shape properties

    private Integer layerOrder; // Optional, will be auto-assigned if not provided
}
