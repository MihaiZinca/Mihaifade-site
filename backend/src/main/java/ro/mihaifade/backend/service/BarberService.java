package ro.mihaifade.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.dto.CreateBarberAccountRequest;
import ro.mihaifade.backend.entity.*;
import ro.mihaifade.backend.repository.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BarberService {

    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentRepository appointmentRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final TimeOffRepository timeOffRepository;
    private final BarberServiceOfferingRepository barberServiceOfferingRepository;

    public BarberService(
            BarberRepository barberRepository,
            ServiceRepository serviceRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AppointmentRepository appointmentRepository,
            WorkingHoursRepository workingHoursRepository,
            TimeOffRepository timeOffRepository,
            BarberServiceOfferingRepository barberServiceOfferingRepository
    ) {
        this.barberRepository =
                barberRepository;

        this.serviceRepository =
                serviceRepository;

        this.userRepository =
                userRepository;

        this.passwordEncoder =
                passwordEncoder;

        this.appointmentRepository =
                appointmentRepository;

        this.workingHoursRepository =
                workingHoursRepository;

        this.timeOffRepository =
                timeOffRepository;

        this.barberServiceOfferingRepository =
                barberServiceOfferingRepository;
    }

    public List<Barber> getAllBarbers() {
        return barberRepository.findAll();
    }

    public Barber getBarberById(
            Long id
    ) {
        return barberRepository
                .findById(
                        id
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Barber not found with id: "
                                        + id
                        )
                );
    }

    public Barber getBarberByUserEmail(
            String email
    ) {
        return barberRepository
                .findByUserEmailIgnoreCase(
                        email
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "No barber profile is associated with user: "
                                        + email
                        )
                );
    }

    public Barber createBarber(
            Barber barber
    ) {
        return barberRepository.save(
                barber
        );
    }

    @Transactional
    public Barber createBarberAccount(
            CreateBarberAccountRequest request
    ) {
        if (
                userRepository.existsByEmailIgnoreCase(
                        request.email()
                )
        ) {
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

        User user =
                new User();

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

        user.setActive(
                true
        );

        User savedUser =
                userRepository.save(
                        user
                );

        Barber barber =
                new Barber();

        barber.setDisplayName(
                request.displayName()
        );

        barber.setBio(
                request.bio()
        );

        barber.setImageUrl(
                null
        );

        barber.setInstagramUrl(
                null
        );

        barber.setFacebookUrl(
                null
        );

        barber.setYoutubeUrl(
                null
        );

        barber.setTiktokUrl(
                null
        );

        barber.setActive(
                true
        );

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
                getBarberById(
                        id
                );

        existingBarber.setDisplayName(
                updatedBarber.getDisplayName()
        );

        existingBarber.setBio(
                updatedBarber.getBio()
        );

        existingBarber.setImageUrl(
                updatedBarber.getImageUrl()
        );

        existingBarber.setInstagramUrl(
                normalizeOptionalUrl(
                        updatedBarber.getInstagramUrl()
                )
        );

        existingBarber.setFacebookUrl(
                normalizeOptionalUrl(
                        updatedBarber.getFacebookUrl()
                )
        );

        existingBarber.setYoutubeUrl(
                normalizeOptionalUrl(
                        updatedBarber.getYoutubeUrl()
                )
        );

        existingBarber.setTiktokUrl(
                normalizeOptionalUrl(
                        updatedBarber.getTiktokUrl()
                )
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
                getBarberByUserEmail(
                        email
                );

        existingBarber.setDisplayName(
                updatedBarber.getDisplayName()
        );

        existingBarber.setBio(
                updatedBarber.getBio()
        );

        existingBarber.setInstagramUrl(
                normalizeOptionalUrl(
                        updatedBarber.getInstagramUrl()
                )
        );

        existingBarber.setFacebookUrl(
                normalizeOptionalUrl(
                        updatedBarber.getFacebookUrl()
                )
        );

        existingBarber.setYoutubeUrl(
                normalizeOptionalUrl(
                        updatedBarber.getYoutubeUrl()
                )
        );

        existingBarber.setTiktokUrl(
                normalizeOptionalUrl(
                        updatedBarber.getTiktokUrl()
                )
        );

        existingBarber.setActive(
                updatedBarber.getActive()
        );

        return barberRepository.save(
                existingBarber
        );
    }

    @Transactional
    public Barber assignServices(
            Long barberId,
            Set<Long> serviceIds
    ) {
        Barber barber =
                getBarberById(
                        barberId
                );

        Set<ro.mihaifade.backend.entity.Service> services =
                getServicesByIds(
                        serviceIds
                );

        barber.setServices(
                services
        );

        syncServiceOfferings(
                barber,
                services
        );

        return barberRepository.save(
                barber
        );
    }

    @Transactional
    public Barber assignMyServices(
            String email,
            Set<Long> serviceIds
    ) {
        Barber barber =
                getBarberByUserEmail(
                        email
                );

        Set<ro.mihaifade.backend.entity.Service> services =
                getServicesByIds(
                        serviceIds
                );

        barber.setServices(
                services
        );

        syncServiceOfferings(
                barber,
                services
        );

        return barberRepository.save(
                barber
        );
    }

    private void syncServiceOfferings(
            Barber barber,
            Set<ro.mihaifade.backend.entity.Service> selectedServices
    ) {
        List<BarberServiceOffering> existingOfferings =
                barberServiceOfferingRepository
                        .findByBarberIdOrderByServiceNameAsc(
                                barber.getId()
                        );

        Set<Long> selectedServiceIds =
                selectedServices
                        .stream()
                        .map(
                                ro.mihaifade.backend.entity.Service::getId
                        )
                        .collect(
                                Collectors.toSet()
                        );

        for (
                BarberServiceOffering offering
                : existingOfferings
        ) {
            Long serviceId =
                    offering
                            .getService()
                            .getId();

            if (
                    selectedServiceIds.contains(
                            serviceId
                    )
            ) {
                offering.setActive(
                        true
                );
            } else {
                offering.setActive(
                        false
                );
            }

            barberServiceOfferingRepository.save(
                    offering
            );
        }

        for (
                ro.mihaifade.backend.entity.Service service
                : selectedServices
        ) {
            BarberServiceOffering offering =
                    barberServiceOfferingRepository
                            .findByBarberIdAndServiceId(
                                    barber.getId(),
                                    service.getId()
                            )
                            .orElse(
                                    null
                            );

            if (
                    offering == null
            ) {
                BarberServiceOffering newOffering =
                        new BarberServiceOffering();

                newOffering.setBarber(
                        barber
                );

                newOffering.setService(
                        service
                );

                newOffering.setPrice(
                        service.getPrice()
                );

                newOffering.setDurationMinutes(
                        service.getDurationMinutes()
                );

                newOffering.setActive(
                        true
                );

                barberServiceOfferingRepository.save(
                        newOffering
                );
            }
        }
    }

    private Set<ro.mihaifade.backend.entity.Service> getServicesByIds(
            Set<Long> serviceIds
    ) {
        return serviceIds
                .stream()
                .map(serviceId ->
                        serviceRepository
                                .findById(
                                        serviceId
                                )
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

    private String normalizeOptionalUrl(
            String value
    ) {
        if (
                value == null
                        || value.isBlank()
        ) {
            return null;
        }

        return value.trim();
    }

    public void deactivateBarber(
            Long id
    ) {
        Barber barber =
                getBarberById(
                        id
                );

        barber.setActive(
                false
        );

        barberRepository.save(
                barber
        );
    }

    @Transactional
    public void deleteBarberPermanently(
            Long id
    ) {
        Barber barber =
                getBarberById(
                        id
                );

        if (
                appointmentRepository.existsByBarberId(
                        id
                )
        ) {
            throw new RuntimeException(
                    "Barber cannot be permanently deleted because it has appointments"
            );
        }

        workingHoursRepository.deleteByBarberId(
                id
        );

        timeOffRepository.deleteByBarberId(
                id
        );

        barberServiceOfferingRepository.deleteByBarberId(
                id
        );

        barber.getServices()
                .clear();

        barberRepository.save(
                barber
        );

        User linkedUser =
                barber.getUser();

        barber.setUser(
                null
        );

        barberRepository.save(
                barber
        );

        barberRepository.delete(
                barber
        );

        if (
                linkedUser != null
        ) {
            userRepository.delete(
                    linkedUser
            );
        }
    }
}