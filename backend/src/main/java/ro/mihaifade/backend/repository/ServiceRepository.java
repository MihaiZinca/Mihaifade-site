package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.Service;

public interface ServiceRepository extends JpaRepository<Service, Long> {

}