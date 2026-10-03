package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.entity.AuthProvider;
import ro.mihaifade.backend.entity.Role;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.EmailVerificationTokenRepository;
import ro.mihaifade.backend.repository.PasswordResetTokenRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UnverifiedAccountCleanupService {

    private static final int EXPIRATION_HOURS = 48;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public UnverifiedAccountCleanupService(
            UserRepository userRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository
    ) {
        this.userRepository = userRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    @Transactional
    public int cleanupExpiredAccounts() {
        LocalDateTime cutoff =
                LocalDateTime.now()
                        .minusHours(EXPIRATION_HOURS);

        List<User> expiredUsers =
                userRepository
                        .findByRoleAndAuthProviderAndActiveTrueAndEmailVerifiedFalseAndCreatedAtBefore(
                                Role.CLIENT,
                                AuthProvider.LOCAL,
                                cutoff
                        );

        for (User user : expiredUsers) {
            emailVerificationTokenRepository.deleteAllByUser(user);
            passwordResetTokenRepository.deleteAllByUser(user);
            userRepository.delete(user);
        }

        return expiredUsers.size();
    }
}