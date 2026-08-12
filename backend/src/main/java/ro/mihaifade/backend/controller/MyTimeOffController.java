package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.TimeOffRequest;
import ro.mihaifade.backend.dto.TimeOffResponse;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.service.BarberService;
import ro.mihaifade.backend.service.TimeOffService;

import java.util.List;

@RestController
@RequestMapping("/api/barbers/me/time-off")
public class MyTimeOffController {

    private final TimeOffService timeOffService;
    private final BarberService barberService;

    public MyTimeOffController(
            TimeOffService timeOffService,
            BarberService barberService
    ) {
        this.timeOffService = timeOffService;
        this.barberService = barberService;
    }

    @GetMapping
    public List<TimeOffResponse> getMyTimeOff(
            Authentication authentication
    ) {
        Barber barber =
                barberService.getBarberByUserEmail(
                        authentication.getName()
                );

        return timeOffService.getTimeOffForBarber(
                barber.getId()
        );
    }

    @PutMapping
    public TimeOffResponse setMyTimeOff(
            Authentication authentication,
            @Valid
            @RequestBody TimeOffRequest request
    ) {
        Barber barber =
                barberService.getBarberByUserEmail(
                        authentication.getName()
                );

        return timeOffService.setTimeOff(
                barber.getId(),
                request
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMyTimeOff(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Barber barber =
                barberService.getBarberByUserEmail(
                        authentication.getName()
                );

        timeOffService.deleteTimeOff(
                barber.getId(),
                id
        );
    }
}