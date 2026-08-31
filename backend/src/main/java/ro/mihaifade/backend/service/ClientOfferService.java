package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.dto.ClientOfferResponse;
import ro.mihaifade.backend.entity.Appointment;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.entity.ClientOffer;
import ro.mihaifade.backend.repository.AppointmentRepository;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.ClientOfferRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClientOfferService {

    private final ClientOfferRepository clientOfferRepository;
    private final AppointmentRepository appointmentRepository;
    private final BarberRepository barberRepository;

    public ClientOfferService(
            ClientOfferRepository clientOfferRepository,
            AppointmentRepository appointmentRepository,
            BarberRepository barberRepository
    ) {
        this.clientOfferRepository = clientOfferRepository;
        this.appointmentRepository = appointmentRepository;
        this.barberRepository = barberRepository;
    }

    public List<ClientOfferResponse> getActiveOffersForBarberAppointment(
            Long appointmentId,
            String barberEmail
    ) {
        Appointment appointment =
                getAppointmentForAuthenticatedBarber(
                        appointmentId,
                        barberEmail
                );

        if (appointment.getUser() == null) {
            return List.of();
        }

        return clientOfferRepository
                .findByUserIdAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        appointment.getUser().getId(),
                        LocalDateTime.now()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ClientOfferResponse markOfferAsUsedByBarber(
            Long appointmentId,
            Long offerId,
            String barberEmail
    ) {
        Appointment appointment =
                getAppointmentForAuthenticatedBarber(
                        appointmentId,
                        barberEmail
                );

        if (appointment.getUser() == null) {
            throw new RuntimeException(
                    "Guest appointments do not have client offers"
            );
        }

        ClientOffer offer =
                clientOfferRepository
                        .findById(offerId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Offer not found"
                                )
                        );

        if (!offer.getUser().getId().equals(
                appointment.getUser().getId()
        )) {
            throw new RuntimeException(
                    "Offer does not belong to this client"
            );
        }

        if (Boolean.TRUE.equals(offer.getUsed())) {
            throw new RuntimeException(
                    "Offer already used"
            );
        }

        if (!offer.getExpiresAt().isAfter(
                LocalDateTime.now()
        )) {
            throw new RuntimeException(
                    "Offer expired"
            );
        }

        offer.setUsed(true);
        offer.setUsedAt(LocalDateTime.now());

        ClientOffer savedOffer =
                clientOfferRepository.save(offer);

        return toResponse(savedOffer);
    }

    private Appointment getAppointmentForAuthenticatedBarber(
            Long appointmentId,
            String barberEmail
    ) {
        Barber barber =
                barberRepository
                        .findByUserEmailIgnoreCase(barberEmail)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Barber not found"
                                )
                        );

        Appointment appointment =
                appointmentRepository
                        .findById(appointmentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Appointment not found"
                                )
                        );

        if (!appointment.getBarber().getId().equals(
                barber.getId()
        )) {
            throw new RuntimeException(
                    "Appointment does not belong to this barber"
            );
        }

        return appointment;
    }

    private ClientOfferResponse toResponse(
            ClientOffer offer
    ) {
        return new ClientOfferResponse(
                offer.getId(),
                offer.getDiscountPercent(),
                offer.getCreatedAt(),
                offer.getExpiresAt(),
                offer.getUsed(),
                offer.getUsedAt()
        );
    }
}