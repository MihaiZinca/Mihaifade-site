package ro.mihaifade.backend.service;

import org.springframework.security.access.AccessDeniedException;
import ro.mihaifade.backend.dto.AppointmentRequest;
import ro.mihaifade.backend.dto.AppointmentRescheduleRequest;
import ro.mihaifade.backend.dto.AppointmentResponse;
import ro.mihaifade.backend.entity.*;
import ro.mihaifade.backend.repository.*;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
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
    private final WorkingHoursRepository workingHoursRepository;
    private final TimeOffRepository timeOffRepository;
    private final PushNotificationService pushNotificationService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            BarberRepository barberRepository,
            ServiceRepository serviceRepository,
            UserRepository userRepository,
            BarberServiceOfferingRepository barberServiceOfferingRepository,
            WorkingHoursRepository workingHoursRepository,
            TimeOffRepository timeOffRepository,
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

        this.workingHoursRepository =
                workingHoursRepository;

        this.timeOffRepository =
                timeOffRepository;

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
        User authenticatedUser =
                getUserByEmail(
                        email
                );

        String role =
                authenticatedUser
                        .getRole()
                        .name();

        boolean staffBooking =
                "BARBER".equals(role)
                        || "OWNER".equals(role);

        if (
                !"CLIENT".equals(role)
                        && !staffBooking
        ) {
            throw new AccessDeniedException(
                    "This account cannot create appointments"
            );
        }

        String guestName = null;
        String guestPhone = null;

        if (staffBooking) {
            guestName =
                    normalizeGuestField(
                            request.guestName()
                    );

            guestPhone =
                    normalizeGuestField(
                            request.guestPhone()
                    );

            if (guestName == null) {
                throw new RuntimeException(
                        "Guest name is required"
                );
            }

            if (guestPhone == null) {
                throw new RuntimeException(
                        "Guest phone is required"
                );
            }
        }

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

        LocalDateTime requestedStartDateTime =
                LocalDateTime.of(
                        request.date(),
                        request.startTime()
                );

        if (
                !requestedStartDateTime.isAfter(
                        LocalDateTime.now()
                )
        ) {
            throw new RuntimeException(
                    "Cannot create an appointment in the past"
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
                staffBooking
                        ? null
                        : authenticatedUser
        );

        appointment.setGuestName(
                staffBooking
                        ? guestName
                        : null
        );

        appointment.setGuestPhone(
                staffBooking
                        ? guestPhone
                        : null
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

        if (!staffBooking) {
            sendAppointmentCreatedNotification(
                    authenticatedUser,
                    savedAppointment
            );
        }

        return toResponse(
                savedAppointment
        );
    }

    public AppointmentResponse rescheduleMyAppointment(
            Long id,
            AppointmentRescheduleRequest request,
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
                appointment.getUser() == null
                        || !appointment
                        .getUser()
                        .getId()
                        .equals(
                                user.getId()
                        )
        ) {
            throw new AccessDeniedException(
                    "You cannot reschedule another user's appointment"
            );
        }

        if (
                appointment.getStatus()
                        == AppointmentStatus.COMPLETED
        ) {
            throw new RuntimeException(
                    "Completed appointment cannot be rescheduled"
            );
        }

        if (
                appointment.getStatus()
                        == AppointmentStatus.CANCELLED
        ) {
            throw new RuntimeException(
                    "Cancelled appointment cannot be rescheduled"
            );
        }

        LocalDateTime requestedStartDateTime =
                LocalDateTime.of(
                        request.date(),
                        request.startTime()
                );

        if (
                !requestedStartDateTime.isAfter(
                        LocalDateTime.now()
                )
        ) {
            throw new RuntimeException(
                    "Cannot reschedule an appointment in the past"
            );
        }

        Barber barber =
                appointment.getBarber();

        ro.mihaifade.backend.entity.Service service =
                appointment.getService();

        if (
                !Boolean.TRUE.equals(
                        barber.getActive()
                )
        ) {
            throw new RuntimeException(
                    "Barber is not active"
            );
        }

        if (
                !Boolean.TRUE.equals(
                        service.getActive()
                )
        ) {
            throw new RuntimeException(
                    "Service is not active"
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

        Optional<WorkingHours> workingHoursOptional =
                workingHoursRepository
                        .findByBarberIdAndDayOfWeek(
                                barber.getId(),
                                request.date().getDayOfWeek()
                        );

        if (
                workingHoursOptional.isEmpty()
                        || !Boolean.TRUE.equals(
                        workingHoursOptional
                                .get()
                                .getActive()
                )
        ) {
            throw new RuntimeException(
                    "Barber is not working on the selected day"
            );
        }

        WorkingHours workingHours =
                workingHoursOptional.get();

        if (
                request.startTime()
                        .isBefore(
                                workingHours.getStartTime()
                        )
                        ||
                        endTime.isAfter(
                                workingHours.getEndTime()
                        )
        ) {
            throw new RuntimeException(
                    "Selected time is outside the barber's working hours"
            );
        }

        Optional<TimeOff> timeOffOptional =
                timeOffRepository
                        .findByBarberIdAndDate(
                                barber.getId(),
                                request.date()
                        );

        if (
                timeOffOptional.isPresent()
                        && Boolean.TRUE.equals(
                        timeOffOptional
                                .get()
                                .getFullDay()
                )
        ) {
            throw new RuntimeException(
                    "Barber is unavailable on the selected day"
            );
        }

        if (
                timeOffOptional.isPresent()
        ) {
            TimeOff timeOff =
                    timeOffOptional.get();

            if (
                    timeOff.getStartTime() != null
                            && timeOff.getEndTime() != null
            ) {
                boolean overlapsTimeOff =
                        request.startTime()
                                .isBefore(
                                        timeOff.getEndTime()
                                )
                                &&
                                endTime.isAfter(
                                        timeOff.getStartTime()
                                );

                if (overlapsTimeOff) {
                    throw new RuntimeException(
                            "Selected time overlaps with the barber's time off"
                    );
                }
            }
        }

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
                        .filter(existing ->
                                !existing
                                        .getId()
                                        .equals(
                                                appointment.getId()
                                        )
                        )
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

        appointment.setDate(
                request.date()
        );

        appointment.setStartTime(
                request.startTime()
        );

        appointment.setEndTime(
                endTime
        );

        appointment.setReminder24hSent(
                false
        );

        appointment.setReminder2hSent(
                false
        );

        Appointment savedAppointment =
                appointmentRepository
                        .save(
                                appointment
                        );

        sendAppointmentRescheduledNotification(
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
                appointment.getUser() == null
                        || !appointment
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

    private void sendAppointmentRescheduledNotification(
            Appointment appointment
    ) {
        if (appointment.getUser() == null) {
            return;
        }

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
                            + " a fost mutată pe "
                            + formattedDate
                            + " la "
                            + formattedTime
                            + ", cu "
                            + appointment
                            .getBarber()
                            .getDisplayName()
                            + ".";

            pushNotificationService.sendToUser(
                    appointment
                            .getUser()
                            .getEmail(),
                    "Programare modificată",
                    body
            );
        } catch (Exception exception) {
            System.err.println(
                    "Could not send appointment reschedule notification for appointment "
                            + appointment.getId()
                            + ": "
                            + exception.getMessage()
            );
        }
    }

    private void sendAppointmentCancelledNotification(
            Appointment appointment
    ) {
        if (appointment.getUser() == null) {
            return;
        }

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

    private String normalizeGuestField(
            String value
    ) {
        if (
                value == null
                        || value.isBlank()
        ) {
            return null;
        }

        return value.trim();
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
        User user =
                appointment.getUser();

        String clientName =
                user != null
                        ? user.getFirstName()
                        + " "
                        + user.getLastName()
                        : appointment.getGuestName();

        String clientPhone =
                user != null
                        ? user.getPhone()
                        : appointment.getGuestPhone();

        return new AppointmentResponse(
                appointment.getId(),
                user != null
                        ? user.getId()
                        : null,
                clientName,
                clientPhone,
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