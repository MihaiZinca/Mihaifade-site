package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.entity.Service;
import ro.mihaifade.backend.service.BarbershopService;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final BarbershopService barbershopService;

    public ServiceController(
            BarbershopService barbershopService
    ) {
        this.barbershopService = barbershopService;
    }

    @GetMapping
    public List<Service> getAllServices() {
        return barbershopService.getAllServices();
    }

    @GetMapping("/{id}")
    public Service getServiceById(
            @PathVariable Long id
    ) {
        return barbershopService.getServiceById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Service createService(
            @Valid @RequestBody Service service
    ) {
        return barbershopService.createService(service);
    }

    @PutMapping("/{id}")
    public Service updateService(
            @PathVariable Long id,
            @Valid @RequestBody Service service
    ) {
        return barbershopService.updateService(id, service);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteService(
            @PathVariable Long id
    ) {
        barbershopService.deleteService(id);
    }
}