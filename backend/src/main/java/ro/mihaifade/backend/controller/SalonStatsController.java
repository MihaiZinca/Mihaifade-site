package ro.mihaifade.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ro.mihaifade.backend.dto.SalonStatsResponse;
import ro.mihaifade.backend.service.SalonStatsService;

@RestController
@RequestMapping("/api/admin/stats")
public class SalonStatsController {

    private final SalonStatsService salonStatsService;

    public SalonStatsController(
            SalonStatsService salonStatsService
    ) {
        this.salonStatsService =
                salonStatsService;
    }

    @GetMapping
    public SalonStatsResponse getSalonStats() {
        return salonStatsService.getSalonStats();
    }
}