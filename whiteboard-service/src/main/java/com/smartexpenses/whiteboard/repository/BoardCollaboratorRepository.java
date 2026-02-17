package com.smartexpenses.whiteboard.repository;

import com.smartexpenses.whiteboard.model.Board;
import com.smartexpenses.whiteboard.model.BoardCollaborator;
import com.smartexpenses.whiteboard.model.enums.CollaboratorRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardCollaboratorRepository extends JpaRepository<BoardCollaborator, UUID> {

    // Find all collaborators for a board
    List<BoardCollaborator> findByBoardIdOrderByCreatedAtAsc(UUID boardId);

    // Find specific collaborator relationship
    Optional<BoardCollaborator> findByBoardIdAndUserId(UUID boardId, UUID userId);

    // Check if user is collaborator on board
    boolean existsByBoardIdAndUserId(UUID boardId, UUID userId);

    // Get user's role on a board
    @Query("SELECT bc.role FROM BoardCollaborator bc WHERE bc.board.id = :boardId AND bc.userId = :userId")
    Optional<CollaboratorRole> findUserRoleOnBoard(@Param("boardId") UUID boardId, @Param("userId") UUID userId);

    // Find all boards where user is collaborator
    List<BoardCollaborator> findByUserId(UUID userId);

    // Delete all collaborators for a board (when board is deleted)
    @Modifying
    @Query("DELETE FROM BoardCollaborator bc WHERE bc.board.id = :boardId")
    void deleteAllByBoardId(@Param("boardId") UUID boardId);

    // Delete specific collaborator
    @Modifying
    void deleteByBoardIdAndUserId(UUID boardId, UUID userId);
}
