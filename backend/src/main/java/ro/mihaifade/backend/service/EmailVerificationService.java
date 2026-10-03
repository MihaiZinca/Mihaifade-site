package ro.mihaifade.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.entity.AuthProvider;
import ro.mihaifade.backend.entity.EmailVerificationToken;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.EmailVerificationTokenRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class EmailVerificationService {

    private static final int TOKEN_EXPIRATION_MINUTES = 30;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${spring.mail.username}")
    private String mailUsername;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public EmailVerificationService(
            UserRepository userRepository,
            EmailVerificationTokenRepository tokenRepository,
            JavaMailSender mailSender
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public void sendVerificationEmail(User user) {
        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            return;
        }

        if (isVerified(user)) {
            return;
        }

        tokenRepository.deleteAllByUser(user);
        tokenRepository.flush();

        String rawToken = generateToken();

        EmailVerificationToken token = new EmailVerificationToken();
        token.setTokenHash(hashToken(rawToken));
        token.setUser(user);
        token.setExpiresAt(
                LocalDateTime.now().plusMinutes(TOKEN_EXPIRATION_MINUTES)
        );
        token.setUsed(false);

        tokenRepository.save(token);

        sendEmail(user, rawToken);
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        User user = userRepository
                .findByEmailIgnoreCase(email.trim())
                .orElse(null);

        if (user == null) {
            return;
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            return;
        }

        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            return;
        }

        if (isVerified(user)) {
            return;
        }

        tokenRepository
                .findTopByUserOrderByCreatedAtDesc(user)
                .ifPresent(token -> {
                    LocalDateTime resendAvailableAt =
                            token.getCreatedAt()
                                    .plusSeconds(RESEND_COOLDOWN_SECONDS);

                    if (LocalDateTime.now().isBefore(resendAvailableAt)) {
                        throw new IllegalStateException(
                                "Te rugăm să aștepți înainte să soliciți un nou email de confirmare."
                        );
                    }
                });

        sendVerificationEmail(user);
    }

    @Transactional
    public User verifyEmail(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Tokenul de confirmare este invalid."
            );
        }

        String tokenHash = hashToken(rawToken.trim());

        EmailVerificationToken token = tokenRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Linkul de confirmare este invalid."
                ));

        if (Boolean.TRUE.equals(token.getUsed())) {
            throw new IllegalArgumentException(
                    "Acest link de confirmare a fost deja folosit."
            );
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "Linkul de confirmare a expirat."
            );
        }

        User user = token.getUser();

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new IllegalStateException(
                    "Contul este dezactivat."
            );
        }

        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new IllegalArgumentException(
                    "Acest cont nu necesită confirmarea emailului."
            );
        }

        user.setEmailVerified(true);
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        return user;
    }

    public boolean isVerified(User user) {
        return user.getEmailVerified() == null
                || Boolean.TRUE.equals(user.getEmailVerified());
    }

    private void sendEmail(User user, String rawToken) {
        String verificationLink =
                frontendUrl
                        + "/verify-email?token="
                        + rawToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(user.getEmail());
        message.setSubject(
                "Confirmă adresa de email - Global Barber Society"
        );
        message.setText(
                "Salut, "
                        + user.getFirstName()
                        + "!\n\n"
                        + "Pentru a confirma adresa de email și a activa contul tău Global Barber Society, accesează linkul de mai jos:\n\n"
                        + verificationLink
                        + "\n\n"
                        + "Linkul este valabil "
                        + TOKEN_EXPIRATION_MINUTES
                        + " de minute.\n\n"
                        + "Dacă nu ai creat acest cont, poți ignora acest mesaj.\n\n"
                        + "Global Barber Society"
        );

        mailSender.send(message);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        return Base64
                .getUrlEncoder()
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

            return HexFormat.of().formatHex(hash);
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Nu s-a putut procesa tokenul de confirmare.",
                    exception
            );
        }
    }
}