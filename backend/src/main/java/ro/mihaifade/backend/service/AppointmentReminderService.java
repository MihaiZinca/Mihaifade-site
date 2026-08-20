package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.entity.Appointment;
import ro.mihaifade.backend.entity.AppointmentStatus;
import ro.mihaifade.backend.repository.AppointmentRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AppointmentReminderService {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern(
                    "dd.MM.yyyy"
            );

    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern(
                    "HH:mm"
            );

    private static final long REMINDER_CATCH_UP_MINUTES =
            30;

    private final AppointmentRepository appointmentRepository;
    private final PushNotificationService pushNotificationService;

    public AppointmentReminderService(
            AppointmentRepository appointmentRepository,
            PushNotificationService pushNotificationService
    ) {
        this.appointmentRepository =
                appointmentRepository;

        this.pushNotificationService =
                pushNotificationService;
    }

    @Transactional
    public void send24HourReminders() {
        LocalDateTime now =
                LocalDateTime.now()
                        .truncatedTo(
                                ChronoUnit.MINUTES
                        );

        LocalDateTime reminderWindowEnd =
                now.plusHours(24);

        LocalDateTime reminderWindowStart =
                reminderWindowEnd
                        .minusMinutes(
                                REMINDER_CATCH_UP_MINUTES
                        );

        LocalDate startDate =
                reminderWindowStart
                        .toLocalDate();

        LocalDate endDate =
                reminderWindowEnd
                        .toLocalDate();

        List<Appointment> appointments =
                appointmentRepository
                        .findByDateBetweenAndReminder24hSentFalseAndStatusNot(
                                startDate,
                                endDate,
                                AppointmentStatus.CANCELLED
                        );

        for (
                Appointment appointment
                : appointments
        ) {
            LocalDateTime appointmentDateTime =
                    LocalDateTime.of(
                            appointment.getDate(),
                            appointment.getStartTime()
                    );

            boolean isInsideReminderWindow =
                    !appointmentDateTime.isBefore(
                            reminderWindowStart
                    )
                            &&
                            !appointmentDateTime.isAfter(
                                    reminderWindowEnd
                            );

            if (!isInsideReminderWindow) {
                continue;
            }

            send24HourReminder(
                    appointment
            );
        }
    }

    @Transactional
    public void send2HourReminders() {
        LocalDateTime now =
                LocalDateTime.now()
                        .truncatedTo(
                                ChronoUnit.MINUTES
                        );

        LocalDateTime reminderWindowEnd =
                now.plusHours(2);

        LocalDateTime reminderWindowStart =
                reminderWindowEnd
                        .minusMinutes(
                                REMINDER_CATCH_UP_MINUTES
                        );

        LocalDate startDate =
                reminderWindowStart
                        .toLocalDate();

        LocalDate endDate =
                reminderWindowEnd
                        .toLocalDate();

        List<Appointment> appointments =
                appointmentRepository
                        .findByDateBetweenAndReminder2hSentFalseAndStatusNot(
                                startDate,
                                endDate,
                                AppointmentStatus.CANCELLED
                        );

        for (
                Appointment appointment
                : appointments
        ) {
            LocalDateTime appointmentDateTime =
                    LocalDateTime.of(
                            appointment.getDate(),
                            appointment.getStartTime()
                    );

            boolean isInsideReminderWindow =
                    !appointmentDateTime.isBefore(
                            reminderWindowStart
                    )
                            &&
                            !appointmentDateTime.isAfter(
                                    reminderWindowEnd
                            );

            if (!isInsideReminderWindow) {
                continue;
            }

            send2HourReminder(
                    appointment
            );
        }
    }

    private void send24HourReminder(
            Appointment appointment
    ) {
        try {
            String formattedDate =
                    appointment
                            .getDate()
                            .format(
                                    DATE_FORMATTER
                            );

            String formattedTime =
                    appointment
                            .getStartTime()
                            .format(
                                    TIME_FORMATTER
                            );

            String body =
                    "Îți reamintim că ai o programare mâine, "
                            + formattedDate
                            + ", la "
                            + formattedTime
                            + ", pentru "
                            + appointment
                            .getService()
                            .getName()
                            + ", cu "
                            + appointment
                            .getBarber()
                            .getDisplayName()
                            + ".";

            int sentCount =
                    pushNotificationService
                            .sendToUser(
                                    appointment
                                            .getUser()
                                            .getEmail(),
                                    "Programare mâine",
                                    body
                            );

            if (sentCount > 0) {
                appointment.setReminder24hSent(
                        true
                );

                appointmentRepository.save(
                        appointment
                );

                System.out.println(
                        "[REMINDER 24H] Sent for appointment "
                                + appointment.getId()
                );
            } else {
                System.out.println(
                        "[REMINDER 24H] No push subscription for appointment "
                                + appointment.getId()
                );
            }
        } catch (Exception exception) {
            System.err.println(
                    "[REMINDER 24H] Failed for appointment "
                            + appointment.getId()
                            + ": "
                            + exception.getMessage()
            );
        }
    }

    private void send2HourReminder(
            Appointment appointment
    ) {
        try {
            String formattedDate =
                    appointment
                            .getDate()
                            .format(
                                    DATE_FORMATTER
                            );

            String formattedTime =
                    appointment
                            .getStartTime()
                            .format(
                                    TIME_FORMATTER
                            );

            String body =
                    "Programarea ta este în aproximativ 2 ore, "
                            + formattedDate
                            + ", la "
                            + formattedTime
                            + ", pentru "
                            + appointment
                            .getService()
                            .getName()
                            + ", cu "
                            + appointment
                            .getBarber()
                            .getDisplayName()
                            + ".";

            int sentCount =
                    pushNotificationService
                            .sendToUser(
                                    appointment
                                            .getUser()
                                            .getEmail(),
                                    "Programare în 2 ore",
                                    body
                            );

            if (sentCount > 0) {
                appointment.setReminder2hSent(
                        true
                );

                appointmentRepository.save(
                        appointment
                );

                System.out.println(
                        "[REMINDER 2H] Sent for appointment "
                                + appointment.getId()
                );
            } else {
                System.out.println(
                        "[REMINDER 2H] No push subscription for appointment "
                                + appointment.getId()
                );
            }
        } catch (Exception exception) {
            System.err.println(
                    "[REMINDER 2H] Failed for appointment "
                            + appointment.getId()
                            + ": "
                            + exception.getMessage()
            );
        }
    }
}