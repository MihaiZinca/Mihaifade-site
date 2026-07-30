package ro.mihaifade.backend.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record WorkingHoursResponse(

        Long id,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        Boolean active

) {
}