package ro.mihaifade.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ro.mihaifade.backend.dto.*;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.service.AuthRateLimitService;
import ro.mihaifade.backend.service.AuthService;
import ro.mihaifade.backend.service.EmailVerificationService;
import ro.mihaifade.backend.service.PasswordResetService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;
    private final AuthRateLimitService authRateLimitService;

    public AuthController(
            AuthService authService,
            PasswordResetService passwordResetService,
            EmailVerificationService emailVerificationService,
            AuthRateLimitService authRateLimitService
    ) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.emailVerificationService = emailVerificationService;
        this.authRateLimitService = authRateLimitService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);

        if (!authRateLimitService.allowRegister(clientIp)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Prea multe încercări de înregistrare. Încearcă din nou mai târziu."
            );
        }

        authService.register(request);

        return new MessageResponse(
                "Contul a fost creat. Verifică emailul pentru a confirma adresa."
        );
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public AuthResponse googleLogin(
            @Valid @RequestBody GoogleLoginRequest request
    ) {
        return authService.googleLogin(request);
    }

    @PostMapping("/verify-email")
    public AuthResponse verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request
    ) {
        User user = emailVerificationService.verifyEmail(
                request.token()
        );

        return authService.createAuthResponse(user);
    }

    @PostMapping("/resend-verification")
    public MessageResponse resendVerification(
            @Valid @RequestBody ResendVerificationRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);

        if (!authRateLimitService.allowResend(clientIp)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Prea multe solicitări de retrimitere. Încearcă din nou mai târziu."
            );
        }

        emailVerificationService.resendVerificationEmail(
                request.email()
        );

        return new MessageResponse(
                "Dacă adresa aparține unui cont care necesită confirmare, un nou email a fost trimis."
        );
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        passwordResetService.requestPasswordReset(
                request.email()
        );

        return new MessageResponse(
                "Dacă există un cont asociat acestei adrese de email, vei primi instrucțiunile pentru resetarea parolei."
        );
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        passwordResetService.resetPassword(
                request.token(),
                request.newPassword()
        );

        return new MessageResponse(
                "Parola a fost schimbată cu succes."
        );
    }

    private String getClientIp(
            HttpServletRequest request
    ) {
        String forwardedFor =
                request.getHeader("X-Forwarded-For");

        if (
                forwardedFor != null
                        && !forwardedFor.isBlank()
        ) {
            return forwardedFor
                    .split(",")[0]
                    .trim();
        }

        return request.getRemoteAddr();
    }
}