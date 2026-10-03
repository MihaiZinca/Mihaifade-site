package ro.mihaifade.backend.dto;

public record AssistantNotificationResponse(
        int selectedClients,
        int notifiedClients,
        int clientsWithoutMarketingConsent,
        int clientsWithoutNotifications,
        int sentNotifications
) {
}