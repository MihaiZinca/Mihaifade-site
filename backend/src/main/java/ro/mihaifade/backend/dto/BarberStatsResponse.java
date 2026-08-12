package ro.mihaifade.backend.dto;

import java.math.BigDecimal;

public record BarberStatsResponse(
        Long barberId,
        String barberName,
        long appointmentsToday,
        long upcomingAppointments,
        long completedAppointments,
        long cancelledAppointments,
        long noShowAppointments,
        long uniqueClients,
        BigDecimal revenueToday,
        BigDecimal revenueThisMonth,
        BigDecimal totalRevenue
) {
}