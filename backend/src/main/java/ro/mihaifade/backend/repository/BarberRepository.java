package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.Barber;

public interface BarberRepository extends JpaRepository<Barber, Long> {
}