package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.dto.BarberServiceOfferingRequest;
import ro.mihaifade.backend.dto.BarberServiceOfferingResponse;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.entity.BarberServiceOffering;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.BarberServiceOfferingRepository;
import ro.mihaifade.backend.repository.ServiceRepository;

import java.util.List;

@Service
public class BarberServiceOfferingService {

    private final BarberServiceOfferingRepository barberServiceOfferingRepository;
    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;

    public BarberServiceOfferingService(
            BarberServiceOfferingRepository barberServiceOfferingRepository,
            BarberRepository barberRepository,
            ServiceRepository serviceRepository
    ) {
        this.barberServiceOfferingRepository =
                barberServiceOfferingRepository;

        this.barberRepository =
                barberRepository;

        this.serviceRepository =
                serviceRepository;
    }

    @Transactional(readOnly = true)
    public List<BarberServiceOfferingResponse> getOfferingsForBarber(
            Long barberId
    ) {
        return barberServiceOfferingRepository
                .findByBarberIdOrderByServiceNameAsc(
                        barberId
                )
                .stream()
                .map(
                        this::toResponse
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BarberServiceOfferingResponse> getActiveOfferingsForBarber(
            Long barberId
    ) {
        return barberServiceOfferingRepository
                .findByBarberIdAndActiveTrueOrderByServiceNameAsc(
                        barberId
                )
                .stream()
                .map(
                        this::toResponse
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BarberServiceOfferingResponse> getMyOfferings(
            String email
    ) {
        Barber barber =
                getBarberByUserEmail(
                        email
                );

        Long barberId =
                barber.getId();

        return barberServiceOfferingRepository
                .findByBarberIdOrderByServiceNameAsc(
                        barberId
                )
                .stream()
                .map(
                        this::toResponse
                )
                .toList();
    }

    @Transactional
    public BarberServiceOfferingResponse saveOffering(
            Long barberId,
            BarberServiceOfferingRequest request
    ) {
        Barber barber =
                barberRepository
                        .findById(
                                barberId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Barber not found with id: "
                                                + barberId
                                )
                        );

        ro.mihaifade.backend.entity.Service service =
                serviceRepository
                        .findById(
                                request.serviceId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service not found with id: "
                                                + request.serviceId()
                                )
                        );

        BarberServiceOffering offering =
                barberServiceOfferingRepository
                        .findByBarberIdAndServiceId(
                                barberId,
                                request.serviceId()
                        )
                        .orElseGet(
                                BarberServiceOffering::new
                        );

        offering.setBarber(
                barber
        );

        offering.setService(
                service
        );

        offering.setPrice(
                request.price()
        );

        offering.setDurationMinutes(
                request.durationMinutes()
        );

        offering.setActive(
                request.active()
        );

        BarberServiceOffering savedOffering =
                barberServiceOfferingRepository
                        .save(
                                offering
                        );

        return toResponse(
                savedOffering
        );
    }

    @Transactional
    public BarberServiceOfferingResponse saveMyOffering(
            String email,
            BarberServiceOfferingRequest request
    ) {
        Barber barber =
                getBarberByUserEmail(
                        email
                );

        Long barberId =
                barber.getId();

        ro.mihaifade.backend.entity.Service service =
                serviceRepository
                        .findById(
                                request.serviceId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service not found with id: "
                                                + request.serviceId()
                                )
                        );

        BarberServiceOffering offering =
                barberServiceOfferingRepository
                        .findByBarberIdAndServiceId(
                                barberId,
                                request.serviceId()
                        )
                        .orElseGet(
                                BarberServiceOffering::new
                        );

        offering.setBarber(
                barber
        );

        offering.setService(
                service
        );

        offering.setPrice(
                request.price()
        );

        offering.setDurationMinutes(
                request.durationMinutes()
        );

        offering.setActive(
                request.active()
        );

        BarberServiceOffering savedOffering =
                barberServiceOfferingRepository
                        .save(
                                offering
                        );

        return toResponse(
                savedOffering
        );
    }

    @Transactional
    public BarberServiceOfferingResponse deactivateOffering(
            Long barberId,
            Long serviceId
    ) {
        BarberServiceOffering offering =
                barberServiceOfferingRepository
                        .findByBarberIdAndServiceId(
                                barberId,
                                serviceId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Barber service offering not found"
                                )
                        );

        offering.setActive(
                false
        );

        BarberServiceOffering savedOffering =
                barberServiceOfferingRepository
                        .save(
                                offering
                        );

        return toResponse(
                savedOffering
        );
    }

    @Transactional
    public BarberServiceOfferingResponse deactivateMyOffering(
            String email,
            Long serviceId
    ) {
        Barber barber =
                getBarberByUserEmail(
                        email
                );

        Long barberId =
                barber.getId();

        BarberServiceOffering offering =
                barberServiceOfferingRepository
                        .findByBarberIdAndServiceId(
                                barberId,
                                serviceId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Barber service offering not found"
                                )
                        );

        offering.setActive(
                false
        );

        BarberServiceOffering savedOffering =
                barberServiceOfferingRepository
                        .save(
                                offering
                        );

        return toResponse(
                savedOffering
        );
    }

    @Transactional(readOnly = true)
    protected Barber getBarberByUserEmail(
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

    private BarberServiceOfferingResponse toResponse(
            BarberServiceOffering offering
    ) {
        Barber barber =
                offering.getBarber();

        ro.mihaifade.backend.entity.Service service =
                offering.getService();

        return new BarberServiceOfferingResponse(
                offering.getId(),
                barber.getId(),
                barber.getDisplayName(),
                service.getId(),
                service.getName(),
                service.getDescription(),
                offering.getPrice(),
                offering.getDurationMinutes(),
                offering.getActive()
        );
    }
}