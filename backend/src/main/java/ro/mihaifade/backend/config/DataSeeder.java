package ro.mihaifade.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import ro.mihaifade.backend.entity.*;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.ServiceRepository;
import ro.mihaifade.backend.repository.UserRepository;
import ro.mihaifade.backend.repository.WorkingHoursRepository;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final ServiceRepository serviceRepository;
    private final BarberRepository barberRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.owner.email}")
    private String ownerEmail;

    @Value("${app.owner.password}")
    private String ownerPassword;

    @Value("${app.owner.first-name}")
    private String ownerFirstName;

    @Value("${app.owner.last-name}")
    private String ownerLastName;

    public DataSeeder(
            ServiceRepository serviceRepository,
            BarberRepository barberRepository,
            WorkingHoursRepository workingHoursRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.serviceRepository = serviceRepository;
        this.barberRepository = barberRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedServices();

        Barber mihai = seedBarber();

        assignServicesToMihai(mihai);
        seedWorkingHours(mihai);
        seedOwner();
    }

    private void seedServices() {
        createServiceIfMissing(
                "Tuns Copii",
                "Tunsoare pentru copii",
                "60",
                60
        );

        createServiceIfMissing(
                "Tuns",
                "Tunsoare clasica",
                "65",
                60
        );

        createServiceIfMissing(
                "Barba",
                "Aranjare si contur barba",
                "20",
                30
        );

        createServiceIfMissing(
                "Tuns Copii + Barba",
                "Tunsoare copii si aranjare barba",
                "80",
                60
        );

        createServiceIfMissing(
                "Tuns + Barba",
                "Tunsoare si aranjare barba",
                "85",
                60
        );

        createServiceIfMissing(
                "Vopsit Suvite",
                "Serviciu de vopsire suvite",
                "250",
                240
        );

        createServiceIfMissing(
                "Vopsit Total",
                "Vopsire completa",
                "300",
                240
        );

        createServiceIfMissing(
                "Vopsit Suvite + Tuns",
                "Vopsit suvite si tunsoare",
                "315",
                300
        );

        createServiceIfMissing(
                "Vopsit Total + Tuns",
                "Vopsire completa si tunsoare",
                "365",
                300
        );

        createServiceIfMissing(
                "Vopsit Suvite + Tuns + Barba",
                "Vopsit suvite, tunsoare si barba",
                "335",
                300
        );

        createServiceIfMissing(
                "Vopsit Total + Tuns + Barba",
                "Vopsire completa, tunsoare si barba",
                "385",
                300
        );
    }

    private void createServiceIfMissing(
            String name,
            String description,
            String price,
            Integer durationMinutes
    ) {
        if (!serviceRepository.existsByNameIgnoreCase(name)) {
            Service service = new Service(
                    name,
                    description,
                    new BigDecimal(price),
                    durationMinutes,
                    true
            );

            serviceRepository.save(service);
        }
    }

    private Barber seedBarber() {
        return barberRepository.findByDisplayNameIgnoreCase("Mihai Fade")
                .orElseGet(() -> {
                    Barber barber = new Barber(
                            "Mihai Fade",
                            "Owner si barber Mihaifade",
                            null,
                            true
                    );

                    return barberRepository.save(barber);
                });
    }

    private void assignServicesToMihai(Barber mihai) {
        List<Service> allServices = serviceRepository.findAll();

        mihai.setServices(new HashSet<>(allServices));

        barberRepository.save(mihai);
    }

    private void seedWorkingHours(Barber mihai) {
        for (DayOfWeek day : DayOfWeek.values()) {
            if (workingHoursRepository
                    .findByBarberIdAndDayOfWeek(mihai.getId(), day)
                    .isPresent()) {
                continue;
            }

            WorkingHours workingHours = new WorkingHours();

            workingHours.setBarber(mihai);
            workingHours.setDayOfWeek(day);
            workingHours.setStartTime(LocalTime.of(8, 0));
            workingHours.setEndTime(LocalTime.of(22, 0));
            workingHours.setActive(day != DayOfWeek.SUNDAY);

            workingHoursRepository.save(workingHours);
        }
    }

    private void seedOwner() {
        if (userRepository.existsByEmailIgnoreCase(ownerEmail)) {
            return;
        }

        User owner = new User();

        owner.setFirstName(ownerFirstName);
        owner.setLastName(ownerLastName);
        owner.setEmail(ownerEmail);
        owner.setPhone(null);
        owner.setPasswordHash(passwordEncoder.encode(ownerPassword));
        owner.setAuthProvider(AuthProvider.LOCAL);
        owner.setRole(Role.OWNER);
        owner.setActive(true);

        userRepository.save(owner);
    }
}