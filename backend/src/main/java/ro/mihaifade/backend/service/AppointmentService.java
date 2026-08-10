package ro.mihaifade.backend.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.AppointmentRequest;
import ro.mihaifade.backend.dto.AppointmentResponse;
import ro.mihaifade.backend.entity.Appointment;
import ro.mihaifade.backend.entity.AppointmentStatus;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.AppointmentRepository;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.ServiceRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.time.LocalTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            BarberRepository barberRepository,
            ServiceRepository serviceRepository,
            UserRepository userRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.barberRepository = barberRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
    }

    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getMyAppointments(String email) {
        User user = getUserByEmail(email);

        return appointmentRepository.findByUserIdOrderByDateDescStartTimeDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AppointmentResponse createAppointment(
            AppointmentRequest request,
            String email
    ) {
        User user = getUserByEmail(email);

        Barber barber = barberRepository.findById(request.barberId())
                .orElseThrow(() -> new RuntimeException(
                        "Barber not found with id: " + request.barberId()
                ));

        ro.mihaifade.backend.entity.Service service = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new RuntimeException(
                        "Service not found with id: " + request.serviceId()
                ));

        LocalTime endTime = request.startTime()
                .plusMinutes(service.getDurationMinutes());

        List<Appointment> existingAppointments = appointmentRepository.findByBarberIdAndDateAndStatusNot(
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
            throw new RuntimeException("Selected time interval is already booked");
        }

        Appointment appointment = new Appointment();

        appointment.setUser(user);
        appointment.setBarber(barber);
        appointment.setService(service);
        appointment.setDate(request.date());
        appointment.setStartTime(request.startTime());
        appointment.setEndTime(endTime);
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setNotes(request.notes());

        return toResponse(appointmentRepository.save(appointment));
    }

    public AppointmentResponse cancelMyAppointment(
            Long id,
            String email
    ) {
        User user = getUserByEmail(email);

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Appointment not found with id: " + id
                ));

        if (!appointment.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "You cannot cancel another user's appointment"
            );
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new RuntimeException(
                    "Completed appointment cannot be cancelled"
            );
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException(
                    "Appointment is already cancelled"
            );
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);

        return toResponse(appointmentRepository.save(appointment));
    }

    public AppointmentResponse updateStatus(
            Long id,
            AppointmentStatus status
    ) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Appointment not found with id: " + id
                ));

        appointment.setStatus(status);

        return toResponse(appointmentRepository.save(appointment));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException(
                        "User not found with email: " + email
                ));
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        String clientName = appointment.getUser().getFirstName()
                + " "
                + appointment.getUser().getLastName();

        return new AppointmentResponse(
                appointment.getId(),
                appointment.getUser().getId(),
                clientName,
                appointment.getUser().getPhone(),
                appointment.getBarber().getId(),
                appointment.getBarber().getDisplayName(),
                appointment.getService().getId(),
                appointment.getService().getName(),
                appointment.getDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus(),
                appointment.getNotes()
        );
    }
}