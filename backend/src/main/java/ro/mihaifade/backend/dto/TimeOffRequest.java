package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record TimeOffRequest(

        @NotNull
        LocalDate date,

        LocalTime startTime,

        LocalTime endTime,

        @NotNull
        Boolean fullDay,

        String reason

) {
}