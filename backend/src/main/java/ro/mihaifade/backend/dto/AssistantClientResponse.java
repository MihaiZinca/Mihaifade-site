package ro.mihaifade.backend.dto;

import java.time.LocalDate;

public record AssistantClientResponse(
        Long userId,
        String firstName,
        String lastName,
        String email,
        String phone,
        LocalDate lastVisitDate,
        long completedAppointments
) {
}