package ro.mihaifade.backend.dto;

import ro.mihaifade.backend.entity.WelcomeRewardType;

public record WelcomeRewardStatusResponse(
        boolean spinAvailable,
        WelcomeRewardType reward,
        String label,
        boolean rewardUsed
) {
}