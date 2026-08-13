package ro.mihaifade.backend.dto;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long userId,
        String clientName,
        Integer rating,
        String comment,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}