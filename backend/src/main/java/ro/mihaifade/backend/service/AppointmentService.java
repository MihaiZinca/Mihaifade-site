package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.AppointmentRequest;
import ro.mihaifade.backend.dto.AppointmentResponse;
import ro.mihaifade.backend.entity.Appointment;
import ro.mihaifade.backend.entity.AppointmentStatus;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.repository.AppointmentRepository;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.ServiceRepository;

import java.time.LocalTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            BarberRepository barberRepository,
            ServiceRepository serviceRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.barberRepository = barberRepository;
        this.serviceRepository = serviceRepository;
    }

    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AppointmentResponse createAppointment(
            AppointmentRequest request
    ) {
        Barber barber = barberRepository.findById(request.barberId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Barber not found with id: " + request.barberId()
                        )
                );

        ro.mihaifade.backend.entity.Service service =
                serviceRepository.findById(request.serviceId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service not found with id: " + request.serviceId()
                                )
                        );

        LocalTime endTime = request.startTime()
                .plusMinutes(service.getDurationMinutes());

        List<Appointment> existingAppointments =
                appointmentRepository.findByBarberIdAndDateAndStatusNot(
                        barber.getId(),
                        request.date(),
                        AppointmentStatus.CANCELLED
                );

        boolean overlaps = existingAppointments.stream()
                .anyMatch(existing ->
                        request.startTime().isBefore(existing.getEndTime())
                                && endTime.isAfter(existing.getStartTime())
                );

        if (overlaps) {
            throw new RuntimeException(
                    "Selected time interval is already booked"
            );
        }

        Appointment appointment = new Appointment();

        appointment.setBarber(barber);
        appointment.setService(service);
        appointment.setDate(request.date());
        appointment.setStartTime(request.startTime());
        appointment.setEndTime(endTime);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setClientName(request.clientName());
        appointment.setClientPhone(request.clientPhone());
        appointment.setNotes(request.notes());

        Appointment saved = appointmentRepository.save(appointment);

        return toResponse(saved);
    }

    public AppointmentResponse updateStatus(
            Long id,
            AppointmentStatus status
    ) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Appointment not found with id: " + id
                        )
                );

        appointment.setStatus(status);

        return toResponse(
                appointmentRepository.save(appointment)
        );
    }

    private AppointmentResponse toResponse(
            Appointment appointment
    ) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getBarber().getId(),
                appointment.getBarber().getDisplayName(),
                appointment.getService().getId(),
                appointment.getService().getName(),
                appointment.getDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus(),
                appointment.getClientName(),
                appointment.getClientPhone(),
                appointment.getNotes()
        );
    }
}