package com.smartexpenses.whiteboard.service;

import com.smartexpenses.whiteboard.dto.CreateShapeRequest;
import com.smartexpenses.whiteboard.dto.ShapeResponse;
import com.smartexpenses.whiteboard.dto.UpdateShapeRequest;
import com.smartexpenses.whiteboard.exception.ResourceNotFoundException;
import com.smartexpenses.whiteboard.exception.UnauthorizedException;
import com.smartexpenses.whiteboard.model.Board;
import com.smartexpenses.whiteboard.model.Shape;
import com.smartexpenses.whiteboard.model.enums.CollaboratorRole;
import com.smartexpenses.whiteboard.repository.BoardCollaboratorRepository;
import com.smartexpenses.whiteboard.repository.BoardRepository;
import com.smartexpenses.whiteboard.repository.ShapeRepository;
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
public class ShapeService {

    private final ShapeRepository shapeRepository;
    private final BoardRepository boardRepository;
    private final BoardCollaboratorRepository collaboratorRepository;

    @Transactional
    public ShapeResponse createShape(CreateShapeRequest request, UUID userId) {
        log.debug("Creating shape of type: {} on board: {} by user: {}", 
                request.getType(), request.getBoardId(), userId);

        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new ResourceNotFoundException("Board", request.getBoardId()));

        // Check if user has edit permission (owner or editor)
        if (!hasEditPermission(board, userId)) {
            throw new UnauthorizedException("You don't have permission to create shapes on this board");
        }

        // Determine layer order (auto-assign if not provided)
        Integer layerOrder = request.getLayerOrder();
        if (layerOrder == null) {
            Integer maxLayer = shapeRepository.getMaxLayerOrderForBoard(board.getId());
            layerOrder = maxLayer != null ? maxLayer + 1 : 0;
        }

        Shape shape = Shape.builder()
                .board(board)
                .type(request.getType())
                .data(request.getData())
                .layerOrder(layerOrder)
                .createdBy(userId)
                .build();

        shape = shapeRepository.save(shape);
        log.info("Shape created successfully: {} on board: {}", shape.getId(), board.getId());

        return mapToResponse(shape);
    }

    public List<ShapeResponse> getBoardShapes(UUID boardId, UUID userId) {
        log.debug("Getting shapes for board: {} for user: {}", boardId, userId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", boardId));

        // Check if user has access (owner, collaborator, or public board)
        if (!hasAccess(board, userId)) {
            throw new UnauthorizedException("You don't have access to this board");
        }

        List<Shape> shapes = shapeRepository.findByBoardIdOrderByLayerOrderAsc(boardId);
        return shapes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ShapeResponse updateShape(UUID shapeId, UUID boardId, UpdateShapeRequest request, UUID userId) {
        log.debug("Updating shape: {} on board: {} by user: {}", shapeId, boardId, userId);

        Shape shape = shapeRepository.findByIdAndBoardId(shapeId, boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Shape", shapeId));

        Board board = shape.getBoard();

        // Check if user has edit permission (owner or editor)
        if (!hasEditPermission(board, userId)) {
            throw new UnauthorizedException("You don't have permission to update shapes on this board");
        }

        // Update fields if provided
        if (request.getData() != null) {
            shape.setData(request.getData());
        }
        if (request.getLayerOrder() != null) {
            shape.setLayerOrder(request.getLayerOrder());
        }

        shape = shapeRepository.save(shape);
        log.info("Shape updated successfully: {}", shapeId);

        return mapToResponse(shape);
    }

    @Transactional
    public void deleteShape(UUID shapeId, UUID boardId, UUID userId) {
        log.debug("Deleting shape: {} on board: {} by user: {}", shapeId, boardId, userId);

        Shape shape = shapeRepository.findByIdAndBoardId(shapeId, boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Shape", shapeId));

        Board board = shape.getBoard();

        // Check if user has edit permission (owner or editor)
        if (!hasEditPermission(board, userId)) {
            throw new UnauthorizedException("You don't have permission to delete shapes on this board");
        }

        shapeRepository.delete(shape);
        log.info("Shape deleted successfully: {}", shapeId);
    }

    // Helper method to check if user has edit permission (owner or editor)
    private boolean hasEditPermission(Board board, UUID userId) {
        // Owner always has edit permission
        if (board.getOwnerId().equals(userId)) {
            return true;
        }

        // Check if user is an editor collaborator
        return collaboratorRepository.findUserRoleOnBoard(board.getId(), userId)
                .map(role -> role == CollaboratorRole.EDITOR || role == CollaboratorRole.OWNER)
                .orElse(false);
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

        // Check if user is a collaborator (any role)
        return collaboratorRepository.existsByBoardIdAndUserId(board.getId(), userId);
    }

    // Helper method to map Shape entity to ShapeResponse DTO
    private ShapeResponse mapToResponse(Shape shape) {
        return ShapeResponse.builder()
                .id(shape.getId())
                .boardId(shape.getBoard().getId())
                .type(shape.getType())
                .data(shape.getData())
                .layerOrder(shape.getLayerOrder())
                .createdBy(shape.getCreatedBy())
                .createdAt(shape.getCreatedAt())
                .updatedAt(shape.getUpdatedAt())
                .build();
    }
}
