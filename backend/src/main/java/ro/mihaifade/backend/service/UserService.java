package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.dto.CompleteProfileRequest;
import ro.mihaifade.backend.dto.MarketingConsentRequest;
import ro.mihaifade.backend.dto.UserRequest;
import ro.mihaifade.backend.dto.UserResponse;
import ro.mihaifade.backend.entity.Role;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.EmailVerificationTokenRepository;
import ro.mihaifade.backend.repository.PasswordResetTokenRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public UserService(
            UserRepository userRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository
    ) {
        this.userRepository = userRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + id
                        )
                );

        return toResponse(user);
    }

    public UserResponse getMyProfile(
            String email
    ) {
        User user =
                getUserByEmail(email);

        return toResponse(user);
    }

    public User getUserEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + id
                        )
                );
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with email: " + email
                        )
                );
    }

    public UserResponse createUser(
            UserRequest request
    ) {
        if (request.email() != null
                && userRepository.existsByEmailIgnoreCase(
                request.email()
        )) {
            throw new RuntimeException(
                    "Email already exists"
            );
        }

        if (request.phone() != null
                && userRepository.existsByPhone(
                request.phone()
        )) {
            throw new RuntimeException(
                    "Phone already exists"
            );
        }

        User user = new User();

        user.setFirstName(
                request.firstName()
        );

        user.setLastName(
                request.lastName()
        );

        user.setEmail(
                request.email()
        );

        user.setPhone(
                request.phone()
        );

        user.setRole(
                Role.CLIENT
        );

        user.setActive(true);
        user.setMarketingConsent(false);
        user.setMarketingConsentUpdatedAt(null);

        return toResponse(
                userRepository.save(user)
        );
    }

    public UserResponse changeUserRole(
            Long userId,
            Role role
    ) {
        User user =
                getUserEntityById(userId);

        user.setRole(role);

        User savedUser =
                userRepository.save(user);

        return toResponse(savedUser);
    }

    public UserResponse completeMyProfile(
            String email,
            CompleteProfileRequest request
    ) {
        User user =
                getUserByEmail(email);

        String phone =
                request.phone().trim();

        userRepository.findByPhone(phone)
                .filter(existingUser ->
                        !existingUser
                                .getId()
                                .equals(user.getId())
                )
                .ifPresent(existingUser -> {
                    throw new RuntimeException(
                            "Phone already exists"
                    );
                });

        user.setPhone(phone);

        User savedUser =
                userRepository.save(user);

        return toResponse(savedUser);
    }

    @Transactional
    public UserResponse updateMarketingConsent(
            String email,
            MarketingConsentRequest request
    ) {
        User user =
                getUserByEmail(email);

        if (user.getRole() != Role.CLIENT) {
            throw new IllegalStateException(
                    "Marketing preferences are available only for client accounts."
            );
        }

        user.setMarketingConsent(
                request.marketingConsent()
        );

        user.setMarketingConsentUpdatedAt(
                LocalDateTime.now()
        );

        User savedUser =
                userRepository.save(user);

        return toResponse(savedUser);
    }

    @Transactional
    public void deactivateMyAccount(
            String email
    ) {
        User user =
                getUserByEmail(email);

        if (user.getRole() != Role.CLIENT) {
            throw new IllegalStateException(
                    "Only client accounts can be deleted."
            );
        }

        emailVerificationTokenRepository.deleteAllByUser(user);
        passwordResetTokenRepository.deleteAllByUser(user);

        String deletedEmail =
                "deleted-" + user.getId() + "@deleted.local";

        user.setFirstName("Cont");
        user.setLastName("Șters");
        user.setEmail(deletedEmail);
        user.setPhone(null);
        user.setPasswordHash(null);
        user.setActive(false);
        user.setEmailVerified(false);
        user.setMarketingConsent(false);
        user.setMarketingConsentUpdatedAt(
                LocalDateTime.now()
        );

        userRepository.save(user);
    }

    private UserResponse toResponse(
            User user
    ) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getActive(),
                Boolean.TRUE.equals(
                        user.getMarketingConsent()
                ),
                user.getMarketingConsentUpdatedAt(),
                user.getWelcomeSpinUsed(),
                user.getWelcomeReward(),
                user.getWelcomeRewardUsed(),
                user.getCreatedAt()
        );
    }
}