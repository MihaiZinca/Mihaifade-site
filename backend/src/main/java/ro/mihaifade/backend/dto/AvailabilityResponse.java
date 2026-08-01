package ro.mihaifade.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record AvailabilityResponse(

        LocalDate date,
        Long barberId,
        Long serviceId,
        Integer durationMinutes,
        List<LocalTime> availableSlots

) {
}