package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.WorkingHoursRequest;
import ro.mihaifade.backend.dto.WorkingHoursResponse;
import ro.mihaifade.backend.service.WorkingHoursService;

import java.util.List;

@RestController
@RequestMapping("/api/barbers/{barberId}/working-hours")
public class WorkingHoursController {

    private final WorkingHoursService workingHoursService;

    public WorkingHoursController(
            WorkingHoursService workingHoursService
    ) {
        this.workingHoursService =
                workingHoursService;
    }

    @GetMapping
    public List<WorkingHoursResponse> getWorkingHours(
            @PathVariable Long barberId
    ) {
        return workingHoursService
                .getWorkingHoursForBarber(
                        barberId
                );
    }

    @PutMapping
    public WorkingHoursResponse setWorkingHours(
            @PathVariable Long barberId,
            @Valid
            @RequestBody WorkingHoursRequest request
    ) {
        return workingHoursService
                .setWorkingHours(
                        barberId,
                        request
                );
    }
}