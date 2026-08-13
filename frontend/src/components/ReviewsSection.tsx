import { useEffect, useState } from "react";
import api from "../services/api";

interface ReviewResponse {
    id: number;
    userId: number;
    clientName: string;
    rating: number;
    comment: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

function ReviewsSection() {
    const [reviews, setReviews] =
        useState<ReviewResponse[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const loadReviews = async () => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await api.get<ReviewResponse[]>(
                        "/reviews"
                    );

                setReviews(response.data);
            } catch {
                setError(
                    "Recenziile nu au putut fi încărcate."
                );
            } finally {
                setLoading(false);
            }
        };

        loadReviews();
    }, []);

    return (
        <section
            id="recenzii"
            className="reviews"
        >
            <div className="reviews__header">
                <div>
                    <p className="section-eyebrow">
                        RECENZII
                    </p>

                    <h2>
                        Ce spun{" "}
                        <span>
                            clienții?
                        </span>
                    </h2>
                </div>

                <p className="reviews__intro">
                    Experiențe reale, direct de la
                    oamenii care au trecut prin
                    salonul nostru.
                </p>
            </div>

            {loading ? (
                <div className="reviews__message">
                    Se încarcă recenziile...
                </div>
            ) : error ? (
                <div className="reviews__message reviews__message--error">
                    {error}
                </div>
            ) : reviews.length === 0 ? (
                <div className="reviews__empty">
                    <span>
                        ★★★★★
                    </span>

                    <p>
                        Recenziile clienților vor
                        apărea aici.
                    </p>
                </div>
            ) : (
                <div className="reviews__grid">
                    {reviews.map(
                        (review, index) => (
                            <article
                                key={review.id}
                                className="reviews__card"
                            >
                                <div className="reviews__card-top">
                                    <span className="reviews__number">
                                        {String(
                                            index + 1
                                        ).padStart(
                                            2,
                                            "0"
                                        )}
                                    </span>

                                    <div
                                        className="reviews__stars"
                                        aria-label={`${review.rating} din 5 stele`}
                                    >
                                        {[
                                            1,
                                            2,
                                            3,
                                            4,
                                            5,
                                        ].map(
                                            (star) => (
                                                <span
                                                    key={
                                                        star
                                                    }
                                                    className={
                                                        star <=
                                                        review.rating
                                                            ? "reviews__star reviews__star--active"
                                                            : "reviews__star"
                                                    }
                                                >
                                                    ★
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>

                                <blockquote className="reviews__quote">
                                    “{review.comment}”
                                </blockquote>

                                <div className="reviews__client">
                                    <div className="reviews__client-mark">
                                        {getInitials(
                                            review.clientName
                                        )}
                                    </div>

                                    <div>
                                        <strong>
                                            {
                                                review.clientName
                                            }
                                        </strong>

                                        <span>
                                            Client MIHAIFADE
                                        </span>
                                    </div>
                                </div>
                            </article>
                        )
                    )}
                </div>
            )}
        </section>
    );
}

function getInitials(
    name: string
) {
    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 0) {
        return "MF";
    }

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}

export default ReviewsSection;