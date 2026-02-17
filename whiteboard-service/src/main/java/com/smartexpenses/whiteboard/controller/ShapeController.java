package com.smartexpenses.whiteboard.controller;

import com.smartexpenses.whiteboard.dto.CreateShapeRequest;
import com.smartexpenses.whiteboard.dto.ShapeResponse;
import com.smartexpenses.whiteboard.dto.UpdateShapeRequest;
import com.smartexpenses.whiteboard.service.ShapeService;
import com.smartexpenses.whiteboard.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards/{boardId}/shapes")
@RequiredArgsConstructor
public class ShapeController {

    private final ShapeService shapeService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ShapeResponse> createShape(
            @PathVariable UUID boardId,
            @Valid @RequestBody CreateShapeRequest request,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        // Set boardId from path variable
        request.setBoardId(boardId);
        
        ShapeResponse response = shapeService.createShape(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ShapeResponse>> getBoardShapes(
            @PathVariable UUID boardId,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        List<ShapeResponse> shapes = shapeService.getBoardShapes(boardId, userId);
        return ResponseEntity.ok(shapes);
    }

    @PutMapping("/{shapeId}")
    public ResponseEntity<ShapeResponse> updateShape(
            @PathVariable UUID boardId,
            @PathVariable UUID shapeId,
            @Valid @RequestBody UpdateShapeRequest request,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        ShapeResponse response = shapeService.updateShape(shapeId, boardId, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{shapeId}")
    public ResponseEntity<Void> deleteShape(
            @PathVariable UUID boardId,
            @PathVariable UUID shapeId,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        shapeService.deleteShape(shapeId, boardId, userId);
        return ResponseEntity.noContent().build();
    }
}
