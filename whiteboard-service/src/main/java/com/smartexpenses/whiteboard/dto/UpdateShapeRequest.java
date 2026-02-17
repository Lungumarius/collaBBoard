package com.smartexpenses.whiteboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateShapeRequest {

    private Map<String, Object> data; // Updated shape properties
    private Integer layerOrder; // Optional layer order update
}
