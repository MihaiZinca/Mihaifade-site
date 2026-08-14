package ro.mihaifade.backend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ro.mihaifade.backend.dto.BarberStatsResponse;
import ro.mihaifade.backend.service.BarberStatsService;

@RestController
@RequestMapping("/api/barbers")
public class BarberStatsController {

    private final BarberStatsService barberStatsService;

    public BarberStatsController(
            BarberStatsService barberStatsService
    ) {
        this.barberStatsService =
                barberStatsService;
    }

    @GetMapping("/me/stats")
    public BarberStatsResponse getMyStats(
            Authentication authentication
    ) {
        return barberStatsService.getMyStats(
                authentication.getName()
        );
    }

    @GetMapping("/{barberId}/stats")
    public BarberStatsResponse getBarberStats(
            @PathVariable Long barberId
    ) {
        return barberStatsService.getStatsForBarber(
                barberId
        );
    }
}