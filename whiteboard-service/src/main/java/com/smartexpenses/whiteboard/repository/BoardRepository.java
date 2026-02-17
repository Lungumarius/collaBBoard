package com.smartexpenses.whiteboard.repository;

import com.smartexpenses.whiteboard.model.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardRepository extends JpaRepository<Board, UUID> {

    // Find all boards owned by a user
    List<Board> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    // Find all public boards
    List<Board> findByIsPublicTrueOrderByCreatedAtDesc();

    // Find board by id and owner (for authorization checks)
    Optional<Board> findByIdAndOwnerId(UUID id, UUID ownerId);

    // Check if user is owner of board
    boolean existsByIdAndOwnerId(UUID id, UUID ownerId);

    // Find boards where user is collaborator (via board_collaborators table)
    @Query("SELECT DISTINCT b FROM Board b " +
           "LEFT JOIN BoardCollaborator bc ON bc.board.id = b.id " +
           "WHERE b.ownerId = :userId OR bc.userId = :userId " +
           "ORDER BY b.createdAt DESC")
    List<Board> findBoardsAccessibleByUser(@Param("userId") UUID userId);
}
