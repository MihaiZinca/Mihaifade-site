import work01 from "../assets/images/gallery/work-01.jpg";
import work02 from "../assets/images/gallery/work-02.jpg";
import work03 from "../assets/images/gallery/work-03.jpg";
import work04 from "../assets/images/gallery/work-04.jpg";
import work05 from "../assets/images/gallery/work-05.jpg";

const galleryImages = [
    {
        src: work01,
        alt: "Lucrare Mihai Fade",
        className: "gallery__item--large",
    },
    {
        src: work02,
        alt: "Tunsoare realizată de Mihai Fade",
        className: "",
    },
    {
        src: work03,
        alt: "Fade realizat de Mihai Fade",
        className: "",
    },
    {
        src: work04,
        alt: "Lucrare barber Mihai Fade",
        className: "",
    },
    {
        src: work05,
        alt: "Tunsoare Mihai Fade",
        className: "gallery__item--wide",
    },
];

function GallerySection() {
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
                        Rezultatele
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

            <div className="gallery__grid">
                {galleryImages.map((image, index) => (
                    <figure
                        className={`gallery__item ${image.className}`}
                        key={image.src}
                    >
                        <img
                            src={image.src}
                            alt={image.alt}
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

            <div className="gallery__statement">
                <p>
                    PRECIZIE / STIL / ATITUDINE
                </p>

                <h3>
                    Nu e doar un fade,
                    <span>
                        e Mihai Fade.
                    </span>
                </h3>
            </div>
        </section>
    );
}

export default GallerySection;