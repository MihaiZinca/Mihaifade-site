package ro.mihaifade.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ro.mihaifade.backend.dto.CreateBarberAccountRequest;
import ro.mihaifade.backend.entity.*;
import ro.mihaifade.backend.repository.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BarberService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentRepository appointmentRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final TimeOffRepository timeOffRepository;
    private final BarberServiceOfferingRepository barberServiceOfferingRepository;
    private final Cloudinary cloudinary;

    public BarberService(
            BarberRepository barberRepository,
            ServiceRepository serviceRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AppointmentRepository appointmentRepository,
            WorkingHoursRepository workingHoursRepository,
            TimeOffRepository timeOffRepository,
            BarberServiceOfferingRepository barberServiceOfferingRepository,
            Cloudinary cloudinary
    ) {
        this.barberRepository = barberRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.appointmentRepository = appointmentRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.timeOffRepository = timeOffRepository;
        this.barberServiceOfferingRepository = barberServiceOfferingRepository;
        this.cloudinary = cloudinary;
    }

    public List<Barber> getAllBarbers() {
        return barberRepository.findAll();
    }

    public Barber getBarberById(Long id) {
        return barberRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Barber not found with id: " + id
                        )
                );
    }

    public Barber getBarberByUserEmail(String email) {
        return barberRepository
                .findByUserEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "No barber profile is associated with user: " + email
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
                request.phone() != null &&
                        !request.phone().isBlank() &&
                        userRepository.existsByPhone(
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
                request.phone() == null ||
                        request.phone().isBlank()
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

        barber.setPhoneNumber(
                normalizeOptionalText(
                        request.phone()
                )
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

    @Transactional
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

        existingBarber.setPhoneNumber(
                normalizeOptionalText(
                        updatedBarber.getPhoneNumber()
                )
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

        existingBarber.setPhoneNumber(
                normalizeOptionalText(
                        updatedBarber.getPhoneNumber()
                )
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
    public Barber replaceBarberImage(
            Long barberId,
            MultipartFile file
    ) {
        validateImage(file);

        Barber barber =
                getBarberById(
                        barberId
                );

        String oldImageUrl =
                barber.getImageUrl();

        Map<?, ?> uploadResult =
                uploadBarberImage(
                        file
                );

        String newImageUrl =
                getUploadValue(
                        uploadResult,
                        "secure_url"
                );

        String newPublicId =
                getUploadValue(
                        uploadResult,
                        "public_id"
                );

        barber.setImageUrl(
                newImageUrl
        );

        Barber savedBarber;

        try {
            savedBarber =
                    barberRepository.saveAndFlush(
                            barber
                    );
        } catch (RuntimeException exception) {
            destroyCloudinaryImageQuietly(
                    newPublicId
            );

            throw exception;
        }

        String oldPublicId =
                extractCloudinaryPublicId(
                        oldImageUrl
                );

        destroyCloudinaryImageQuietly(
                oldPublicId
        );

        return savedBarber;
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
                                                "Service not found: " +
                                                        serviceId
                                        )
                                )
                )
                .collect(
                        Collectors.toSet()
                );
    }

    private Map<?, ?> uploadBarberImage(
            MultipartFile file
    ) {
        try {
            return cloudinary
                    .uploader()
                    .upload(
                            file.getBytes(),
                            ObjectUtils.asMap(
                                    "folder",
                                    "mihaifade/barbers",
                                    "resource_type",
                                    "image"
                            )
                    );
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Imaginea barberului nu a putut fi încărcată.",
                    exception
            );
        }
    }

    private void validateImage(
            MultipartFile file
    ) {
        if (
                file == null ||
                        file.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "Selectează o imagine."
            );
        }

        if (
                file.getSize() >
                        MAX_FILE_SIZE
        ) {
            throw new IllegalArgumentException(
                    "Imaginea poate avea maximum 10 MB."
            );
        }

        String contentType =
                file.getContentType();

        if (
                contentType == null ||
                        !contentType.startsWith(
                                "image/"
                        )
        ) {
            throw new IllegalArgumentException(
                    "Fișierul trebuie să fie o imagine."
            );
        }
    }

    private String getUploadValue(
            Map<?, ?> uploadResult,
            String key
    ) {
        Object value =
                uploadResult.get(
                        key
                );

        if (
                value == null ||
                        value.toString().isBlank()
        ) {
            throw new IllegalStateException(
                    "Răspuns invalid primit de la Cloudinary."
            );
        }

        return value.toString();
    }

    private String extractCloudinaryPublicId(
            String imageUrl
    ) {
        if (
                imageUrl == null ||
                        imageUrl.isBlank() ||
                        !imageUrl.contains(
                                "/upload/"
                        )
        ) {
            return null;
        }

        int uploadIndex =
                imageUrl.indexOf(
                        "/upload/"
                );

        String value =
                imageUrl.substring(
                        uploadIndex +
                                "/upload/".length()
                );

        value =
                value.replaceFirst(
                        "^v\\d+/",
                        ""
                );

        int queryIndex =
                value.indexOf("?");

        if (
                queryIndex >= 0
        ) {
            value =
                    value.substring(
                            0,
                            queryIndex
                    );
        }

        int lastDot =
                value.lastIndexOf(".");

        if (
                lastDot > 0
        ) {
            value =
                    value.substring(
                            0,
                            lastDot
                    );
        }

        return value.isBlank()
                ? null
                : value;
    }

    private void destroyCloudinaryImageQuietly(
            String publicId
    ) {
        if (
                publicId == null ||
                        publicId.isBlank()
        ) {
            return;
        }

        try {
            cloudinary
                    .uploader()
                    .destroy(
                            publicId,
                            ObjectUtils.emptyMap()
                    );
        } catch (IOException ignored) {
        }
    }

    private String normalizeOptionalUrl(
            String value
    ) {
        if (
                value == null ||
                        value.isBlank()
        ) {
            return null;
        }

        return value.trim();
    }

    private String normalizeOptionalText(
            String value
    ) {
        if (
                value == null ||
                        value.isBlank()
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

        String imagePublicId =
                extractCloudinaryPublicId(
                        barber.getImageUrl()
                );

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

        destroyCloudinaryImageQuietly(
                imagePublicId
        );
    }
}