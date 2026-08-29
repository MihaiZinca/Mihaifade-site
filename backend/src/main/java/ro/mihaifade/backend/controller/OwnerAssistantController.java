package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.*;
import ro.mihaifade.backend.service.OwnerAssistantService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/owner/assistant")
public class OwnerAssistantController {

    private final OwnerAssistantService ownerAssistantService;

    public OwnerAssistantController(
            OwnerAssistantService ownerAssistantService
    ) {
        this.ownerAssistantService = ownerAssistantService;
    }

    @GetMapping("/inactive-clients")
    public List<AssistantClientResponse> getInactiveClients(
            @RequestParam(defaultValue = "60") int days
    ) {
        return ownerAssistantService.getInactiveClients(days);
    }

    @GetMapping("/clients-by-visit-period")
    public List<AssistantClientResponse> getClientsByVisitPeriod(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        return ownerAssistantService.getClientsByVisitPeriod(
                startDate,
                endDate
        );
    }

    @GetMapping("/history")
    public List<AssistantCampaignResponse> getCampaignHistory() {
        return ownerAssistantService.getCampaignHistory();
    }

    @PostMapping("/notifications")
    public AssistantNotificationResponse sendNotification(
            @Valid @RequestBody AssistantNotificationRequest request
    ) {
        return ownerAssistantService.sendNotification(request);
    }

    @PostMapping("/discounts")
    public AssistantDiscountResponse createDiscountOffers(
            @Valid @RequestBody AssistantDiscountRequest request
    ) {
        return ownerAssistantService.createDiscountOffers(request);
    }
}