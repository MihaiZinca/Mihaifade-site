package ro.mihaifade.backend.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import ro.mihaifade.backend.service.AppointmentReminderService;

@Component
public class AppointmentReminderScheduler {

    private final AppointmentReminderService appointmentReminderService;

    public AppointmentReminderScheduler(
            AppointmentReminderService appointmentReminderService
    ) {
        this.appointmentReminderService =
                appointmentReminderService;
    }

    @Scheduled(
            fixedRate = 60_000
    )
    public void sendAppointmentReminders() {
        appointmentReminderService
                .send24HourReminders();

        appointmentReminderService
                .send2HourReminders();
    }
}