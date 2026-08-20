package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.Appointment;
import ro.mihaifade.backend.entity.AppointmentStatus;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByBarberIdAndDate(
            Long barberId,
            LocalDate date
    );

    List<Appointment> findByBarberIdAndDateAndStatusNot(
            Long barberId,
            LocalDate date,
            AppointmentStatus status
    );

    List<Appointment> findByUserIdOrderByDateDescStartTimeDesc(
            Long userId
    );

    boolean existsByServiceId(
            Long serviceId
    );

    boolean existsByBarberId(
            Long barberId
    );

    List<Appointment> findByBarberIdOrderByDateDescStartTimeDesc(
            Long barberId
    );

    List<Appointment> findByDateAndReminder24hSentFalseAndStatusNot(
            LocalDate date,
            AppointmentStatus status
    );

    List<Appointment> findByDateAndReminder2hSentFalseAndStatusNot(
            LocalDate date,
            AppointmentStatus status
    );

    List<Appointment> findByDateBetweenAndReminder24hSentFalseAndStatusNot(
            LocalDate startDate,
            LocalDate endDate,
            AppointmentStatus status
    );

    List<Appointment> findByDateBetweenAndReminder2hSentFalseAndStatusNot(
            LocalDate startDate,
            LocalDate endDate,
            AppointmentStatus status
    );
}