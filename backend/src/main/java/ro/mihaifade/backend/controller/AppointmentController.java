package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.AppointmentRequest;
import ro.mihaifade.backend.dto.AppointmentResponse;
import ro.mihaifade.backend.entity.AppointmentStatus;
import ro.mihaifade.backend.service.AppointmentService;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/me")
    public List<AppointmentResponse> getMyAppointments(Authentication authentication) {
        return appointmentService.getMyAppointments(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            Authentication authentication
    ) {
        return appointmentService.createAppointment(
                request,
                authentication.getName()
        );
    }

    @PutMapping("/{id}/cancel")
    public AppointmentResponse cancelMyAppointment(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return appointmentService.cancelMyAppointment(
                id,
                authentication.getName()
        );
    }

    @PutMapping("/{id}/status")
    public AppointmentResponse updateStatus(
            @PathVariable Long id,
            @RequestParam AppointmentStatus status
    ) {
        return appointmentService.updateStatus(id, status);
    }
}