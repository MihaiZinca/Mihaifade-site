package ro.mihaifade.backend.dto;

import java.time.LocalDateTime;

public record GalleryImageResponse(
        Long id,
        String imageUrl,
        Integer displayOrder,
        boolean active,
        LocalDateTime createdAt
) {
}