package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.WorkingHours;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface WorkingHoursRepository
        extends JpaRepository<WorkingHours, Long> {

    List<WorkingHours> findByBarberId(
            Long barberId
    );

    Optional<WorkingHours>
    findByBarberIdAndDayOfWeek(
            Long barberId,
            DayOfWeek dayOfWeek
    );
}