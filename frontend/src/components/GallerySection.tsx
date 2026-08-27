import { useEffect, useState } from "react";
import api from "../services/api";

interface GalleryImageResponse {
    id: number;
    imageUrl: string;
    displayOrder: number;
    active: boolean;
    createdAt: string;
}

function GallerySection() {
    const [galleryImages, setGalleryImages] = useState<GalleryImageResponse[]>(
        []
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGallery = async () => {
            try {
                const response = await api.get<GalleryImageResponse[]>(
                    "/gallery"
                );

                setGalleryImages(response.data);
            } catch {
                setGalleryImages([]);
            } finally {
                setLoading(false);
            }
        };

        void loadGallery();
    }, []);

    return (
        <section
            id="galerie"
            className="gallery"
        >
            <div className="gallery__header">
                <div>
                    <p className="section-eyebrow">
                        GALERIE
                    </p>

                    <h2>
                        Rezultatele{" "}
                        <span>
                            vorbesc singure.
                        </span>
                    </h2>
                </div>

                <p className="gallery__intro">
                    Fiecare tunsoare este diferită. Aceeași atenție la detalii,
                    de fiecare dată.
                </p>
            </div>

            {!loading && galleryImages.length > 0 && (
                <div className="gallery__grid">
                    {galleryImages.map((image, index) => (
                        <figure
                            className="gallery__item"
                            key={image.id}
                        >
                            <img
                                src={image.imageUrl}
                                alt={`Lucrare Mihai Fade ${index + 1}`}
                                loading="lazy"
                            />

                            <figcaption>
                                <span>
                                    {String(index + 1).padStart(2, "0")}
                                </span>

                                <span>
                                    MIHAI FADE
                                </span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            )}
        </section>
    );
}

export default GallerySection;