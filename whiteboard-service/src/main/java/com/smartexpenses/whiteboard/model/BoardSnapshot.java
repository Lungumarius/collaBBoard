package com.smartexpenses.whiteboard.model;

import com.smartexpenses.whiteboard.util.JsonConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "board_snapshots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Convert(converter = JsonConverter.class)
    @Column(name = "snapshot_data", nullable = false, columnDefinition = "TEXT")
    private Map<String, Object> snapshotData; 

    @Column(name = "created_by")
    private UUID createdBy; // References users.id from auth-service

    @Column(length = 500)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
