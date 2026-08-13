package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.dto.ReviewRequest;
import ro.mihaifade.backend.dto.ReviewResponse;
import ro.mihaifade.backend.entity.Review;
import ro.mihaifade.backend.entity.Role;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.ReviewRepository;
import ro.mihaifade.backend.repository.UserRepository;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository =
                reviewRepository;

        this.userRepository =
                userRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getPublicReviews() {
        return reviewRepository
                .findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(
                        this::toResponse
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllReviews() {
        return reviewRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(
                        this::toResponse
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewResponse getMyReview(
            String email
    ) {
        User user =
                getUserByEmail(
                        email
                );

        Review review =
                reviewRepository
                        .findByUserId(
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "You have not created a review yet"
                                )
                        );

        return toResponse(
                review
        );
    }

    @Transactional
    public ReviewResponse createMyReview(
            String email,
            ReviewRequest request
    ) {
        User user =
                getUserByEmail(
                        email
                );

        validateClient(
                user
        );

        if (
                reviewRepository.existsByUserId(
                        user.getId()
                )
        ) {
            throw new RuntimeException(
                    "You already have a review"
            );
        }

        Review review =
                new Review();

        review.setUser(
                user
        );

        review.setRating(
                request.getRating()
        );

        review.setComment(
                request
                        .getComment()
                        .trim()
        );

        review.setActive(
                true
        );

        Review savedReview =
                reviewRepository.save(
                        review
                );

        return toResponse(
                savedReview
        );
    }

    @Transactional
    public ReviewResponse updateMyReview(
            String email,
            ReviewRequest request
    ) {
        User user =
                getUserByEmail(
                        email
                );

        validateClient(
                user
        );

        Review review =
                reviewRepository
                        .findByUserId(
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "You have not created a review yet"
                                )
                        );

        review.setRating(
                request.getRating()
        );

        review.setComment(
                request
                        .getComment()
                        .trim()
        );

        review.setActive(
                true
        );

        Review savedReview =
                reviewRepository.save(
                        review
                );

        return toResponse(
                savedReview
        );
    }

    @Transactional
    public void deleteMyReview(
            String email
    ) {
        User user =
                getUserByEmail(
                        email
                );

        validateClient(
                user
        );

        Review review =
                reviewRepository
                        .findByUserId(
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "You have not created a review yet"
                                )
                        );

        reviewRepository.delete(
                review
        );
    }

    @Transactional
    public ReviewResponse setReviewActive(
            Long reviewId,
            Boolean active
    ) {
        Review review =
                getReviewById(
                        reviewId
                );

        review.setActive(
                active
        );

        Review savedReview =
                reviewRepository.save(
                        review
                );

        return toResponse(
                savedReview
        );
    }

    @Transactional
    public void deleteReviewPermanently(
            Long reviewId
    ) {
        Review review =
                getReviewById(
                        reviewId
                );

        reviewRepository.delete(
                review
        );
    }

    private Review getReviewById(
            Long reviewId
    ) {
        return reviewRepository
                .findById(
                        reviewId
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Review not found with id: "
                                        + reviewId
                        )
                );
    }

    private User getUserByEmail(
            String email
    ) {
        return userRepository
                .findByEmailIgnoreCase(
                        email
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found: "
                                        + email
                        )
                );
    }

    private void validateClient(
            User user
    ) {
        if (
                user.getRole()
                        != Role.CLIENT
        ) {
            throw new RuntimeException(
                    "Only clients can create reviews"
            );
        }

        if (
                !Boolean.TRUE.equals(
                        user.getActive()
                )
        ) {
            throw new RuntimeException(
                    "User account is not active"
            );
        }
    }

    private ReviewResponse toResponse(
            Review review
    ) {
        User user =
                review.getUser();

        String clientName =
                (
                        user.getFirstName()
                                + " "
                                + user.getLastName()
                )
                        .trim();

        return new ReviewResponse(
                review.getId(),
                user.getId(),
                clientName,
                review.getRating(),
                review.getComment(),
                review.getActive(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}