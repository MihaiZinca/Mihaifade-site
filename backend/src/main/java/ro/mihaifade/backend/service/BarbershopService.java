package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.repository.ServiceRepository;

import java.util.List;

@Service
public class BarbershopService {

    private final ServiceRepository serviceRepository;

    public BarbershopService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    public List<ro.mihaifade.backend.entity.Service> getAllServices() {
        return serviceRepository.findAll();
    }

    public ro.mihaifade.backend.entity.Service getServiceById(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
    }

    public ro.mihaifade.backend.entity.Service createService(
            ro.mihaifade.backend.entity.Service service
    ) {
        return serviceRepository.save(service);
    }

    public ro.mihaifade.backend.entity.Service updateService(
            Long id,
            ro.mihaifade.backend.entity.Service updatedService
    ) {

        ro.mihaifade.backend.entity.Service existingService =
                serviceRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Service not found"));

        existingService.setName(updatedService.getName());
        existingService.setDescription(updatedService.getDescription());
        existingService.setPrice(updatedService.getPrice());
        existingService.setDurationMinutes(updatedService.getDurationMinutes());
        existingService.setActive(updatedService.getActive());

        return serviceRepository.save(existingService);
    }

    public void deleteService(Long id) {

        if (!serviceRepository.existsById(id)) {
            throw new RuntimeException("Service not found");
        }

        serviceRepository.deleteById(id);
    }
}