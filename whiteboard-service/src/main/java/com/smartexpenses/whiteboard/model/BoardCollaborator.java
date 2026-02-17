package com.smartexpenses.whiteboard.model;

import com.smartexpenses.whiteboard.model.enums.CollaboratorRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "board_collaborators", schema = "whiteboard", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"board_id", "user_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardCollaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(name = "user_id", nullable = false)
    private UUID userId; // References users.id from auth-service

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CollaboratorRole role = CollaboratorRole.VIEWER;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
