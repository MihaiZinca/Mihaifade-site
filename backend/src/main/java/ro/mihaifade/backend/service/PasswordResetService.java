package ro.mihaifade.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.entity.AuthProvider;
import ro.mihaifade.backend.entity.PasswordResetToken;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.PasswordResetTokenRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class PasswordResetService {

    private static final int TOKEN_EXPIRATION_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${spring.mail.username}")
    private String mailUsername;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JavaMailSender mailSender
    ) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmailIgnoreCase(email)
                .filter(User::getActive)
                .filter(user -> user.getAuthProvider() == AuthProvider.LOCAL)
                .ifPresent(this::createAndSendResetToken);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        String tokenHash = hashToken(token);

        PasswordResetToken resetToken =
                passwordResetTokenRepository.findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Linkul de resetare este invalid sau a expirat."
                                )
                        );

        if (Boolean.TRUE.equals(resetToken.getUsed())) {
            throw new RuntimeException(
                    "Linkul de resetare a fost deja folosit."
            );
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Linkul de resetare a expirat."
            );
        }

        User user = resetToken.getUser();

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new RuntimeException(
                    "Contul este dezactivat."
            );
        }

        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new RuntimeException(
                    "Acest cont nu folosește autentificarea cu parolă."
            );
        }

        user.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );

        resetToken.setUsed(true);

        userRepository.save(user);
        passwordResetTokenRepository.save(resetToken);
    }

    private void createAndSendResetToken(User user) {
        passwordResetTokenRepository.deleteAllByUser(user);
        passwordResetTokenRepository.flush();

        String rawToken = generateToken();
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken =
                new PasswordResetToken();

        resetToken.setTokenHash(tokenHash);
        resetToken.setUser(user);
        resetToken.setExpiresAt(
                LocalDateTime.now()
                        .plusMinutes(TOKEN_EXPIRATION_MINUTES)
        );
        resetToken.setUsed(false);

        passwordResetTokenRepository.save(resetToken);

        sendResetEmail(user, rawToken);
    }

    private void sendResetEmail(
            User user,
            String rawToken
    ) {
        String resetLink =
                frontendUrl
                        + "/reset-password?token="
                        + rawToken;

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setFrom(mailUsername);
        message.setTo(user.getEmail());
        message.setSubject("Resetare parolă MihaiFade");
        message.setText(
                "Salut, "
                        + user.getFirstName()
                        + "!\n\n"
                        + "Ai solicitat resetarea parolei contului tău MihaiFade.\n\n"
                        + "Accesează linkul de mai jos pentru a seta o parolă nouă:\n\n"
                        + resetLink
                        + "\n\n"
                        + "Linkul este valabil timp de "
                        + TOKEN_EXPIRATION_MINUTES
                        + " de minute.\n\n"
                        + "Dacă nu ai solicitat resetarea parolei, poți ignora acest email.\n\n"
                        + "MihaiFade"
        );

        mailSender.send(message);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of()
                    .formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 is not available",
                    exception
            );
        }
    }
}