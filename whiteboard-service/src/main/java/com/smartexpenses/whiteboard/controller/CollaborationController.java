package com.smartexpenses.whiteboard.controller;

import com.smartexpenses.whiteboard.dto.AddCollaboratorRequest;
import com.smartexpenses.whiteboard.dto.CollaboratorResponse;
import com.smartexpenses.whiteboard.model.enums.CollaboratorRole;
import com.smartexpenses.whiteboard.service.CollaborationService;
import com.smartexpenses.whiteboard.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards/{boardId}/collaborators")
@RequiredArgsConstructor
public class CollaborationController {

    private final CollaborationService collaborationService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<CollaboratorResponse> addCollaborator(
            @PathVariable UUID boardId,
            @Valid @RequestBody AddCollaboratorRequest request,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        CollaboratorResponse response = collaborationService.addCollaborator(boardId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CollaboratorResponse>> getBoardCollaborators(
            @PathVariable UUID boardId,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        List<CollaboratorResponse> collaborators = collaborationService.getBoardCollaborators(boardId, userId);
        return ResponseEntity.ok(collaborators);
    }

    @PutMapping("/{collaboratorUserId}/role")
    public ResponseEntity<Void> updateCollaboratorRole(
            @PathVariable UUID boardId,
            @PathVariable UUID collaboratorUserId,
            @RequestParam CollaboratorRole role,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        collaborationService.updateCollaboratorRole(boardId, collaboratorUserId, role, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{collaboratorUserId}")
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable UUID boardId,
            @PathVariable UUID collaboratorUserId,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        collaborationService.removeCollaborator(boardId, collaboratorUserId, userId);
        return ResponseEntity.noContent().build();
    }
}
