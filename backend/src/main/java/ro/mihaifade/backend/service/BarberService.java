package ro.mihaifade.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.dto.CreateBarberAccountRequest;
import ro.mihaifade.backend.entity.AuthProvider;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.entity.Role;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.ServiceRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BarberService {

    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public BarberService(
            BarberRepository barberRepository,
            ServiceRepository serviceRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.barberRepository = barberRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Barber> getAllBarbers() {
        return barberRepository.findAll();
    }

    public Barber getBarberById(Long id) {
        return barberRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Barber not found with id: " + id
                        )
                );
    }

    public Barber getBarberByUserEmail(String email) {
        return barberRepository.findByUserEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "No barber profile is associated with user: "
                                        + email
                        )
                );
    }

    public Barber createBarber(Barber barber) {
        return barberRepository.save(barber);
    }

    @Transactional
    public Barber createBarberAccount(
            CreateBarberAccountRequest request
    ) {
        if (userRepository.existsByEmailIgnoreCase(
                request.email()
        )) {
            throw new RuntimeException(
                    "Email already exists"
            );
        }

        if (
                request.phone() != null
                        && !request.phone().isBlank()
                        && userRepository.existsByPhone(
                        request.phone()
                )
        ) {
            throw new RuntimeException(
                    "Phone already exists"
            );
        }

        User user = new User();

        user.setFirstName(
                request.firstName()
        );

        user.setLastName(
                request.lastName()
        );

        user.setEmail(
                request.email()
        );

        user.setPhone(
                request.phone() == null
                        || request.phone().isBlank()
                        ? null
                        : request.phone()
        );

        user.setPasswordHash(
                passwordEncoder.encode(
                        request.password()
                )
        );

        user.setAuthProvider(
                AuthProvider.LOCAL
        );

        user.setRole(
                Role.BARBER
        );

        user.setActive(true);

        User savedUser =
                userRepository.save(user);

        Barber barber = new Barber();

        barber.setDisplayName(
                request.displayName()
        );

        barber.setBio(
                request.bio()
        );

        barber.setImageUrl(null);

        barber.setActive(true);

        barber.setUser(
                savedUser
        );

        return barberRepository.save(
                barber
        );
    }

    public Barber updateBarber(
            Long id,
            Barber updatedBarber
    ) {
        Barber existingBarber =
                getBarberById(id);

        existingBarber.setDisplayName(
                updatedBarber.getDisplayName()
        );

        existingBarber.setBio(
                updatedBarber.getBio()
        );

        existingBarber.setImageUrl(
                updatedBarber.getImageUrl()
        );

        existingBarber.setActive(
                updatedBarber.getActive()
        );

        return barberRepository.save(
                existingBarber
        );
    }

    public Barber updateMyBarberProfile(
            String email,
            Barber updatedBarber
    ) {
        Barber existingBarber =
                getBarberByUserEmail(email);

        existingBarber.setDisplayName(
                updatedBarber.getDisplayName()
        );

        existingBarber.setBio(
                updatedBarber.getBio()
        );

        existingBarber.setActive(
                updatedBarber.getActive()
        );

        return barberRepository.save(
                existingBarber
        );
    }

    public Barber assignServices(
            Long barberId,
            Set<Long> serviceIds
    ) {
        Barber barber =
                getBarberById(barberId);

        Set<ro.mihaifade.backend.entity.Service> services =
                getServicesByIds(serviceIds);

        barber.setServices(
                services
        );

        return barberRepository.save(
                barber
        );
    }

    public Barber assignMyServices(
            String email,
            Set<Long> serviceIds
    ) {
        Barber barber =
                getBarberByUserEmail(email);

        Set<ro.mihaifade.backend.entity.Service> services =
                getServicesByIds(serviceIds);

        barber.setServices(
                services
        );

        return barberRepository.save(
                barber
        );
    }

    private Set<ro.mihaifade.backend.entity.Service> getServicesByIds(
            Set<Long> serviceIds
    ) {
        return serviceIds.stream()
                .map(serviceId ->
                        serviceRepository.findById(serviceId)
                                .orElseThrow(() ->
                                        new RuntimeException(
                                                "Service not found: "
                                                        + serviceId
                                        )
                                )
                )
                .collect(
                        Collectors.toSet()
                );
    }

    public void deactivateBarber(Long id) {
        Barber barber =
                getBarberById(id);

        barber.setActive(false);

        barberRepository.save(
                barber
        );
    }
}