package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentRequest(

        @NotNull
        Long barberId,

        @NotNull
        Long serviceId,

        @NotNull
        LocalDate date,

        @NotNull
        LocalTime startTime,

        @NotBlank
        String clientName,

        @NotBlank
        String clientPhone,

        String notes

) {
}