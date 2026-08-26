package ro.mihaifade.backend.dto;

public record AssistantNotificationResponse(
        int selectedClients,
        int notifiedClients,
        int clientsWithoutNotifications,
        int sentNotifications
) {
}