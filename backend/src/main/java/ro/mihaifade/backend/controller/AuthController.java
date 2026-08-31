package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.AuthResponse;
import ro.mihaifade.backend.dto.ForgotPasswordRequest;
import ro.mihaifade.backend.dto.GoogleLoginRequest;
import ro.mihaifade.backend.dto.LoginRequest;
import ro.mihaifade.backend.dto.MessageResponse;
import ro.mihaifade.backend.dto.RegisterRequest;
import ro.mihaifade.backend.dto.ResetPasswordRequest;
import ro.mihaifade.backend.service.AuthService;
import ro.mihaifade.backend.service.PasswordResetService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(
            AuthService authService,
            PasswordResetService passwordResetService
    ) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return authService.register(request);
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
}