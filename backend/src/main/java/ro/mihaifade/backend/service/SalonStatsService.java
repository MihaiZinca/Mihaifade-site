package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.BarberStatsResponse;
import ro.mihaifade.backend.dto.SalonStatsResponse;
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
public class SalonStatsService {

    private final AppointmentRepository appointmentRepository;
    private final BarberRepository barberRepository;
    private final BarberStatsService barberStatsService;

    public SalonStatsService(
            AppointmentRepository appointmentRepository,
            BarberRepository barberRepository,
            BarberStatsService barberStatsService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.barberRepository = barberRepository;
        this.barberStatsService = barberStatsService;
    }

    public SalonStatsResponse getSalonStats() {

        List<Appointment> appointments =
                appointmentRepository.findAll();

        LocalDate today =
                LocalDate.now();

        LocalDate firstDayOfMonth =
                today.withDayOfMonth(1);

        long appointmentsToday =
                appointments.stream()
                        .filter(appointment ->
                                appointment.getDate().equals(today)
                        )
                        .filter(appointment ->
                                appointment.getStatus()
                                        != AppointmentStatus.CANCELLED
                        )
                        .count();

        long upcomingAppointments =
                appointments.stream()
                        .filter(appointment ->
                                !appointment
                                        .getDate()
                                        .isBefore(today)
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

        Set<Long> uniqueClientIds =
                new HashSet<>();

        appointments.stream()
                .filter(appointment ->
                        appointment.getStatus()
                                == AppointmentStatus.COMPLETED
                )
                .forEach(appointment ->
                        uniqueClientIds.add(
                                appointment
                                        .getUser()
                                        .getId()
                        )
                );

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

        List<BarberStatsResponse> barberStats =
                barberRepository.findAll()
                        .stream()
                        .filter(barber ->
                                Boolean.TRUE.equals(
                                        barber.getActive()
                                )
                        )
                        .map(Barber::getId)
                        .map(
                                barberStatsService::getStatsForBarber
                        )
                        .toList();

        return new SalonStatsResponse(
                appointmentsToday,
                upcomingAppointments,
                completedAppointments,
                cancelledAppointments,
                noShowAppointments,
                uniqueClientIds.size(),
                revenueToday,
                revenueThisMonth,
                totalRevenue,
                barberStats
        );
    }
}