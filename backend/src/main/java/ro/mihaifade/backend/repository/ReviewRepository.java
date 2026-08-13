package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.Review;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository
        extends JpaRepository<Review, Long> {

    List<Review> findByActiveTrueOrderByCreatedAtDesc();

    List<Review> findAllByOrderByCreatedAtDesc();

    Optional<Review> findByUserId(
            Long userId
    );

    Optional<Review> findByUserIdAndActiveTrue(
            Long userId
    );

    boolean existsByUserId(
            Long userId
    );
}