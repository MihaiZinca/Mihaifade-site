package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthRateLimitService {

    private static final int REGISTER_LIMIT = 5;
    private static final int RESEND_LIMIT = 5;
    private static final long WINDOW_SECONDS = 15 * 60;

    private final Map<String, Deque<Instant>> registerAttempts =
            new ConcurrentHashMap<>();

    private final Map<String, Deque<Instant>> resendAttempts =
            new ConcurrentHashMap<>();

    public boolean allowRegister(String ipAddress) {
        return allow(
                registerAttempts,
                normalizeIp(ipAddress),
                REGISTER_LIMIT
        );
    }

    public boolean allowResend(String ipAddress) {
        return allow(
                resendAttempts,
                normalizeIp(ipAddress),
                RESEND_LIMIT
        );
    }

    private boolean allow(
            Map<String, Deque<Instant>> attempts,
            String key,
            int limit
    ) {
        Instant now = Instant.now();
        Instant cutoff =
                now.minusSeconds(WINDOW_SECONDS);

        Deque<Instant> timestamps =
                attempts.computeIfAbsent(
                        key,
                        ignored -> new ArrayDeque<>()
                );

        synchronized (timestamps) {
            while (
                    !timestamps.isEmpty()
                            && timestamps
                            .peekFirst()
                            .isBefore(cutoff)
            ) {
                timestamps.removeFirst();
            }

            if (timestamps.size() >= limit) {
                return false;
            }

            timestamps.addLast(now);

            return true;
        }
    }

    private String normalizeIp(String ipAddress) {
        if (
                ipAddress == null
                        || ipAddress.isBlank()
        ) {
            return "unknown";
        }

        return ipAddress.trim();
    }
}