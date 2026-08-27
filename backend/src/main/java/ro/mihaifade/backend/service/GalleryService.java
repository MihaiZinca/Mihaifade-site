package ro.mihaifade.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ro.mihaifade.backend.dto.GalleryImageResponse;
import ro.mihaifade.backend.entity.GalleryImage;
import ro.mihaifade.backend.repository.GalleryImageRepository;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class GalleryService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final GalleryImageRepository galleryImageRepository;
    private final Cloudinary cloudinary;

    public GalleryService(
            GalleryImageRepository galleryImageRepository,
            Cloudinary cloudinary
    ) {
        this.galleryImageRepository = galleryImageRepository;
        this.cloudinary = cloudinary;
    }

    @Transactional(readOnly = true)
    public List<GalleryImageResponse> getPublicImages() {
        return galleryImageRepository
                .findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GalleryImageResponse> getAllImages() {
        return galleryImageRepository
                .findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public GalleryImageResponse upload(MultipartFile file) {
        validateFile(file);

        Map<?, ?> uploadResult = uploadCloudinaryImage(file);

        String imageUrl = getUploadValue(
                uploadResult,
                "secure_url"
        );

        String publicId = getUploadValue(
                uploadResult,
                "public_id"
        );

        GalleryImage image = new GalleryImage();
        image.setImageUrl(imageUrl);
        image.setPublicId(publicId);
        image.setDisplayOrder(
                galleryImageRepository
                        .findAllByOrderByDisplayOrderAsc()
                        .size() + 1
        );
        image.setActive(true);

        try {
            GalleryImage savedImage =
                    galleryImageRepository.save(image);

            return toResponse(savedImage);
        } catch (RuntimeException exception) {
            destroyCloudinaryImageQuietly(publicId);
            throw exception;
        }
    }

    @Transactional
    public GalleryImageResponse replaceImage(
            Long imageId,
            MultipartFile file
    ) {
        validateFile(file);

        GalleryImage image = findImage(imageId);

        String oldPublicId = image.getPublicId();

        Map<?, ?> uploadResult = uploadCloudinaryImage(file);

        String newImageUrl = getUploadValue(
                uploadResult,
                "secure_url"
        );

        String newPublicId = getUploadValue(
                uploadResult,
                "public_id"
        );

        image.setImageUrl(newImageUrl);
        image.setPublicId(newPublicId);

        GalleryImage savedImage;

        try {
            savedImage =
                    galleryImageRepository.saveAndFlush(image);
        } catch (RuntimeException exception) {
            destroyCloudinaryImageQuietly(newPublicId);
            throw exception;
        }

        destroyCloudinaryImageQuietly(oldPublicId);

        return toResponse(savedImage);
    }

    @Transactional
    public GalleryImageResponse setActive(
            Long imageId,
            boolean active
    ) {
        GalleryImage image = findImage(imageId);

        image.setActive(active);

        return toResponse(
                galleryImageRepository.save(image)
        );
    }

    @Transactional
    public GalleryImageResponse changeOrder(
            Long imageId,
            int newOrder
    ) {
        List<GalleryImage> images =
                galleryImageRepository
                        .findAllByOrderByDisplayOrderAsc();

        if (images.isEmpty()) {
            throw new IllegalStateException(
                    "Nu există imagini în galerie."
            );
        }

        GalleryImage selectedImage = images
                .stream()
                .filter(image ->
                        image.getId().equals(imageId)
                )
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Imaginea nu există."
                        )
                );

        int targetIndex = Math.max(
                0,
                Math.min(
                        newOrder - 1,
                        images.size() - 1
                )
        );

        images.remove(selectedImage);
        images.add(
                targetIndex,
                selectedImage
        );

        for (
                int index = 0;
                index < images.size();
                index++
        ) {
            images
                    .get(index)
                    .setDisplayOrder(index + 1);
        }

        galleryImageRepository.saveAll(images);

        return toResponse(selectedImage);
    }

    @Transactional
    public void delete(Long imageId) {
        GalleryImage image = findImage(imageId);

        destroyCloudinaryImage(
                image.getPublicId()
        );

        galleryImageRepository.delete(image);

        normalizeDisplayOrder();
    }

    private GalleryImage findImage(Long imageId) {
        return galleryImageRepository
                .findById(imageId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Imaginea nu există."
                        )
                );
    }

    private Map<?, ?> uploadCloudinaryImage(
            MultipartFile file
    ) {
        try {
            return cloudinary
                    .uploader()
                    .upload(
                            file.getBytes(),
                            ObjectUtils.asMap(
                                    "folder",
                                    "mihaifade/gallery",
                                    "resource_type",
                                    "image"
                            )
                    );
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Imaginea nu a putut fi încărcată.",
                    exception
            );
        }
    }

    private String getUploadValue(
            Map<?, ?> uploadResult,
            String key
    ) {
        Object value = uploadResult.get(key);

        if (
                value == null ||
                        value.toString().isBlank()
        ) {
            throw new IllegalStateException(
                    "Răspuns invalid primit de la Cloudinary."
            );
        }

        return value.toString();
    }

    private void validateFile(MultipartFile file) {
        if (
                file == null ||
                        file.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "Selectează o imagine."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "Imaginea poate avea maximum 10 MB."
            );
        }

        String contentType =
                file.getContentType();

        if (
                contentType == null ||
                        !contentType.startsWith("image/")
        ) {
            throw new IllegalArgumentException(
                    "Fișierul trebuie să fie o imagine."
            );
        }
    }

    private void destroyCloudinaryImage(
            String publicId
    ) {
        try {
            Map<?, ?> result =
                    cloudinary
                            .uploader()
                            .destroy(
                                    publicId,
                                    ObjectUtils.emptyMap()
                            );

            Object status =
                    result.get("result");

            if (
                    status == null ||
                            (
                                    !"ok".equals(
                                            status.toString()
                                    ) &&
                                            !"not found".equals(
                                                    status.toString()
                                            )
                            )
            ) {
                throw new IllegalStateException(
                        "Imaginea nu a putut fi ștearsă din Cloudinary."
                );
            }
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Imaginea nu a putut fi ștearsă din Cloudinary.",
                    exception
            );
        }
    }

    private void destroyCloudinaryImageQuietly(
            String publicId
    ) {
        if (
                publicId == null ||
                        publicId.isBlank()
        ) {
            return;
        }

        try {
            cloudinary
                    .uploader()
                    .destroy(
                            publicId,
                            ObjectUtils.emptyMap()
                    );
        } catch (IOException ignored) {
        }
    }

    private void normalizeDisplayOrder() {
        List<GalleryImage> images =
                galleryImageRepository
                        .findAllByOrderByDisplayOrderAsc();

        for (
                int index = 0;
                index < images.size();
                index++
        ) {
            images
                    .get(index)
                    .setDisplayOrder(index + 1);
        }

        galleryImageRepository.saveAll(images);
    }

    private GalleryImageResponse toResponse(
            GalleryImage image
    ) {
        return new GalleryImageResponse(
                image.getId(),
                image.getImageUrl(),
                image.getDisplayOrder(),
                image.isActive(),
                image.getCreatedAt()
        );
    }
}