package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.ClientOffer;

import java.time.LocalDateTime;
import java.util.List;

public interface ClientOfferRepository extends JpaRepository<ClientOffer, Long> {

    List<ClientOffer> findByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    List<ClientOffer> findByUserIdAndUsedFalseOrderByCreatedAtDesc(
            Long userId
    );

    List<ClientOffer> findByUserIdAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            Long userId,
            LocalDateTime now
    );
}