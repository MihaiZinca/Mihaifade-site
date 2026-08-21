package ro.mihaifade.backend.service;

import org.springframework.security.access.AccessDeniedException;
import ro.mihaifade.backend.dto.AppointmentRequest;
import ro.mihaifade.backend.dto.AppointmentResponse;
import ro.mihaifade.backend.entity.*;
import ro.mihaifade.backend.repository.*;

import java.text.Normalizer;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;

@org.springframework.stereotype.Service
public class AppointmentService {

    private static final LocalTime COLORING_SLOT_TIME =
            LocalTime.of(
                    8,
                    0
            );

    private static final Set<String> COLORING_SERVICE_NAMES =
            Set.of(
                    "vopsit suvite",
                    "vopsit total",
                    "vopsit suvite+tuns",
                    "vopsit total+tuns",
                    "vopsit suvite+tuns+barba",
                    "vopsit total+tuns+barba"
            );

    private static final DateTimeFormatter APPOINTMENT_DATE_FORMATTER =
            DateTimeFormatter.ofPattern(
                    "dd.MM.yyyy"
            );

    private static final DateTimeFormatter APPOINTMENT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern(
                    "HH:mm"
            );

    private final AppointmentRepository appointmentRepository;
    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final BarberServiceOfferingRepository barberServiceOfferingRepository;
    private final PushNotificationService pushNotificationService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            BarberRepository barberRepository,
            ServiceRepository serviceRepository,
            UserRepository userRepository,
            BarberServiceOfferingRepository barberServiceOfferingRepository,
            PushNotificationService pushNotificationService
    ) {
        this.appointmentRepository =
                appointmentRepository;

        this.barberRepository =
                barberRepository;

        this.serviceRepository =
                serviceRepository;

        this.userRepository =
                userRepository;

        this.barberServiceOfferingRepository =
                barberServiceOfferingRepository;

        this.pushNotificationService =
                pushNotificationService;
    }

    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository
                .findAll()
                .stream()
                .map(
                        this::toResponse
                )
                .toList();
    }

    public List<AppointmentResponse> getMyAppointments(
            String email
    ) {
        User user =
                getUserByEmail(
                        email
                );

        return appointmentRepository
                .findByUserIdOrderByDateDescStartTimeDesc(
                        user.getId()
                )
                .stream()
                .map(
                        this::toResponse
                )
                .toList();
    }

    public List<AppointmentResponse> getMyBarberAppointments(
            String email
    ) {
        Barber barber =
                getBarberByEmail(
                        email
                );

        return appointmentRepository
                .findByBarberIdOrderByDateDescStartTimeDesc(
                        barber.getId()
                )
                .stream()
                .map(
                        this::toResponse
                )
                .toList();
    }

    public AppointmentResponse createAppointment(
            AppointmentRequest request,
            String email
    ) {
        User user =
                getUserByEmail(
                        email
                );

        Barber barber =
                barberRepository
                        .findById(
                                request.barberId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Barber not found with id: "
                                                + request.barberId()
                                )
                        );

        if (
                !Boolean.TRUE.equals(
                        barber.getActive()
                )
        ) {
            throw new RuntimeException(
                    "Barber is not active"
            );
        }

        ro.mihaifade.backend.entity.Service service =
                serviceRepository
                        .findById(
                                request.serviceId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service not found with id: "
                                                + request.serviceId()
                                )
                        );

        if (
                !Boolean.TRUE.equals(
                        service.getActive()
                )
        ) {
            throw new RuntimeException(
                    "Service is not active"
            );
        }

        boolean barberOffersService =
                barber.getServices()
                        .stream()
                        .anyMatch(barberService ->
                                barberService
                                        .getId()
                                        .equals(
                                                service.getId()
                                        )
                        );

        if (!barberOffersService) {
            throw new RuntimeException(
                    "Selected barber does not offer this service"
            );
        }

        BarberServiceOffering offering =
                barberServiceOfferingRepository
                        .findByBarberIdAndServiceId(
                                barber.getId(),
                                service.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Selected barber does not have pricing configured for this service"
                                )
                        );

        if (
                !Boolean.TRUE.equals(
                        offering.getActive()
                )
        ) {
            throw new RuntimeException(
                    "Selected service is not active for this barber"
            );
        }

        if (
                isColoringService(
                        service.getName()
                )
                        && !COLORING_SLOT_TIME.equals(
                        request.startTime()
                )
        ) {
            throw new RuntimeException(
                    "Coloring services can only be booked at 08:00"
            );
        }

        LocalTime endTime =
                request.startTime()
                        .plusMinutes(
                                offering.getDurationMinutes()
                        );

        List<Appointment> existingAppointments =
                appointmentRepository
                        .findByBarberIdAndDateAndStatusNot(
                                barber.getId(),
                                request.date(),
                                AppointmentStatus.CANCELLED
                        );

        boolean overlaps =
                existingAppointments
                        .stream()
                        .anyMatch(existing ->
                                request.startTime()
                                        .isBefore(
                                                existing.getEndTime()
                                        )
                                        &&
                                        endTime.isAfter(
                                                existing.getStartTime()
                                        )
                        );

        if (overlaps) {
            throw new RuntimeException(
                    "Selected time interval is already booked"
            );
        }

        Appointment appointment =
                new Appointment();

        appointment.setUser(
                user
        );

        appointment.setBarber(
                barber
        );

        appointment.setService(
                service
        );

        appointment.setServicePrice(
                offering.getPrice()
        );

        appointment.setDate(
                request.date()
        );

        appointment.setStartTime(
                request.startTime()
        );

        appointment.setEndTime(
                endTime
        );

        appointment.setStatus(
                AppointmentStatus.CONFIRMED
        );

        appointment.setNotes(
                request.notes()
        );

        Appointment savedAppointment =
                appointmentRepository
                        .save(
                                appointment
                        );

        sendAppointmentCreatedNotification(
                user,
                savedAppointment
        );

        return toResponse(
                savedAppointment
        );
    }

    public AppointmentResponse cancelMyAppointment(
            Long id,
            String email
    ) {
        User user =
                getUserByEmail(
                        email
                );

        Appointment appointment =
                getAppointmentById(
                        id
                );

        if (
                !appointment
                        .getUser()
                        .getId()
                        .equals(
                                user.getId()
                        )
        ) {
            throw new AccessDeniedException(
                    "You cannot cancel another user's appointment"
            );
        }

        if (
                appointment.getStatus()
                        == AppointmentStatus.COMPLETED
        ) {
            throw new RuntimeException(
                    "Completed appointment cannot be cancelled"
            );
        }

        if (
                appointment.getStatus()
                        == AppointmentStatus.CANCELLED
        ) {
            throw new RuntimeException(
                    "Appointment is already cancelled"
            );
        }

        appointment.setStatus(
                AppointmentStatus.CANCELLED
        );

        Appointment savedAppointment =
                appointmentRepository
                        .save(
                                appointment
                        );

        sendAppointmentCancelledNotification(
                savedAppointment
        );

        return toResponse(
                savedAppointment
        );
    }

    public AppointmentResponse updateStatus(
            Long id,
            AppointmentStatus status
    ) {
        Appointment appointment =
                getAppointmentById(
                        id
                );

        AppointmentStatus previousStatus =
                appointment.getStatus();

        appointment.setStatus(
                status
        );

        Appointment savedAppointment =
                appointmentRepository
                        .save(
                                appointment
                        );

        if (
                status == AppointmentStatus.CANCELLED
                        &&
                        previousStatus != AppointmentStatus.CANCELLED
        ) {
            sendAppointmentCancelledNotification(
                    savedAppointment
            );
        }

        return toResponse(
                savedAppointment
        );
    }

    public AppointmentResponse updateMyBarberAppointmentStatus(
            Long appointmentId,
            AppointmentStatus status,
            String email
    ) {
        Barber barber =
                getBarberByEmail(
                        email
                );

        Appointment appointment =
                getAppointmentById(
                        appointmentId
                );

        if (
                !appointment
                        .getBarber()
                        .getId()
                        .equals(
                                barber.getId()
                        )
        ) {
            throw new AccessDeniedException(
                    "You cannot modify another barber's appointment"
            );
        }

        AppointmentStatus previousStatus =
                appointment.getStatus();

        appointment.setStatus(
                status
        );

        Appointment savedAppointment =
                appointmentRepository
                        .save(
                                appointment
                        );

        if (
                status == AppointmentStatus.CANCELLED
                        &&
                        previousStatus != AppointmentStatus.CANCELLED
        ) {
            sendAppointmentCancelledNotification(
                    savedAppointment
            );
        }

        return toResponse(
                savedAppointment
        );
    }

    private Appointment getAppointmentById(
            Long id
    ) {
        return appointmentRepository
                .findById(
                        id
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Appointment not found with id: "
                                        + id
                        )
                );
    }

    private User getUserByEmail(
            String email
    ) {
        return userRepository
                .findByEmailIgnoreCase(
                        email
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with email: "
                                        + email
                        )
                );
    }

    private Barber getBarberByEmail(
            String email
    ) {
        return barberRepository
                .findByUserEmailIgnoreCase(
                        email
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "No barber profile is associated with user: "
                                        + email
                        )
                );
    }

    private void sendAppointmentCreatedNotification(
            User user,
            Appointment appointment
    ) {
        try {
            String formattedDate =
                    appointment
                            .getDate()
                            .format(
                                    APPOINTMENT_DATE_FORMATTER
                            );

            String formattedTime =
                    appointment
                            .getStartTime()
                            .format(
                                    APPOINTMENT_TIME_FORMATTER
                            );

            String body =
                    "Programarea pentru "
                            + appointment
                            .getService()
                            .getName()
                            + ", pe "
                            + formattedDate
                            + " la "
                            + formattedTime
                            + ", cu "
                            + appointment
                            .getBarber()
                            .getDisplayName()
                            + ", a fost confirmată.";

            pushNotificationService.sendToUser(
                    user.getEmail(),
                    "Programare confirmată",
                    body
            );
        } catch (Exception exception) {
            System.err.println(
                    "Could not send appointment confirmation notification for appointment "
                            + appointment.getId()
                            + ": "
                            + exception.getMessage()
            );
        }
    }

    private void sendAppointmentCancelledNotification(
            Appointment appointment
    ) {
        try {
            String formattedDate =
                    appointment
                            .getDate()
                            .format(
                                    APPOINTMENT_DATE_FORMATTER
                            );

            String formattedTime =
                    appointment
                            .getStartTime()
                            .format(
                                    APPOINTMENT_TIME_FORMATTER
                            );

            String body =
                    "Programarea pentru "
                            + appointment
                            .getService()
                            .getName()
                            + ", din "
                            + formattedDate
                            + " la "
                            + formattedTime
                            + ", cu "
                            + appointment
                            .getBarber()
                            .getDisplayName()
                            + ", a fost anulată.";

            pushNotificationService.sendToUser(
                    appointment
                            .getUser()
                            .getEmail(),
                    "Programare anulată",
                    body
            );
        } catch (Exception exception) {
            System.err.println(
                    "Could not send appointment cancellation notification for appointment "
                            + appointment.getId()
                            + ": "
                            + exception.getMessage()
            );
        }
    }

    private boolean isColoringService(
            String serviceName
    ) {
        if (
                serviceName == null
                        || serviceName.isBlank()
        ) {
            return false;
        }

        String normalizedName =
                Normalizer
                        .normalize(
                                serviceName,
                                Normalizer.Form.NFD
                        )
                        .replaceAll(
                                "\\p{M}",
                                ""
                        )
                        .toLowerCase()
                        .trim()
                        .replaceAll(
                                "\\s*\\+\\s*",
                                "+"
                        )
                        .replaceAll(
                                "\\s+",
                                " "
                        );

        return COLORING_SERVICE_NAMES
                .contains(
                        normalizedName
                );
    }

    private AppointmentResponse toResponse(
            Appointment appointment
    ) {
        String clientName =
                appointment
                        .getUser()
                        .getFirstName()
                        + " "
                        + appointment
                        .getUser()
                        .getLastName();

        return new AppointmentResponse(
                appointment.getId(),
                appointment.getUser().getId(),
                clientName,
                appointment.getUser().getPhone(),
                appointment.getBarber().getId(),
                appointment.getBarber().getDisplayName(),
                appointment.getService().getId(),
                appointment.getService().getName(),
                appointment.getServicePrice(),
                appointment.getDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus(),
                appointment.getNotes()
        );
    }
}