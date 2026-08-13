package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.ShopSettings;

import java.util.Optional;

public interface ShopSettingsRepository
        extends JpaRepository<ShopSettings, Long> {

    Optional<ShopSettings> findFirstByOrderByIdAsc();
}