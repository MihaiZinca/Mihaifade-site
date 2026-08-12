package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.CreateBarberAccountRequest;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.service.BarberService;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/barbers")
public class BarberController {

    private final BarberService barberService;

    public BarberController(
            BarberService barberService
    ) {
        this.barberService = barberService;
    }

    @GetMapping
    public List<Barber> getAllBarbers() {
        return barberService.getAllBarbers();
    }

    @GetMapping("/me")
    public Barber getMyBarberProfile(
            Authentication authentication
    ) {
        return barberService.getBarberByUserEmail(
                authentication.getName()
        );
    }

    @GetMapping("/{id}")
    public Barber getBarberById(
            @PathVariable Long id
    ) {
        return barberService.getBarberById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Barber createBarber(
            @Valid
            @RequestBody Barber barber
    ) {
        return barberService.createBarber(
                barber
        );
    }

    @PostMapping("/account")
    @ResponseStatus(HttpStatus.CREATED)
    public Barber createBarberAccount(
            @Valid
            @RequestBody CreateBarberAccountRequest request
    ) {
        return barberService.createBarberAccount(
                request
        );
    }

    @PutMapping("/me")
    public Barber updateMyBarberProfile(
            @Valid
            @RequestBody Barber barber,
            Authentication authentication
    ) {
        return barberService.updateMyBarberProfile(
                authentication.getName(),
                barber
        );
    }

    @PutMapping("/me/services")
    public Barber assignMyServices(
            @RequestBody Set<Long> serviceIds,
            Authentication authentication
    ) {
        return barberService.assignMyServices(
                authentication.getName(),
                serviceIds
        );
    }

    @PutMapping("/{id}")
    public Barber updateBarber(
            @PathVariable Long id,
            @Valid
            @RequestBody Barber barber
    ) {
        return barberService.updateBarber(
                id,
                barber
        );
    }

    @PutMapping("/{id}/services")
    public Barber assignServices(
            @PathVariable Long id,
            @RequestBody Set<Long> serviceIds
    ) {
        return barberService.assignServices(
                id,
                serviceIds
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateBarber(
            @PathVariable Long id
    ) {
        barberService.deactivateBarber(
                id
        );
    }
}