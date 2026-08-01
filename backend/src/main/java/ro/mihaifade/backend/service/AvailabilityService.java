package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.AvailabilityResponse;
import ro.mihaifade.backend.entity.Appointment;
import ro.mihaifade.backend.entity.AppointmentStatus;
import ro.mihaifade.backend.entity.TimeOff;
import ro.mihaifade.backend.entity.WorkingHours;
import ro.mihaifade.backend.repository.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AvailabilityService {

    private static final int SLOT_INTERVAL_MINUTES = 30;

    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final TimeOffRepository timeOffRepository;
    private final AppointmentRepository appointmentRepository;

    public AvailabilityService(
            BarberRepository barberRepository,
            ServiceRepository serviceRepository,
            WorkingHoursRepository workingHoursRepository,
            TimeOffRepository timeOffRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.barberRepository = barberRepository;
        this.serviceRepository = serviceRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.timeOffRepository = timeOffRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public AvailabilityResponse getAvailability(
            Long barberId,
            Long serviceId,
            LocalDate date
    ) {
        if (!barberRepository.existsById(barberId)) {
            throw new RuntimeException(
                    "Barber not found with id: " + barberId
            );
        }

        ro.mihaifade.backend.entity.Service service =
                serviceRepository.findById(serviceId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service not found with id: " + serviceId
                                )
                        );

        Optional<WorkingHours> workingHoursOptional =
                workingHoursRepository.findByBarberIdAndDayOfWeek(
                        barberId,
                        date.getDayOfWeek()
                );

        if (workingHoursOptional.isEmpty()
                || !workingHoursOptional.get().getActive()) {
            return new AvailabilityResponse(
                    date,
                    barberId,
                    serviceId,
                    service.getDurationMinutes(),
                    List.of()
            );
        }

        WorkingHours workingHours =
                workingHoursOptional.get();

        Optional<TimeOff> timeOffOptional =
                timeOffRepository.findByBarberIdAndDate(
                        barberId,
                        date
                );

        if (timeOffOptional.isPresent()
                && timeOffOptional.get().getFullDay()) {
            return new AvailabilityResponse(
                    date,
                    barberId,
                    serviceId,
                    service.getDurationMinutes(),
                    List.of()
            );
        }

        List<Appointment> appointments =
                appointmentRepository.findByBarberIdAndDateAndStatusNot(
                        barberId,
                        date,
                        AppointmentStatus.CANCELLED
                );

        List<LocalTime> availableSlots =
                new ArrayList<>();

        LocalTime current =
                workingHours.getStartTime();

        while (!current
                .plusMinutes(service.getDurationMinutes())
                .isAfter(workingHours.getEndTime())) {

            LocalTime slotStart = current;

            LocalTime slotEnd =
                    slotStart.plusMinutes(
                            service.getDurationMinutes()
                    );

            boolean overlapsAppointment =
                    appointments.stream()
                            .anyMatch(appointment ->
                                    slotStart.isBefore(
                                            appointment.getEndTime()
                                    )
                                            && slotEnd.isAfter(
                                            appointment.getStartTime()
                                    )
                            );

            boolean overlapsTimeOff = false;

            if (timeOffOptional.isPresent()
                    && !timeOffOptional.get().getFullDay()) {

                TimeOff timeOff =
                        timeOffOptional.get();

                overlapsTimeOff =
                        slotStart.isBefore(
                                timeOff.getEndTime()
                        )
                                && slotEnd.isAfter(
                                timeOff.getStartTime()
                        );
            }

            if (!overlapsAppointment
                    && !overlapsTimeOff) {
                availableSlots.add(slotStart);
            }

            current = current.plusMinutes(
                    SLOT_INTERVAL_MINUTES
            );
        }

        return new AvailabilityResponse(
                date,
                barberId,
                serviceId,
                service.getDurationMinutes(),
                availableSlots
        );
    }
}