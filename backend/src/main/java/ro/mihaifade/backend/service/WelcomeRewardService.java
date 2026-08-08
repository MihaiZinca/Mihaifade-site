package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.WelcomeRewardStatusResponse;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.entity.WelcomeRewardType;
import ro.mihaifade.backend.repository.UserRepository;

import java.security.SecureRandom;

@Service
public class WelcomeRewardService {

    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    public WelcomeRewardService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public WelcomeRewardType spin(String email) {
        User user = getUser(email);

        if (Boolean.TRUE.equals(user.getWelcomeSpinUsed())) {
            throw new RuntimeException(
                    "Welcome spin already used"
            );
        }

        WelcomeRewardType reward = drawReward();

        user.setWelcomeSpinUsed(true);
        user.setWelcomeReward(reward);
        user.setWelcomeRewardUsed(false);

        userRepository.save(user);

        return reward;
    }

    public WelcomeRewardStatusResponse getStatus(String email) {
        User user = getUser(email);

        WelcomeRewardType reward = user.getWelcomeReward();

        return new WelcomeRewardStatusResponse(
                !Boolean.TRUE.equals(user.getWelcomeSpinUsed()),
                reward,
                reward == null ? null : getLabel(reward),
                Boolean.TRUE.equals(user.getWelcomeRewardUsed())
        );
    }

    public WelcomeRewardStatusResponse markRewardAsUsed(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(
                        "User not found"
                ));

        if (!Boolean.TRUE.equals(user.getWelcomeSpinUsed())) {
            throw new RuntimeException(
                    "User has not used the welcome spin"
            );
        }

        if (user.getWelcomeReward() == null) {
            throw new RuntimeException(
                    "User has no welcome reward"
            );
        }

        if (
                user.getWelcomeReward() == WelcomeRewardType.NOTHING
                        || user.getWelcomeReward() == WelcomeRewardType.ZERO_POINTS
        ) {
            throw new RuntimeException(
                    "This reward cannot be marked as used"
            );
        }

        if (Boolean.TRUE.equals(user.getWelcomeRewardUsed())) {
            throw new RuntimeException(
                    "Welcome reward already used"
            );
        }

        user.setWelcomeRewardUsed(true);

        User saved = userRepository.save(user);

        return new WelcomeRewardStatusResponse(
                false,
                saved.getWelcomeReward(),
                getLabel(saved.getWelcomeReward()),
                true
        );
    }

    public String getLabel(WelcomeRewardType reward) {
        return switch (reward) {
            case NOTHING -> "Nimic";
            case ZERO_POINTS -> "0 puncte";
            case DISCOUNT_10 -> "10% reducere";
            case DISCOUNT_25 -> "25% reducere";
            case DISCOUNT_50 -> "50% reducere";
            case CASH_50 -> "50 lei";
            case CASH_100 -> "100 lei";
            case FREE_HAIRCUT -> "Un tuns";
        };
    }

    private User getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException(
                        "User not found"
                ));
    }

    private WelcomeRewardType drawReward() {
        int value = random.nextInt(100);

        if (value < 32) {
            return WelcomeRewardType.NOTHING;
        }

        if (value < 55) {
            return WelcomeRewardType.ZERO_POINTS;
        }

        if (value < 75) {
            return WelcomeRewardType.DISCOUNT_10;
        }

        if (value < 85) {
            return WelcomeRewardType.DISCOUNT_25;
        }

        if (value < 88) {
            return WelcomeRewardType.DISCOUNT_50;
        }

        if (value < 93) {
            return WelcomeRewardType.CASH_50;
        }

        if (value < 94) {
            return WelcomeRewardType.CASH_100;
        }

        return WelcomeRewardType.FREE_HAIRCUT;
    }
}