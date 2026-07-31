package ro.mihaifade.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record TimeOffResponse(

        Long id,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        Boolean fullDay,
        String reason

) {
}