package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.BarberStatsResponse;
import ro.mihaifade.backend.entity.Appointment;
import ro.mihaifade.backend.entity.AppointmentStatus;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.repository.AppointmentRepository;
import ro.mihaifade.backend.repository.BarberRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class BarberStatsService {

    private final BarberRepository barberRepository;
    private final AppointmentRepository appointmentRepository;

    public BarberStatsService(
            BarberRepository barberRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.barberRepository = barberRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public BarberStatsResponse getMyStats(
            String email
    ) {
        Barber barber =
                barberRepository
                        .findByUserEmailIgnoreCase(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "No barber profile is associated with user: "
                                                + email
                                )
                        );

        return buildStats(barber);
    }

    public BarberStatsResponse getStatsForBarber(
            Long barberId
    ) {
        Barber barber =
                barberRepository
                        .findById(barberId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Barber not found with id: "
                                                + barberId
                                )
                        );

        return buildStats(barber);
    }

    private BarberStatsResponse buildStats(
            Barber barber
    ) {
        List<Appointment> appointments =
                appointmentRepository
                        .findByBarberIdOrderByDateDescStartTimeDesc(
                                barber.getId()
                        );

        LocalDate today =
                LocalDate.now();

        LocalDate firstDayOfMonth =
                today.withDayOfMonth(1);

        long appointmentsToday =
                appointments.stream()
                        .filter(appointment ->
                                appointment
                                        .getDate()
                                        .equals(today)
                        )
                        .filter(appointment ->
                                appointment.getStatus()
                                        != AppointmentStatus.CANCELLED
                        )
                        .count();

        long upcomingAppointments =
                appointments.stream()
                        .filter(appointment ->
                                appointment
                                        .getDate()
                                        .isAfter(today)
                                        ||
                                        appointment
                                                .getDate()
                                                .equals(today)
                        )
                        .filter(appointment ->
                                appointment.getStatus()
                                        == AppointmentStatus.CONFIRMED
                                        ||
                                        appointment.getStatus()
                                                == AppointmentStatus.PENDING
                        )
                        .count();

        long completedAppointments =
                appointments.stream()
                        .filter(appointment ->
                                appointment.getStatus()
                                        == AppointmentStatus.COMPLETED
                        )
                        .count();

        long cancelledAppointments =
                appointments.stream()
                        .filter(appointment ->
                                appointment.getStatus()
                                        == AppointmentStatus.CANCELLED
                        )
                        .count();

        long noShowAppointments =
                appointments.stream()
                        .filter(appointment ->
                                appointment.getStatus()
                                        == AppointmentStatus.NO_SHOW
                        )
                        .count();

        Set<String> uniqueClients =
                new HashSet<>();

        appointments.stream()
                .filter(appointment ->
                        appointment.getStatus()
                                == AppointmentStatus.COMPLETED
                )
                .forEach(appointment -> {
                    if (appointment.getUser() != null) {
                        uniqueClients.add(
                                "user:"
                                        + appointment
                                        .getUser()
                                        .getId()
                        );
                        return;
                    }

                    String guestPhone =
                            appointment.getGuestPhone();

                    if (
                            guestPhone != null
                                    && !guestPhone.isBlank()
                    ) {
                        uniqueClients.add(
                                "guest:"
                                        + guestPhone
                                        .replaceAll(
                                                "\\s+",
                                                ""
                                        )
                                        .trim()
                        );
                        return;
                    }

                    uniqueClients.add(
                            "appointment:"
                                    + appointment.getId()
                    );
                });

        BigDecimal revenueToday =
                appointments.stream()
                        .filter(appointment ->
                                appointment.getStatus()
                                        == AppointmentStatus.COMPLETED
                        )
                        .filter(appointment ->
                                appointment
                                        .getDate()
                                        .equals(today)
                        )
                        .map(Appointment::getServicePrice)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        BigDecimal revenueThisMonth =
                appointments.stream()
                        .filter(appointment ->
                                appointment.getStatus()
                                        == AppointmentStatus.COMPLETED
                        )
                        .filter(appointment ->
                                !appointment
                                        .getDate()
                                        .isBefore(firstDayOfMonth)
                                        &&
                                        !appointment
                                                .getDate()
                                                .isAfter(today)
                        )
                        .map(Appointment::getServicePrice)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        BigDecimal totalRevenue =
                appointments.stream()
                        .filter(appointment ->
                                appointment.getStatus()
                                        == AppointmentStatus.COMPLETED
                        )
                        .map(Appointment::getServicePrice)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        return new BarberStatsResponse(
                barber.getId(),
                barber.getDisplayName(),
                appointmentsToday,
                upcomingAppointments,
                completedAppointments,
                cancelledAppointments,
                noShowAppointments,
                uniqueClients.size(),
                revenueToday,
                revenueThisMonth,
                totalRevenue
        );
    }
}