package ro.mihaifade.backend.dto;

import java.time.LocalDateTime;

public record ClientOfferResponse(
        Long id,
        Integer discountPercent,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        Boolean used,
        LocalDateTime usedAt
) {
}