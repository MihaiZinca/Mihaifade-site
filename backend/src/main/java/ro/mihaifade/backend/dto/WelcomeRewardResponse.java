package ro.mihaifade.backend.dto;

import ro.mihaifade.backend.entity.WelcomeRewardType;

public record WelcomeRewardResponse(
        WelcomeRewardType reward,
        String label
) {
}