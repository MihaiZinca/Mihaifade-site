package ro.mihaifade.backend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.WelcomeRewardResponse;
import ro.mihaifade.backend.dto.WelcomeRewardStatusResponse;
import ro.mihaifade.backend.entity.WelcomeRewardType;
import ro.mihaifade.backend.service.WelcomeRewardService;

@RestController
@RequestMapping("/api/rewards")
public class WelcomeRewardController {

    private final WelcomeRewardService welcomeRewardService;

    public WelcomeRewardController(
            WelcomeRewardService welcomeRewardService
    ) {
        this.welcomeRewardService = welcomeRewardService;
    }

    @GetMapping("/me")
    public WelcomeRewardStatusResponse getMyRewardStatus(
            Authentication authentication
    ) {
        return welcomeRewardService.getStatus(
                authentication.getName()
        );
    }

    @PostMapping("/spin")
    public WelcomeRewardResponse spin(
            Authentication authentication
    ) {
        WelcomeRewardType reward =
                welcomeRewardService.spin(
                        authentication.getName()
                );

        return new WelcomeRewardResponse(
                reward,
                welcomeRewardService.getLabel(reward)
        );
    }

    @PutMapping("/users/{userId}/use")
    public WelcomeRewardStatusResponse markRewardAsUsed(
            @PathVariable Long userId
    ) {
        return welcomeRewardService.markRewardAsUsed(userId);
    }
}