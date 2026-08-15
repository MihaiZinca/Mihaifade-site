package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.PushSubscriptionRequest;
import ro.mihaifade.backend.service.PushSubscriptionService;

@RestController
@RequestMapping("/api/push-subscriptions")
public class PushSubscriptionController {

    private final PushSubscriptionService pushSubscriptionService;

    public PushSubscriptionController(
            PushSubscriptionService pushSubscriptionService
    ) {
        this.pushSubscriptionService =
                pushSubscriptionService;
    }

    @PostMapping("/me")
    public ResponseEntity<Void> register(
            Authentication authentication,
            @Valid @RequestBody PushSubscriptionRequest request
    ) {
        pushSubscriptionService.register(
                authentication.getName(),
                request
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> unregister(
            Authentication authentication,
            @Valid @RequestBody PushSubscriptionRequest request
    ) {
        pushSubscriptionService.unregister(
                authentication.getName(),
                request
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me/all")
    public ResponseEntity<Void> unregisterAll(
            Authentication authentication
    ) {
        pushSubscriptionService.unregisterAll(
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }
}