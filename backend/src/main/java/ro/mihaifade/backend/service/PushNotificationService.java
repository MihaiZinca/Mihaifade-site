package ro.mihaifade.backend.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ro.mihaifade.backend.entity.PushSubscription;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.PushSubscriptionRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.util.List;

@Service
public class PushNotificationService {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(
                    PushNotificationService.class
            );

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UserRepository userRepository;

    public PushNotificationService(
            PushSubscriptionRepository pushSubscriptionRepository,
            UserRepository userRepository
    ) {
        this.pushSubscriptionRepository =
                pushSubscriptionRepository;

        this.userRepository =
                userRepository;
    }

    public int sendToUser(
            String email,
            String title,
            String body
    ) {
        User user =
                userRepository
                        .findByEmailIgnoreCase(
                                email
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found with email: "
                                                + email
                                )
                        );

        List<PushSubscription> subscriptions =
                pushSubscriptionRepository
                        .findAllByUserId(
                                user.getId()
                        );

        if (subscriptions.isEmpty()) {
            return 0;
        }

        int sentCount = 0;

        for (
                PushSubscription subscription
                : subscriptions
        ) {
            Message message =
                    Message.builder()
                            .setToken(
                                    subscription.getToken()
                            )
                            .putData(
                                    "title",
                                    title
                            )
                            .putData(
                                    "body",
                                    body
                            )
                            .build();

            try {
                FirebaseMessaging
                        .getInstance()
                        .send(
                                message
                        );

                sentCount++;
            } catch (
                    FirebaseMessagingException exception
            ) {
                handleFirebaseMessagingException(
                        subscription,
                        exception
                );
            }
        }

        return sentCount;
    }

    private void handleFirebaseMessagingException(
            PushSubscription subscription,
            FirebaseMessagingException exception
    ) {
        if (
                exception.getMessagingErrorCode()
                        == MessagingErrorCode.UNREGISTERED
        ) {
            pushSubscriptionRepository.delete(
                    subscription
            );

            LOGGER.info(
                    "Removed expired FCM subscription with id {}.",
                    subscription.getId()
            );

            return;
        }

        LOGGER.error(
                "FCM notification failed for subscription {}: {}",
                subscription.getId(),
                exception.getMessage()
        );
    }
}