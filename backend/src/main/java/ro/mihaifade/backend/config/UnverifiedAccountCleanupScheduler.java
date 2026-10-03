package ro.mihaifade.backend.config;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import ro.mihaifade.backend.service.UnverifiedAccountCleanupService;

@Component
public class UnverifiedAccountCleanupScheduler {

    private final UnverifiedAccountCleanupService cleanupService;

    public UnverifiedAccountCleanupScheduler(
            UnverifiedAccountCleanupService cleanupService
    ) {
        this.cleanupService = cleanupService;
    }

    @Scheduled(
            fixedDelay = 6 * 60 * 60 * 1000L,
            initialDelay = 60 * 1000L
    )
    public void cleanupUnverifiedAccounts() {
        cleanupService.cleanupExpiredAccounts();
    }
}