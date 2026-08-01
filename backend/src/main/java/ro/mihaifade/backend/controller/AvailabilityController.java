package ro.mihaifade.backend.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ro.mihaifade.backend.dto.AvailabilityResponse;
import ro.mihaifade.backend.service.AvailabilityService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(
            AvailabilityService availabilityService
    ) {
        this.availabilityService = availabilityService;
    }

    @GetMapping
    public AvailabilityResponse getAvailability(
            @RequestParam Long barberId,
            @RequestParam Long serviceId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        return availabilityService.getAvailability(
                barberId,
                serviceId,
                date
        );
    }
}