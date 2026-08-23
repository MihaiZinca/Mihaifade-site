package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentRescheduleRequest(

        @NotNull
        LocalDate date,

        @NotNull
        LocalTime startTime

) {
}