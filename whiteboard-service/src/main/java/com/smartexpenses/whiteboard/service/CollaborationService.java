package com.smartexpenses.whiteboard.service;

import com.smartexpenses.whiteboard.dto.AddCollaboratorRequest;
import com.smartexpenses.whiteboard.dto.CollaboratorResponse;
import com.smartexpenses.whiteboard.exception.ResourceNotFoundException;
import com.smartexpenses.whiteboard.exception.UnauthorizedException;
import com.smartexpenses.whiteboard.model.Board;
import com.smartexpenses.whiteboard.model.BoardCollaborator;
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
public class CollaborationService {

    private final BoardCollaboratorRepository collaboratorRepository;
    private final BoardRepository boardRepository;

    @Transactional
    public CollaboratorResponse addCollaborator(UUID boardId, AddCollaboratorRequest request, UUID userId) {
        log.debug("Adding collaborator: {} with role: {} to board: {} by user: {}", 
                request.getUserId(), request.getRole(), boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Only owner can add collaborators
        if (!board.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("Only the board owner can add collaborators");
        }

        // Cannot add owner as collaborator
        if (board.getOwnerId().equals(request.getUserId())) {
            throw new UnauthorizedException("The board owner is already a collaborator");
        }

        // Check if collaborator already exists
        if (collaboratorRepository.existsByBoardIdAndUserId(boardId, request.getUserId())) {
            throw new UnauthorizedException("User is already a collaborator on this board");
        }

        BoardCollaborator collaborator = BoardCollaborator.builder()
                .board(board)
                .userId(request.getUserId())
                .role(request.getRole())
                .build();

        collaborator = collaboratorRepository.save(collaborator);
        log.info("Collaborator added successfully: {} to board: {}", request.getUserId(), boardId);

        return mapToResponse(collaborator);
    }

    public List<CollaboratorResponse> getBoardCollaborators(UUID boardId, UUID userId) {
        log.debug("Getting collaborators for board: {} by user: {}", boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Check if user has access to board
        if (!hasAccess(board, userId)) {
            throw new UnauthorizedException("You don't have access to this board");
        }

        List<BoardCollaborator> collaborators = collaboratorRepository.findByBoardIdOrderByCreatedAtAsc(boardId);
        return collaborators.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateCollaboratorRole(UUID boardId, UUID collaboratorUserId, CollaboratorRole newRole, UUID userId) {
        log.debug("Updating collaborator role: {} to {} on board: {} by user: {}", 
                collaboratorUserId, newRole, boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Only owner can update collaborator roles
        if (!board.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("Only the board owner can update collaborator roles");
        }

        BoardCollaborator collaborator = collaboratorRepository.findByBoardIdAndUserId(boardId, collaboratorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborator", collaboratorUserId));

        collaborator.setRole(newRole);
        collaboratorRepository.save(collaborator);
        log.info("Collaborator role updated successfully: {} on board: {}", collaboratorUserId, boardId);
    }

    @Transactional
    public void removeCollaborator(UUID boardId, UUID collaboratorUserId, UUID userId) {
        log.debug("Removing collaborator: {} from board: {} by user: {}", 
                collaboratorUserId, boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Only owner can remove collaborators
        if (!board.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("Only the board owner can remove collaborators");
        }

        if (!collaboratorRepository.existsByBoardIdAndUserId(boardId, collaboratorUserId)) {
            throw new ResourceNotFoundException("Collaborator", collaboratorUserId);
        }

        collaboratorRepository.deleteByBoardIdAndUserId(boardId, collaboratorUserId);
        log.info("Collaborator removed successfully: {} from board: {}", collaboratorUserId, boardId);
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

    // Helper method to map BoardCollaborator entity to CollaboratorResponse DTO
    private CollaboratorResponse mapToResponse(BoardCollaborator collaborator) {
        return CollaboratorResponse.builder()
                .id(collaborator.getId())
                .boardId(collaborator.getBoard().getId())
                .userId(collaborator.getUserId())
                .role(collaborator.getRole())
                .createdAt(collaborator.getCreatedAt())
                .build();
    }
}
