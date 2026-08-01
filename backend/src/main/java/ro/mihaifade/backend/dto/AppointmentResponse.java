package ro.mihaifade.backend.dto;

import ro.mihaifade.backend.entity.AppointmentStatus;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentResponse(

        Long id,
        Long barberId,
        String barberName,
        Long serviceId,
        String serviceName,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        AppointmentStatus status,
        String clientName,
        String clientPhone,
        String notes

) {
}