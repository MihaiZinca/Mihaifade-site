package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.BarberServiceOffering;

import java.util.List;
import java.util.Optional;

public interface BarberServiceOfferingRepository
        extends JpaRepository<BarberServiceOffering, Long> {

    List<BarberServiceOffering> findByBarberIdOrderByServiceNameAsc(
            Long barberId
    );

    List<BarberServiceOffering> findByBarberIdAndActiveTrueOrderByServiceNameAsc(
            Long barberId
    );

    Optional<BarberServiceOffering> findByBarberIdAndServiceId(
            Long barberId,
            Long serviceId
    );

    boolean existsByBarberIdAndServiceId(
            Long barberId,
            Long serviceId
    );

    void deleteByBarberId(
            Long barberId
    );

    void deleteByServiceId(
            Long serviceId
    );
}