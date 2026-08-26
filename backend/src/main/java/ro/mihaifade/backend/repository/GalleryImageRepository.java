package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.GalleryImage;

import java.util.List;

public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {

    List<GalleryImage> findAllByOrderByDisplayOrderAsc();

    List<GalleryImage> findByActiveTrueOrderByDisplayOrderAsc();

    long countByActiveTrue();
}