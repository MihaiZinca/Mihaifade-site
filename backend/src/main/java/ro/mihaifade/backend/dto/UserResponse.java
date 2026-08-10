package ro.mihaifade.backend.dto;

import ro.mihaifade.backend.entity.Role;
import ro.mihaifade.backend.entity.WelcomeRewardType;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        Role role,
        Boolean active,
        Boolean welcomeSpinUsed,
        WelcomeRewardType welcomeReward,
        Boolean welcomeRewardUsed,
        LocalDateTime createdAt
) {
}