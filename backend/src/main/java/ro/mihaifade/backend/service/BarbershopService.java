package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.repository.AppointmentRepository;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.ServiceRepository;

import java.util.List;

@Service
public class BarbershopService {

    private final ServiceRepository serviceRepository;
    private final AppointmentRepository appointmentRepository;
    private final BarberRepository barberRepository;

    public BarbershopService(
            ServiceRepository serviceRepository,
            AppointmentRepository appointmentRepository,
            BarberRepository barberRepository
    ) {
        this.serviceRepository = serviceRepository;
        this.appointmentRepository = appointmentRepository;
        this.barberRepository = barberRepository;
    }

    public List<ro.mihaifade.backend.entity.Service> getAllServices() {
        return serviceRepository.findAll();
    }

    public ro.mihaifade.backend.entity.Service getServiceById(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Service not found with id: " + id
                        )
                );
    }

    public ro.mihaifade.backend.entity.Service createService(
            ro.mihaifade.backend.entity.Service service
    ) {
        if (serviceRepository.existsByNameIgnoreCase(service.getName())) {
            throw new RuntimeException(
                    "A service with this name already exists"
            );
        }

        return serviceRepository.save(service);
    }

    public ro.mihaifade.backend.entity.Service updateService(
            Long id,
            ro.mihaifade.backend.entity.Service updatedService
    ) {
        ro.mihaifade.backend.entity.Service existingService =
                getServiceById(id);

        existingService.setName(updatedService.getName());
        existingService.setDescription(updatedService.getDescription());
        existingService.setPrice(updatedService.getPrice());
        existingService.setDurationMinutes(updatedService.getDurationMinutes());
        existingService.setActive(updatedService.getActive());

        return serviceRepository.save(existingService);
    }

    public void deleteService(Long id) {
        ro.mihaifade.backend.entity.Service service =
                getServiceById(id);

        service.setActive(false);

        serviceRepository.save(service);
    }

    public void deleteServicePermanently(Long id) {
        ro.mihaifade.backend.entity.Service service =
                getServiceById(id);

        if (appointmentRepository.existsByServiceId(id)) {
            throw new RuntimeException(
                    "Service cannot be permanently deleted because it is used by appointments"
            );
        }

        List<Barber> barbers =
                barberRepository.findByServicesId(id);

        for (Barber barber : barbers) {
            barber.getServices().removeIf(
                    barberService ->
                            barberService.getId().equals(id)
            );
        }

        barberRepository.saveAll(barbers);

        serviceRepository.delete(service);
    }
}