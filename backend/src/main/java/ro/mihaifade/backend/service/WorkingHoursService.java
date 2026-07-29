package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.entity.WorkingHours;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.WorkingHoursRepository;

import java.time.DayOfWeek;
import java.time.LocalTime;
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

    public List<WorkingHours> getWorkingHoursForBarber(Long barberId) {
        return workingHoursRepository.findByBarberIdOrderByDayOfWeek(barberId);
    }

    public WorkingHours setWorkingHours(
            Long barberId,
            DayOfWeek dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            Boolean active
    ) {
        Barber barber = barberRepository.findById(barberId)
                .orElseThrow(() -> new RuntimeException("Barber not found"));

        WorkingHours workingHours =
                workingHoursRepository
                        .findByBarberIdAndDayOfWeek(barberId, dayOfWeek)
                        .orElseGet(WorkingHours::new);

        workingHours.setBarber(barber);
        workingHours.setDayOfWeek(dayOfWeek);
        workingHours.setStartTime(startTime);
        workingHours.setEndTime(endTime);
        workingHours.setActive(active);

        return workingHoursRepository.save(workingHours);
    }

    public void deleteWorkingHours(Long id) {
        if (!workingHoursRepository.existsById(id)) {
            throw new RuntimeException("Working hours not found");
        }

        workingHoursRepository.deleteById(id);
    }
}