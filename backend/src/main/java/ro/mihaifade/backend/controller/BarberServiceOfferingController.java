package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.BarberServiceOfferingRequest;
import ro.mihaifade.backend.dto.BarberServiceOfferingResponse;
import ro.mihaifade.backend.service.BarberServiceOfferingService;

import java.util.List;

@RestController
@RequestMapping("/api/barber-service-offerings")
public class BarberServiceOfferingController {

    private final BarberServiceOfferingService barberServiceOfferingService;

    public BarberServiceOfferingController(
            BarberServiceOfferingService barberServiceOfferingService
    ) {
        this.barberServiceOfferingService =
                barberServiceOfferingService;
    }

    @GetMapping("/barber/{barberId}")
    public List<BarberServiceOfferingResponse> getOfferingsForBarber(
            @PathVariable Long barberId
    ) {
        return barberServiceOfferingService
                .getOfferingsForBarber(
                        barberId
                );
    }

    @GetMapping("/barber/{barberId}/active")
    public List<BarberServiceOfferingResponse> getActiveOfferingsForBarber(
            @PathVariable Long barberId
    ) {
        return barberServiceOfferingService
                .getActiveOfferingsForBarber(
                        barberId
                );
    }

    @GetMapping("/me")
    public List<BarberServiceOfferingResponse> getMyOfferings(
            Authentication authentication
    ) {
        return barberServiceOfferingService
                .getMyOfferings(
                        authentication.getName()
                );
    }

    @PutMapping("/barber/{barberId}")
    public BarberServiceOfferingResponse saveOffering(
            @PathVariable Long barberId,
            @Valid
            @RequestBody BarberServiceOfferingRequest request
    ) {
        return barberServiceOfferingService
                .saveOffering(
                        barberId,
                        request
                );
    }

    @PutMapping("/me")
    public BarberServiceOfferingResponse saveMyOffering(
            @Valid
            @RequestBody BarberServiceOfferingRequest request,
            Authentication authentication
    ) {
        return barberServiceOfferingService
                .saveMyOffering(
                        authentication.getName(),
                        request
                );
    }

    @PutMapping("/barber/{barberId}/services/{serviceId}/deactivate")
    public BarberServiceOfferingResponse deactivateOffering(
            @PathVariable Long barberId,
            @PathVariable Long serviceId
    ) {
        return barberServiceOfferingService
                .deactivateOffering(
                        barberId,
                        serviceId
                );
    }

    @PutMapping("/me/services/{serviceId}/deactivate")
    public BarberServiceOfferingResponse deactivateMyOffering(
            @PathVariable Long serviceId,
            Authentication authentication
    ) {
        return barberServiceOfferingService
                .deactivateMyOffering(
                        authentication.getName(),
                        serviceId
                );
    }
}