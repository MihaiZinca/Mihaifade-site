package ro.mihaifade.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
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