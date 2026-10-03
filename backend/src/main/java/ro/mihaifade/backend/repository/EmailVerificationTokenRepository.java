package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.EmailVerificationToken;
import ro.mihaifade.backend.entity.User;

import java.util.Optional;

public interface EmailVerificationTokenRepository
        extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    Optional<EmailVerificationToken> findTopByUserOrderByCreatedAtDesc(User user);

    void deleteAllByUser(User user);
}