package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.TimeOffRequest;
import ro.mihaifade.backend.dto.TimeOffResponse;
import ro.mihaifade.backend.service.TimeOffService;

import java.util.List;

@RestController
@RequestMapping("/api/barbers/{barberId}/time-off")
public class TimeOffController {

    private final TimeOffService timeOffService;

    public TimeOffController(
            TimeOffService timeOffService
    ) {
        this.timeOffService =
                timeOffService;
    }

    @GetMapping
    public List<TimeOffResponse> getTimeOff(
            @PathVariable Long barberId
    ) {
        return timeOffService
                .getTimeOffForBarber(
                        barberId
                );
    }

    @PutMapping
    public TimeOffResponse setTimeOff(
            @PathVariable Long barberId,
            @Valid
            @RequestBody TimeOffRequest request
    ) {
        return timeOffService
                .setTimeOff(
                        barberId,
                        request
                );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTimeOff(
            @PathVariable Long barberId,
            @PathVariable Long id
    ) {
        timeOffService
                .deleteTimeOff(
                        barberId,
                        id
                );
    }
}