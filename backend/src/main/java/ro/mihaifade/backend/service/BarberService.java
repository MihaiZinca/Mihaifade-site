package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.ServiceRepository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BarberService {

    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;

    public BarberService(
            BarberRepository barberRepository,
            ServiceRepository serviceRepository
    ) {
        this.barberRepository = barberRepository;
        this.serviceRepository = serviceRepository;
    }

    public List<Barber> getAllBarbers() {
        return barberRepository.findAll();
    }

    public Barber getBarberById(Long id) {
        return barberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Barber not found"));
    }

    public Barber createBarber(Barber barber) {
        return barberRepository.save(barber);
    }

    public Barber updateBarber(Long id, Barber updatedBarber) {
        Barber existingBarber = barberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Barber not found"));

        existingBarber.setDisplayName(updatedBarber.getDisplayName());
        existingBarber.setBio(updatedBarber.getBio());
        existingBarber.setImageUrl(updatedBarber.getImageUrl());
        existingBarber.setActive(updatedBarber.getActive());

        return barberRepository.save(existingBarber);
    }

    public Barber assignServices(Long barberId, Set<Long> serviceIds) {
        Barber barber = barberRepository.findById(barberId)
                .orElseThrow(() -> new RuntimeException("Barber not found"));

        Set<ro.mihaifade.backend.entity.Service> services =
                serviceIds.stream()
                        .map(serviceId -> serviceRepository.findById(serviceId)
                                .orElseThrow(() -> new RuntimeException(
                                        "Service not found: " + serviceId
                                )))
                        .collect(Collectors.toSet());

        barber.setServices(services);

        return barberRepository.save(barber);
    }

    public void deleteBarber(Long id) {
        if (!barberRepository.existsById(id)) {
            throw new RuntimeException("Barber not found");
        }

        barberRepository.deleteById(id);
    }
}