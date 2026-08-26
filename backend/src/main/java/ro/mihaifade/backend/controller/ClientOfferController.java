package ro.mihaifade.backend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.ClientOfferResponse;
import ro.mihaifade.backend.service.ClientOfferService;

import java.util.List;

@RestController
@RequestMapping("/api/client-offers")
public class ClientOfferController {

    private final ClientOfferService clientOfferService;

    public ClientOfferController(
            ClientOfferService clientOfferService
    ) {
        this.clientOfferService = clientOfferService;
    }

    @GetMapping("/barber/appointments/{appointmentId}")
    public List<ClientOfferResponse> getActiveOffersForBarberAppointment(
            @PathVariable Long appointmentId,
            Authentication authentication
    ) {
        return clientOfferService
                .getActiveOffersForBarberAppointment(
                        appointmentId,
                        authentication.getName()
                );
    }

    @PutMapping("/barber/appointments/{appointmentId}/offers/{offerId}/use")
    public ClientOfferResponse markOfferAsUsedByBarber(
            @PathVariable Long appointmentId,
            @PathVariable Long offerId,
            Authentication authentication
    ) {
        return clientOfferService
                .markOfferAsUsedByBarber(
                        appointmentId,
                        offerId,
                        authentication.getName()
                );
    }
}