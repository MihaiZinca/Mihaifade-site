package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentRequest(
        @NotNull Long barberId,
        @NotNull Long serviceId,
        @NotNull LocalDate date,
        @NotNull LocalTime startTime,
        String notes,
        String guestName,
        String guestPhone
) {
}