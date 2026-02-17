package com.smartexpenses.whiteboard.dto;

import com.smartexpenses.whiteboard.model.enums.CollaboratorRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollaboratorResponse {

    private UUID id;
    private UUID boardId;
    private UUID userId;
    private CollaboratorRole role;
    private LocalDateTime createdAt;
}
