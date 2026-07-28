package ro.mihaifade.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.service.BarberService;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/barbers")
public class BarberController {

    private final BarberService barberService;

    public BarberController(BarberService barberService) {
        this.barberService = barberService;
    }

    @GetMapping
    public List<Barber> getAllBarbers() {
        return barberService.getAllBarbers();
    }

    @GetMapping("/{id}")
    public Barber getBarberById(@PathVariable Long id) {
        return barberService.getBarberById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Barber createBarber(@RequestBody Barber barber) {
        return barberService.createBarber(barber);
    }

    @PutMapping("/{id}")
    public Barber updateBarber(
            @PathVariable Long id,
            @RequestBody Barber barber
    ) {
        return barberService.updateBarber(id, barber);
    }

    @PutMapping("/{id}/services")
    public Barber assignServices(
            @PathVariable Long id,
            @RequestBody Set<Long> serviceIds
    ) {
        return barberService.assignServices(id, serviceIds);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBarber(@PathVariable Long id) {
        barberService.deleteBarber(id);
    }
}