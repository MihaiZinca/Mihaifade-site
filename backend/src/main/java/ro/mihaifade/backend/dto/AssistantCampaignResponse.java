package ro.mihaifade.backend.dto;

import ro.mihaifade.backend.entity.AssistantCampaignType;

import java.time.LocalDateTime;

public record AssistantCampaignResponse(
        Long id,
        AssistantCampaignType type,
        String title,
        String message,
        Integer selectedClients,
        Integer notifiedClients,
        Integer sentNotifications,
        Integer createdOffers,
        Integer discountPercent,
        Integer validDays,
        LocalDateTime createdAt
) {
}