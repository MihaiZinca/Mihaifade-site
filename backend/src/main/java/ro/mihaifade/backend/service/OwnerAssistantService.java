package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.*;
import ro.mihaifade.backend.entity.*;
import ro.mihaifade.backend.repository.AppointmentRepository;
import ro.mihaifade.backend.repository.AssistantCampaignRepository;
import ro.mihaifade.backend.repository.ClientOfferRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class OwnerAssistantService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final PushNotificationService pushNotificationService;
    private final ClientOfferRepository clientOfferRepository;
    private final AssistantCampaignRepository assistantCampaignRepository;

    public OwnerAssistantService(
            UserRepository userRepository,
            AppointmentRepository appointmentRepository,
            PushNotificationService pushNotificationService,
            ClientOfferRepository clientOfferRepository,
            AssistantCampaignRepository assistantCampaignRepository
    ) {
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.pushNotificationService = pushNotificationService;
        this.clientOfferRepository = clientOfferRepository;
        this.assistantCampaignRepository = assistantCampaignRepository;
    }

    public List<AssistantClientResponse> getInactiveClients(
            int inactiveDays
    ) {
        if (inactiveDays < 1) {
            throw new IllegalArgumentException(
                    "Perioada de inactivitate trebuie să fie de cel puțin o zi."
            );
        }

        LocalDate cutoffDate =
                LocalDate.now().minusDays(inactiveDays);

        List<User> clients =
                userRepository.findAll()
                        .stream()
                        .filter(user ->
                                user.getRole() == Role.CLIENT
                        )
                        .filter(user ->
                                Boolean.TRUE.equals(
                                        user.getActive()
                                )
                        )
                        .toList();

        List<Appointment> completedAppointments =
                appointmentRepository
                        .findByStatusOrderByDateDescStartTimeDesc(
                                AppointmentStatus.COMPLETED
                        );

        Map<Long, List<Appointment>> appointmentsByUser =
                new LinkedHashMap<>();

        for (Appointment appointment : completedAppointments) {
            if (appointment.getUser() == null) {
                continue;
            }

            Long userId =
                    appointment.getUser().getId();

            appointmentsByUser
                    .computeIfAbsent(
                            userId,
                            ignored -> new ArrayList<>()
                    )
                    .add(appointment);
        }

        List<AssistantClientResponse> result =
                new ArrayList<>();

        for (User client : clients) {
            List<Appointment> clientAppointments =
                    appointmentsByUser.getOrDefault(
                            client.getId(),
                            List.of()
                    );

            if (clientAppointments.isEmpty()) {
                continue;
            }

            LocalDate lastVisitDate =
                    clientAppointments.get(0).getDate();

            if (lastVisitDate.isAfter(cutoffDate)) {
                continue;
            }

            result.add(
                    new AssistantClientResponse(
                            client.getId(),
                            client.getFirstName(),
                            client.getLastName(),
                            client.getEmail(),
                            client.getPhone(),
                            lastVisitDate,
                            clientAppointments.size()
                    )
            );
        }

        result.sort(
                Comparator.comparing(
                        AssistantClientResponse::lastVisitDate
                )
        );

        return result;
    }

    public List<AssistantClientResponse> getClientsByVisitPeriod(
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Data de început și data de sfârșit sunt obligatorii."
            );
        }

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Data de început nu poate fi după data de sfârșit."
            );
        }

        List<Appointment> appointments =
                appointmentRepository
                        .findByDateBetweenOrderByDateDescStartTimeDesc(
                                startDate,
                                endDate
                        )
                        .stream()
                        .filter(appointment ->
                                appointment.getStatus()
                                        == AppointmentStatus.COMPLETED
                        )
                        .toList();

        Map<Long, List<Appointment>> appointmentsByUser =
                new LinkedHashMap<>();

        for (Appointment appointment : appointments) {
            if (appointment.getUser() == null) {
                continue;
            }

            Long userId =
                    appointment.getUser().getId();

            appointmentsByUser
                    .computeIfAbsent(
                            userId,
                            ignored -> new ArrayList<>()
                    )
                    .add(appointment);
        }

        List<AssistantClientResponse> result =
                new ArrayList<>();

        for (List<Appointment> clientAppointments
                : appointmentsByUser.values()) {

            Appointment latestAppointment =
                    clientAppointments.get(0);

            User client =
                    latestAppointment.getUser();

            result.add(
                    new AssistantClientResponse(
                            client.getId(),
                            client.getFirstName(),
                            client.getLastName(),
                            client.getEmail(),
                            client.getPhone(),
                            latestAppointment.getDate(),
                            clientAppointments.size()
                    )
            );
        }

        result.sort(
                Comparator.comparing(
                        AssistantClientResponse::lastVisitDate
                ).reversed()
        );

        return result;
    }

    public AssistantNotificationResponse sendNotification(
            AssistantNotificationRequest request
    ) {
        List<Long> uniqueUserIds =
                request.userIds()
                        .stream()
                        .distinct()
                        .toList();

        List<User> users =
                userRepository.findAllById(
                        uniqueUserIds
                );

        List<User> clients =
                users.stream()
                        .filter(user ->
                                user.getRole() == Role.CLIENT
                        )
                        .filter(user ->
                                Boolean.TRUE.equals(
                                        user.getActive()
                                )
                        )
                        .toList();

        int notifiedClients = 0;
        int sentNotifications = 0;

        for (User client : clients) {
            int sent =
                    pushNotificationService.sendToUser(
                            client.getEmail(),
                            request.title().trim(),
                            request.message().trim()
                    );

            if (sent > 0) {
                notifiedClients++;
                sentNotifications += sent;
            }
        }

        AssistantCampaign campaign =
                new AssistantCampaign();

        campaign.setType(
                AssistantCampaignType.NOTIFICATION
        );
        campaign.setTitle(
                request.title().trim()
        );
        campaign.setMessage(
                request.message().trim()
        );
        campaign.setSelectedClients(
                uniqueUserIds.size()
        );
        campaign.setNotifiedClients(
                notifiedClients
        );
        campaign.setSentNotifications(
                sentNotifications
        );
        campaign.setCreatedOffers(null);
        campaign.setDiscountPercent(null);
        campaign.setValidDays(null);

        assistantCampaignRepository.save(campaign);

        return new AssistantNotificationResponse(
                uniqueUserIds.size(),
                notifiedClients,
                clients.size() - notifiedClients,
                sentNotifications
        );
    }

    public AssistantDiscountResponse createDiscountOffers(
            AssistantDiscountRequest request
    ) {
        List<Long> uniqueUserIds =
                request.userIds()
                        .stream()
                        .distinct()
                        .toList();

        List<User> clients =
                userRepository.findAllById(
                                uniqueUserIds
                        )
                        .stream()
                        .filter(user ->
                                user.getRole() == Role.CLIENT
                        )
                        .filter(user ->
                                Boolean.TRUE.equals(
                                        user.getActive()
                                )
                        )
                        .toList();

        LocalDateTime expiresAt =
                LocalDateTime.now()
                        .plusDays(
                                request.validDays()
                        );

        List<ClientOffer> offers =
                new ArrayList<>();

        for (User client : clients) {
            ClientOffer offer =
                    new ClientOffer();

            offer.setUser(client);
            offer.setDiscountPercent(
                    request.discountPercent()
            );
            offer.setExpiresAt(
                    expiresAt
            );
            offer.setUsed(false);

            offers.add(offer);
        }

        clientOfferRepository.saveAll(offers);

        AssistantCampaign campaign =
                new AssistantCampaign();

        campaign.setType(
                AssistantCampaignType.DISCOUNT
        );
        campaign.setTitle(null);
        campaign.setMessage(null);
        campaign.setSelectedClients(
                uniqueUserIds.size()
        );
        campaign.setNotifiedClients(null);
        campaign.setSentNotifications(null);
        campaign.setCreatedOffers(
                offers.size()
        );
        campaign.setDiscountPercent(
                request.discountPercent()
        );
        campaign.setValidDays(
                request.validDays()
        );

        assistantCampaignRepository.save(campaign);

        return new AssistantDiscountResponse(
                uniqueUserIds.size(),
                offers.size(),
                request.discountPercent(),
                expiresAt
        );
    }

    public List<AssistantCampaignResponse> getCampaignHistory() {
        return assistantCampaignRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(campaign ->
                        new AssistantCampaignResponse(
                                campaign.getId(),
                                campaign.getType(),
                                campaign.getTitle(),
                                campaign.getMessage(),
                                campaign.getSelectedClients(),
                                campaign.getNotifiedClients(),
                                campaign.getSentNotifications(),
                                campaign.getCreatedOffers(),
                                campaign.getDiscountPercent(),
                                campaign.getValidDays(),
                                campaign.getCreatedAt()
                        )
                )
                .toList();
    }
}