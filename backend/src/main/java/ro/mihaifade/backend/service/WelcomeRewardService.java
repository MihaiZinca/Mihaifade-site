package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.WelcomeRewardStatusResponse;
import ro.mihaifade.backend.entity.Appointment;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.entity.WelcomeRewardType;
import ro.mihaifade.backend.repository.AppointmentRepository;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.security.SecureRandom;

@Service
public class WelcomeRewardService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final BarberRepository barberRepository;

    private final SecureRandom random = new SecureRandom();

    public WelcomeRewardService(
            UserRepository userRepository,
            AppointmentRepository appointmentRepository,
            BarberRepository barberRepository
    ) {
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.barberRepository = barberRepository;
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

        return buildStatusResponse(user, reward);
    }

    public WelcomeRewardStatusResponse getRewardForBarberAppointment(
            Long appointmentId,
            String barberEmail
    ) {
        Appointment appointment =
                getAppointmentForAuthenticatedBarber(
                        appointmentId,
                        barberEmail
                );

        User user = appointment.getUser();
        WelcomeRewardType reward = user.getWelcomeReward();

        return buildStatusResponse(user, reward);
    }

    public WelcomeRewardStatusResponse markRewardAsUsed(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(
                        "User not found"
                ));

        return markUserRewardAsUsed(user);
    }

    public WelcomeRewardStatusResponse markRewardAsUsedByBarber(
            Long appointmentId,
            String barberEmail
    ) {
        Appointment appointment =
                getAppointmentForAuthenticatedBarber(
                        appointmentId,
                        barberEmail
                );

        return markUserRewardAsUsed(
                appointment.getUser()
        );
    }

    public String getLabel(WelcomeRewardType reward) {
        return switch (reward) {
            case NOTHING -> "Nimic";
            case POWDER -> "O pudră";
            case DISCOUNT_10 -> "10% reducere";
            case DISCOUNT_25 -> "25% reducere";
            case DISCOUNT_50 -> "50% reducere";
            case CASH_50 -> "50 lei";
            case CASH_100 -> "100 lei";
            case FREE_HAIRCUT -> "Un tuns";
        };
    }

    private WelcomeRewardStatusResponse markUserRewardAsUsed(
            User user
    ) {
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

        if (user.getWelcomeReward() == WelcomeRewardType.NOTHING) {
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

    private Appointment getAppointmentForAuthenticatedBarber(
            Long appointmentId,
            String barberEmail
    ) {
        Barber barber = barberRepository
                .findByUserEmailIgnoreCase(barberEmail)
                .orElseThrow(() -> new RuntimeException(
                        "Barber not found"
                ));

        Appointment appointment = appointmentRepository
                .findById(appointmentId)
                .orElseThrow(() -> new RuntimeException(
                        "Appointment not found"
                ));

        if (!appointment.getBarber().getId().equals(barber.getId())) {
            throw new RuntimeException(
                    "Appointment does not belong to this barber"
            );
        }

        return appointment;
    }

    private WelcomeRewardStatusResponse buildStatusResponse(
            User user,
            WelcomeRewardType reward
    ) {
        return new WelcomeRewardStatusResponse(
                !Boolean.TRUE.equals(user.getWelcomeSpinUsed()),
                reward,
                reward == null ? null : getLabel(reward),
                Boolean.TRUE.equals(user.getWelcomeRewardUsed())
        );
    }

    private User getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException(
                        "User not found"
                ));
    }

    private WelcomeRewardType drawReward() {
        int value = random.nextInt(100);

        // 40%
        if (value < 40) {
            return WelcomeRewardType.NOTHING;
        }

        // 20%
        if (value < 60) {
            return WelcomeRewardType.POWDER;
        }

        // 18%
        if (value < 78) {
            return WelcomeRewardType.DISCOUNT_10;
        }

        // 10%
        if (value < 88) {
            return WelcomeRewardType.DISCOUNT_25;
        }

        // 3%
        if (value < 91) {
            return WelcomeRewardType.DISCOUNT_50;
        }

        // 4%
        if (value < 95) {
            return WelcomeRewardType.CASH_50;
        }

        // 1%
        if (value < 96) {
            return WelcomeRewardType.CASH_100;
        }

        // 4%
        return WelcomeRewardType.FREE_HAIRCUT;
    }
}