package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.TimeOff;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TimeOffRepository
        extends JpaRepository<TimeOff, Long> {

    List<TimeOff> findByBarberIdOrderByDateAsc(
            Long barberId
    );

    Optional<TimeOff> findByBarberIdAndDate(
            Long barberId,
            LocalDate date
    );
}