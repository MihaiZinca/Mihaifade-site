package ro.mihaifade.backend.dto;

import ro.mihaifade.backend.entity.AppointmentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentResponse(
        Long id,
        Long userId,
        String clientName,
        String clientPhone,
        Long barberId,
        String barberName,
        Long serviceId,
        String serviceName,
        BigDecimal servicePrice,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        AppointmentStatus status,
        String notes
) {
}