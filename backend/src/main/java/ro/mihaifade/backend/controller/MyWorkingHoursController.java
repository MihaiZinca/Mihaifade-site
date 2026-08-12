package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.WorkingHoursRequest;
import ro.mihaifade.backend.dto.WorkingHoursResponse;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.service.BarberService;
import ro.mihaifade.backend.service.WorkingHoursService;

import java.util.List;

@RestController
@RequestMapping("/api/barbers/me/working-hours")
public class MyWorkingHoursController {

    private final WorkingHoursService workingHoursService;
    private final BarberService barberService;

    public MyWorkingHoursController(
            WorkingHoursService workingHoursService,
            BarberService barberService
    ) {
        this.workingHoursService = workingHoursService;
        this.barberService = barberService;
    }

    @GetMapping
    public List<WorkingHoursResponse> getMyWorkingHours(
            Authentication authentication
    ) {
        Barber barber =
                barberService.getBarberByUserEmail(
                        authentication.getName()
                );

        return workingHoursService.getWorkingHoursForBarber(
                barber.getId()
        );
    }

    @PutMapping
    public WorkingHoursResponse setMyWorkingHours(
            Authentication authentication,
            @Valid
            @RequestBody WorkingHoursRequest request
    ) {
        Barber barber =
                barberService.getBarberByUserEmail(
                        authentication.getName()
                );

        return workingHoursService.setWorkingHours(
                barber.getId(),
                request
        );
    }
}