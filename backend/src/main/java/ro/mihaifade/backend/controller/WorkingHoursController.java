package ro.mihaifade.backend.controller;

import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.WorkingHoursRequest;
import ro.mihaifade.backend.entity.WorkingHours;
import ro.mihaifade.backend.service.WorkingHoursService;

import java.util.List;

@RestController
@RequestMapping("/api/barbers/{barberId}/working-hours")
public class WorkingHoursController {

    private final WorkingHoursService workingHoursService;

    public WorkingHoursController(WorkingHoursService workingHoursService) {
        this.workingHoursService = workingHoursService;
    }

    @GetMapping
    public List<WorkingHours> getWorkingHours(
            @PathVariable Long barberId
    ) {
        return workingHoursService.getWorkingHoursForBarber(barberId);
    }

    @PutMapping
    public WorkingHours setWorkingHours(
            @PathVariable Long barberId,
            @RequestBody WorkingHoursRequest request
    ) {
        return workingHoursService.setWorkingHours(
                barberId,
                request.dayOfWeek(),
                request.startTime(),
                request.endTime(),
                request.active()
        );
    }

    @DeleteMapping("/{id}")
    public void deleteWorkingHours(
            @PathVariable Long barberId,
            @PathVariable Long id
    ) {
        workingHoursService.deleteWorkingHours(id);
    }
}