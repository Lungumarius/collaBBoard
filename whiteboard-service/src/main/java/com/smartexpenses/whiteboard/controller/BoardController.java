package com.smartexpenses.whiteboard.controller;

import com.smartexpenses.whiteboard.dto.BoardResponse;
import com.smartexpenses.whiteboard.dto.CreateBoardRequest;
import com.smartexpenses.whiteboard.dto.UpdateBoardRequest;
import com.smartexpenses.whiteboard.service.BoardService;
import com.smartexpenses.whiteboard.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<BoardResponse> createBoard(
            @Valid @RequestBody CreateBoardRequest request,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        BoardResponse response = boardService.createBoard(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{boardId}")
    public ResponseEntity<BoardResponse> getBoardById(
            @PathVariable UUID boardId,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        BoardResponse response = boardService.getBoardById(boardId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BoardResponse>> getUserBoards(
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        List<BoardResponse> boards = boardService.getUserBoards(userId);
        return ResponseEntity.ok(boards);
    }

    @GetMapping("/public")
    public ResponseEntity<List<BoardResponse>> getPublicBoards() {
        List<BoardResponse> boards = boardService.getPublicBoards();
        return ResponseEntity.ok(boards);
    }

    @PutMapping("/{boardId}")
    public ResponseEntity<BoardResponse> updateBoard(
            @PathVariable UUID boardId,
            @Valid @RequestBody UpdateBoardRequest request,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        BoardResponse response = boardService.updateBoard(boardId, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{boardId}")
    public ResponseEntity<Void> deleteBoard(
            @PathVariable UUID boardId,
            @RequestHeader("Authorization") String authorization) {
        
        UUID userId = jwtUtil.extractUserIdFromHeader(authorization);
        boardService.deleteBoard(boardId, userId);
        return ResponseEntity.noContent().build();
    }
}
