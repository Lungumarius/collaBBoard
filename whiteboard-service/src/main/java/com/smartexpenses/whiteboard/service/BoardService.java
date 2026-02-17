package com.smartexpenses.whiteboard.service;

import com.smartexpenses.whiteboard.dto.BoardResponse;
import com.smartexpenses.whiteboard.dto.CreateBoardRequest;
import com.smartexpenses.whiteboard.dto.UpdateBoardRequest;
import com.smartexpenses.whiteboard.exception.ResourceNotFoundException;
import com.smartexpenses.whiteboard.exception.UnauthorizedException;
import com.smartexpenses.whiteboard.model.Board;
import com.smartexpenses.whiteboard.model.enums.CollaboratorRole;
import com.smartexpenses.whiteboard.repository.BoardCollaboratorRepository;
import com.smartexpenses.whiteboard.repository.BoardRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardCollaboratorRepository collaboratorRepository;

    @Transactional
    public BoardResponse createBoard(CreateBoardRequest request, UUID userId) {
        log.debug("Creating board: {} for user: {}", request.getName(), userId);

        Board board = Board.builder()
                .name(request.getName())
                .description(request.getDescription())
                .ownerId(userId)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .build();

        board = boardRepository.save(board);
        log.info("Board created successfully: {} by user: {}", board.getId(), userId);

        return mapToResponse(board);
    }

    public BoardResponse getBoardById(UUID boardId, UUID userId) {
        log.debug("Getting board: {} for user: {}", boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Check access: owner, collaborator, or public board
        if (!hasAccess(board, userId)) {
            throw new UnauthorizedException("You don't have access to this board");
        }

        return mapToResponse(board);
    }

    public List<BoardResponse> getUserBoards(UUID userId) {
        log.debug("Getting all boards for user: {}", userId);
        
        List<Board> boards = boardRepository.findBoardsAccessibleByUser(userId);
        return boards.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BoardResponse> getPublicBoards() {
        log.debug("Getting all public boards");
        
        List<Board> boards = boardRepository.findByIsPublicTrueOrderByCreatedAtDesc();
        return boards.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BoardResponse updateBoard(UUID boardId, UpdateBoardRequest request, UUID userId) {
        log.debug("Updating board: {} by user: {}", boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Only owner can update board
        if (!board.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("Only the board owner can update the board");
        }

        // Update fields if provided
        if (request.getName() != null) {
            board.setName(request.getName());
        }
        if (request.getDescription() != null) {
            board.setDescription(request.getDescription());
        }
        if (request.getIsPublic() != null) {
            board.setIsPublic(request.getIsPublic());
        }

        board = boardRepository.save(board);
        log.info("Board updated successfully: {}", boardId);

        return mapToResponse(board);
    }

    @Transactional
    public void deleteBoard(UUID boardId, UUID userId) {
        log.debug("Deleting board: {} by user: {}", boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Only owner can delete board
        if (!board.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("Only the board owner can delete the board");
        }

        boardRepository.delete(board);
        log.info("Board deleted successfully: {}", boardId);
    }

    // Helper method to check if user has access to board
    private boolean hasAccess(Board board, UUID userId) {
        // Owner always has access
        if (board.getOwnerId().equals(userId)) {
            return true;
        }

        // Public boards are accessible to everyone
        if (Boolean.TRUE.equals(board.getIsPublic())) {
            return true;
        }

        // Check if user is a collaborator
        return collaboratorRepository.existsByBoardIdAndUserId(board.getId(), userId);
    }

    // Helper method to map Board entity to BoardResponse DTO
    private BoardResponse mapToResponse(Board board) {
        return BoardResponse.builder()
                .id(board.getId())
                .name(board.getName())
                .description(board.getDescription())
                .ownerId(board.getOwnerId())
                .isPublic(board.getIsPublic())
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }
}
