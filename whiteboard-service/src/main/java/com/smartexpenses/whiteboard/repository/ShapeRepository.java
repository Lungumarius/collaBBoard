package com.smartexpenses.whiteboard.repository;

import com.smartexpenses.whiteboard.model.Shape;
import com.smartexpenses.whiteboard.model.enums.ShapeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShapeRepository extends JpaRepository<Shape, UUID> {

    // Find all shapes for a board, ordered by layer
    List<Shape> findByBoardIdOrderByLayerOrderAsc(UUID boardId);

    // Find shapes by board and type
    List<Shape> findByBoardIdAndTypeOrderByLayerOrderAsc(UUID boardId, ShapeType type);

    // Find specific shape on a board
    Optional<Shape> findByIdAndBoardId(UUID id, UUID boardId);

    // Delete all shapes for a board (when board is deleted)
    @Modifying
    @Query("DELETE FROM Shape s WHERE s.board.id = :boardId")
    void deleteAllByBoardId(@Param("boardId") UUID boardId);

    // Delete specific shape
    @Modifying
    void deleteByIdAndBoardId(UUID id, UUID boardId);

    // Count shapes on a board
    long countByBoardId(UUID boardId);

    // Get max layer order for a board (to add new shapes on top)
    @Query("SELECT COALESCE(MAX(s.layerOrder), 0) FROM Shape s WHERE s.board.id = :boardId")
    Integer getMaxLayerOrderForBoard(@Param("boardId") UUID boardId);
}
