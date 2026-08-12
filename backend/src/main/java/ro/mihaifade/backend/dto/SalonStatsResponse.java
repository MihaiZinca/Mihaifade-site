package ro.mihaifade.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record SalonStatsResponse(

        long appointmentsToday,

        long upcomingAppointments,

        long completedAppointments,

        long cancelledAppointments,

        long noShowAppointments,

        long uniqueClients,

        BigDecimal revenueToday,

        BigDecimal revenueThisMonth,

        BigDecimal totalRevenue,

        List<BarberStatsResponse> barbers

) {
}