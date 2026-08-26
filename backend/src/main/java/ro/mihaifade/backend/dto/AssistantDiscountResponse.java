package ro.mihaifade.backend.dto;

import java.time.LocalDateTime;

public record AssistantDiscountResponse(
        int selectedClients,
        int offersCreated,
        int discountPercent,
        LocalDateTime expiresAt
) {
}