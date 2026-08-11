package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.Barber;

import java.util.List;
import java.util.Optional;

public interface BarberRepository extends JpaRepository<Barber, Long> {

    Optional<Barber> findByDisplayNameIgnoreCase(
            String displayName
    );

    List<Barber> findByServicesId(
            Long serviceId
    );
}