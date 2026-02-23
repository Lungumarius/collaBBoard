package com.smartexpenses.whiteboard.model;

import com.smartexpenses.whiteboard.model.enums.ShapeType;
import com.smartexpenses.whiteboard.util.JsonConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "shapes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shape {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ShapeType type;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, Object> data; 

    @Column(name = "layer_order", nullable = false)
    @Builder.Default
    private Integer layerOrder = 0;

    @Column(name = "created_by")
    private UUID createdBy; // References users.id from auth-service

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
