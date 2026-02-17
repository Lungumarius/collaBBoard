package com.smartexpenses.whiteboard.repository;

import com.smartexpenses.whiteboard.model.BoardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BoardSnapshotRepository extends JpaRepository<BoardSnapshot, UUID> {

    // Find all snapshots for a board, ordered by creation date (newest first)
    List<BoardSnapshot> findByBoardIdOrderByCreatedAtDesc(UUID boardId);

    // Delete all snapshots for a board (when board is deleted)
    @Modifying
    @Query("DELETE FROM BoardSnapshot bs WHERE bs.board.id = :boardId")
    void deleteAllByBoardId(@Param("boardId") UUID boardId);

    // Find latest snapshot for a board
    @Query("SELECT bs FROM BoardSnapshot bs WHERE bs.board.id = :boardId ORDER BY bs.createdAt DESC LIMIT 1")
    BoardSnapshot findLatestByBoardId(@Param("boardId") UUID boardId);
}
