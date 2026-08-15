package ro.mihaifade.backend.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.PushSubscriptionRequest;
import ro.mihaifade.backend.entity.PushSubscription;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.PushSubscriptionRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.time.LocalDateTime;

@Service
public class PushSubscriptionService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UserRepository userRepository;

    public PushSubscriptionService(
            PushSubscriptionRepository pushSubscriptionRepository,
            UserRepository userRepository
    ) {
        this.pushSubscriptionRepository =
                pushSubscriptionRepository;

        this.userRepository =
                userRepository;
    }

    @Transactional
    public void register(
            String email,
            PushSubscriptionRequest request
    ) {
        User user = getUserByEmail(email);

        PushSubscription subscription =
                pushSubscriptionRepository
                        .findByToken(request.token())
                        .orElseGet(PushSubscription::new);

        subscription.setUser(user);
        subscription.setToken(request.token());
        subscription.setUserAgent(request.userAgent());
        subscription.setUpdatedAt(LocalDateTime.now());

        pushSubscriptionRepository.save(subscription);
    }

    @Transactional
    public void unregister(
            String email,
            PushSubscriptionRequest request
    ) {
        User user = getUserByEmail(email);

        pushSubscriptionRepository
                .deleteByTokenAndUserId(
                        request.token(),
                        user.getId()
                );
    }

    @Transactional
    public void unregisterAll(String email) {
        User user = getUserByEmail(email);

        pushSubscriptionRepository
                .deleteAllByUserId(
                        user.getId()
                );
    }

    private User getUserByEmail(String email) {
        return userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "Utilizatorul autentificat nu există."
                        )
                );
    }
}