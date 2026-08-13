package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.ReviewRequest;
import ro.mihaifade.backend.dto.ReviewResponse;
import ro.mihaifade.backend.service.ReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(
            ReviewService reviewService
    ) {
        this.reviewService =
                reviewService;
    }

    @GetMapping
    public List<ReviewResponse> getPublicReviews() {
        return reviewService
                .getPublicReviews();
    }

    @GetMapping("/me")
    public ReviewResponse getMyReview(
            Authentication authentication
    ) {
        return reviewService
                .getMyReview(
                        authentication.getName()
                );
    }

    @PostMapping("/me")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse createMyReview(
            Authentication authentication,
            @Valid
            @RequestBody ReviewRequest request
    ) {
        return reviewService
                .createMyReview(
                        authentication.getName(),
                        request
                );
    }

    @PutMapping("/me")
    public ReviewResponse updateMyReview(
            Authentication authentication,
            @Valid
            @RequestBody ReviewRequest request
    ) {
        return reviewService
                .updateMyReview(
                        authentication.getName(),
                        request
                );
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMyReview(
            Authentication authentication
    ) {
        reviewService
                .deleteMyReview(
                        authentication.getName()
                );
    }

    @GetMapping("/admin")
    public List<ReviewResponse> getAllReviews() {
        return reviewService
                .getAllReviews();
    }

    @PutMapping("/{reviewId}/active")
    public ReviewResponse setReviewActive(
            @PathVariable Long reviewId,
            @RequestParam Boolean active
    ) {
        return reviewService
                .setReviewActive(
                        reviewId,
                        active
                );
    }

    @DeleteMapping("/{reviewId}/permanent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReviewPermanently(
            @PathVariable Long reviewId
    ) {
        reviewService
                .deleteReviewPermanently(
                        reviewId
                );
    }
}