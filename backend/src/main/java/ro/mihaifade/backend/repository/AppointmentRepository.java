package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.Appointment;
import ro.mihaifade.backend.entity.AppointmentStatus;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByBarberIdAndDate(Long barberId, LocalDate date);

    List<Appointment> findByBarberIdAndDateAndStatusNot(
            Long barberId,
            LocalDate date,
            AppointmentStatus status
    );

    List<Appointment> findByUserIdOrderByDateDescStartTimeDesc(Long userId);
}