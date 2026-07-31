package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.WorkingHoursRequest;
import ro.mihaifade.backend.dto.WorkingHoursResponse;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.entity.WorkingHours;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.WorkingHoursRepository;

import java.util.Comparator;
import java.util.List;

@Service
public class WorkingHoursService {

    private final WorkingHoursRepository workingHoursRepository;
    private final BarberRepository barberRepository;

    public WorkingHoursService(
            WorkingHoursRepository workingHoursRepository,
            BarberRepository barberRepository
    ) {
        this.workingHoursRepository = workingHoursRepository;
        this.barberRepository = barberRepository;
    }

    public List<WorkingHoursResponse> getWorkingHoursForBarber(Long barberId) {
        if (!barberRepository.existsById(barberId)) {
            throw new RuntimeException(
                    "Barber not found with id: " + barberId
            );
        }

        return workingHoursRepository.findByBarberId(barberId)
                .stream()
                .sorted(
                        Comparator.comparingInt(
                                workingHours ->
                                        workingHours.getDayOfWeek().getValue()
                        )
                )
                .map(this::toResponse)
                .toList();
    }

    public WorkingHoursResponse setWorkingHours(
            Long barberId,
            WorkingHoursRequest request
    ) {
        Barber barber = barberRepository.findById(barberId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Barber not found with id: " + barberId
                        )
                );

        if (request.active()
                && !request.startTime().isBefore(request.endTime())) {
            throw new RuntimeException(
                    "Start time must be before end time"
            );
        }

        WorkingHours workingHours =
                workingHoursRepository.findByBarberIdAndDayOfWeek(
                                barberId,
                                request.dayOfWeek()
                        )
                        .orElseGet(WorkingHours::new);

        workingHours.setBarber(barber);
        workingHours.setDayOfWeek(request.dayOfWeek());
        workingHours.setStartTime(request.startTime());
        workingHours.setEndTime(request.endTime());
        workingHours.setActive(request.active());

        WorkingHours saved =
                workingHoursRepository.save(workingHours);

        return toResponse(saved);
    }

    private WorkingHoursResponse toResponse(
            WorkingHours workingHours
    ) {
        return new WorkingHoursResponse(
                workingHours.getId(),
                workingHours.getDayOfWeek(),
                workingHours.getStartTime(),
                workingHours.getEndTime(),
                workingHours.getActive()
        );
    }
}