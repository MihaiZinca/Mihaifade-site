package ro.mihaifade.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ro.mihaifade.backend.dto.GalleryImageResponse;
import ro.mihaifade.backend.service.GalleryService;

import java.util.List;

@RestController
@RequestMapping("/api/gallery")
public class GalleryController {

    private final GalleryService galleryService;

    public GalleryController(
            GalleryService galleryService
    ) {
        this.galleryService = galleryService;
    }

    @GetMapping
    public List<GalleryImageResponse> getPublicImages() {
        return galleryService.getPublicImages();
    }

    @GetMapping("/admin")
    public List<GalleryImageResponse> getAllImages() {
        return galleryService.getAllImages();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GalleryImageResponse upload(
            @RequestPart("file") MultipartFile file
    ) {
        return galleryService.upload(file);
    }

    @PutMapping("/{imageId}/image")
    public GalleryImageResponse replaceImage(
            @PathVariable Long imageId,
            @RequestPart("file") MultipartFile file
    ) {
        return galleryService.replaceImage(
                imageId,
                file
        );
    }

    @PutMapping("/{imageId}/active")
    public GalleryImageResponse setActive(
            @PathVariable Long imageId,
            @RequestParam boolean active
    ) {
        return galleryService.setActive(
                imageId,
                active
        );
    }

    @PutMapping("/{imageId}/order")
    public GalleryImageResponse changeOrder(
            @PathVariable Long imageId,
            @RequestParam int order
    ) {
        return galleryService.changeOrder(
                imageId,
                order
        );
    }

    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long imageId
    ) {
        galleryService.delete(imageId);
    }
}