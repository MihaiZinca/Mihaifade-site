package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.PushSubscription;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository
        extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByToken(
            String token
    );

    List<PushSubscription> findAllByUserId(
            Long userId
    );

    void deleteByTokenAndUserId(
            String token,
            Long userId
    );

    void deleteAllByUserId(
            Long userId
    );
}