import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface BarberResponse {
    id: number;
    displayName: string;
    bio: string | null;
    imageUrl: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    youtubeUrl: string | null;
    tiktokUrl: string | null;
    active: boolean;
}

interface ShopSettingsResponse {
    id: number;
    address: string;
    mapEmbedUrl: string | null;
    mapsUrl: string | null;
}

function ContactPage() {
    const [barbers, setBarbers] = useState<BarberResponse[]>([]);
    const [shopSettings, setShopSettings] =
        useState<ShopSettingsResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadContactData = async () => {
            setLoading(true);
            setError("");

            try {
                const [
                    barbersResponse,
                    shopSettingsResponse,
                ] = await Promise.all([
                    api.get<BarberResponse[]>(
                        "/barbers"
                    ),
                    api.get<ShopSettingsResponse>(
                        "/shop-settings"
                    ),
                ]);

                setBarbers(
                    barbersResponse.data
                );

                setShopSettings(
                    shopSettingsResponse.data
                );
            } catch {
                setError(
                    "Datele de contact nu au putut fi încărcate."
                );
            } finally {
                setLoading(false);
            }
        };

        loadContactData();
    }, []);

    const activeBarbers = useMemo(
        () =>
            barbers
                .filter(
                    (barber) =>
                        barber.active
                )
                .sort((a, b) =>
                    a.displayName.localeCompare(
                        b.displayName,
                        "ro-RO"
                    )
                ),
        [barbers]
    );

    return (
        <main className="contact-page">
            <header className="contact-header">
                <Link
                    to="/"
                    className="contact-header__brand"
                >
                    MIHAIFADE
                </Link>

                <nav className="contact-header__nav">
                    <Link to="/">
                        Acasă
                    </Link>

                    <Link to="/programare">
                        Programare
                    </Link>

                    <Link
                        to="/contact"
                        className="contact-header__active"
                    >
                        Contact
                    </Link>
                </nav>

                <Link
                    to="/programare"
                    className="contact-header__booking"
                >
                    Fă o programare
                </Link>
            </header>

            <section className="contact-hero">
                <div className="contact-hero__content">
                    <p className="section-eyebrow">
                        CONTACT
                    </p>

                    <h1>
                        Hai să rămânem
                        <span>
                            conectați.
                        </span>
                    </h1>

                    <p>
                        Găsește barberul potrivit,
                        urmărește-l pe platformele
                        preferate și vezi unde ne
                        găsești.
                    </p>
                </div>
            </section>

            {error && (
                <div className="contact-error">
                    {error}
                </div>
            )}

            {loading ? (
                <section className="contact-loading">
                    Se încarcă...
                </section>
            ) : (
                <>
                    <section className="contact-barbers">
                        <div className="contact-section-header">
                            <div>
                                <p className="section-eyebrow">
                                    ECHIPĂ
                                </p>

                                <h2>
                                    Barberii
                                    <span>
                                        noștri.
                                    </span>
                                </h2>
                            </div>

                            <p>
                                Fiecare barber are
                                propriul stil și propriile
                                canale de social media.
                            </p>
                        </div>

                        {activeBarbers.length === 0 ? (
                            <p className="contact-message">
                                Nu există momentan barberi
                                disponibili.
                            </p>
                        ) : (
                            <div className="contact-barbers__grid">
                                {activeBarbers.map(
                                    (barber) => (
                                        <article
                                            key={
                                                barber.id
                                            }
                                            className="contact-barber-card"
                                        >
                                            <div className="contact-barber-card__image">
                                                {barber.imageUrl ? (
                                                    <img
                                                        src={
                                                            barber.imageUrl
                                                        }
                                                        alt={
                                                            barber.displayName
                                                        }
                                                    />
                                                ) : (
                                                    <div className="contact-barber-card__placeholder">
                                                        {getInitials(
                                                            barber.displayName
                                                        )}
                                                    </div>
                                                )}

                                                <span className="contact-barber-card__index">
                                                    {String(
                                                        activeBarbers.findIndex(
                                                            (
                                                                item
                                                            ) =>
                                                                item.id ===
                                                                barber.id
                                                        ) +
                                                            1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>
                                            </div>

                                            <div className="contact-barber-card__content">
                                                <div className="contact-barber-card__heading">
                                                    <div>
                                                        <span>
                                                            BARBER
                                                        </span>

                                                        <h3>
                                                            {
                                                                barber.displayName
                                                            }
                                                        </h3>
                                                    </div>

                                                    <Link
                                                        to={`/programare?barberId=${barber.id}`}
                                                        className="contact-barber-card__book"
                                                    >
                                                        Programează-te
                                                    </Link>
                                                </div>

                                                <p className="contact-barber-card__bio">
                                                    {barber.bio ||
                                                        "Barber MIHAIFADE."}
                                                </p>

                                                <SocialLinks
                                                    barber={
                                                        barber
                                                    }
                                                />
                                            </div>
                                        </article>
                                    )
                                )}
                            </div>
                        )}
                    </section>

                    <section className="contact-location">
                        <div className="contact-section-header contact-section-header--location">
                            <div>
                                <p className="section-eyebrow">
                                    LOCAȚIE
                                </p>

                                <h2>
                                    Ne găsești
                                    <span>
                                        aici.
                                    </span>
                                </h2>
                            </div>

                            <div className="contact-location__address">
                                <span>
                                    ADRESĂ
                                </span>

                                <strong>
                                    {shopSettings?.address ||
                                        "Adresa nu este configurată."}
                                </strong>

                                {shopSettings?.mapsUrl && (
                                    <a
                                        href={
                                            shopSettings.mapsUrl
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Deschide în Google Maps
                                        <span>
                                            ↗
                                        </span>
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="contact-map">
                            {shopSettings?.mapEmbedUrl ? (
                                <iframe
                                    src={
                                        shopSettings.mapEmbedUrl
                                    }
                                    title="Locația MIHAIFADE"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="contact-map__empty">
                                    <span>
                                        LOCAȚIE
                                    </span>

                                    <strong>
                                        Harta nu este configurată încă.
                                    </strong>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="contact-cta">
                        <p className="section-eyebrow">
                            PROGRAMARE
                        </p>

                        <div className="contact-cta__content">
                            <h2>
                                Ne vedem
                                <span>
                                    în scaun.
                                </span>
                            </h2>

                            <Link to="/programare">
                                Fă o programare
                                <span>
                                    →
                                </span>
                            </Link>
                        </div>
                    </section>
                </>
            )}

            <footer className="contact-footer">
                <Link to="/">
                    MIHAIFADE
                </Link>

                <span>
                    © {new Date().getFullYear()}
                </span>
            </footer>
        </main>
    );
}

function SocialLinks({
    barber,
}: {
    barber: BarberResponse;
}) {
    const hasSocialLinks =
        barber.instagramUrl ||
        barber.facebookUrl ||
        barber.youtubeUrl ||
        barber.tiktokUrl;

    if (!hasSocialLinks) {
        return (
            <div className="contact-socials contact-socials--empty">
                <span>
                    Social media neconfigurată
                </span>
            </div>
        );
    }

    return (
        <div className="contact-socials">
            {barber.instagramUrl && (
                <SocialLink
                    href={
                        barber.instagramUrl
                    }
                    label="Instagram"
                >
                    <InstagramIcon />
                </SocialLink>
            )}

            {barber.facebookUrl && (
                <SocialLink
                    href={
                        barber.facebookUrl
                    }
                    label="Facebook"
                >
                    <FacebookIcon />
                </SocialLink>
            )}

            {barber.youtubeUrl && (
                <SocialLink
                    href={
                        barber.youtubeUrl
                    }
                    label="YouTube"
                >
                    <YoutubeIcon />
                </SocialLink>
            )}

            {barber.tiktokUrl && (
                <SocialLink
                    href={
                        barber.tiktokUrl
                    }
                    label="TikTok"
                >
                    <TiktokIcon />
                </SocialLink>
            )}
        </div>
    );
}

function SocialLink({
    href,
    label,
    children,
}: {
    href: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="contact-social"
            aria-label={label}
            title={label}
        >
            <span className="contact-social__icon">
                {children}
            </span>

            <span className="contact-social__label">
                {label}
            </span>

            <span className="contact-social__arrow">
                ↗
            </span>
        </a>
    );
}

function InstagramIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="5"
            />

            <circle
                cx="12"
                cy="12"
                r="4"
            />

            <circle
                cx="17.5"
                cy="6.5"
                r="1"
                className="contact-social__fill"
            />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v2H6v4h3v7h4v-7h3.2l.8-4H13V9c0-.7.3-1 1-1Z" />
        </svg>
    );
}

function YoutubeIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.5 12 5.5 12 5.5s-5 0-6.9.6A3 3 0 0 0 3 8.2C2.5 10 2.5 12 2.5 12s0 2 .6 3.8a3 3 0 0 0 2.1 2.1c1.8.6 6.8.6 6.8.6s5 0 6.9-.6a3 3 0 0 0 2.1-2.1c.5-1.8.5-3.8.5-3.8s0-2-.5-3.8Z" />

            <path
                d="m10 15.5 5-3.5-5-3.5v7Z"
                className="contact-social__cutout"
            />
        </svg>
    );
}

function TiktokIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M15 3c.4 2.2 1.7 3.5 4 4v4a8.5 8.5 0 0 1-4-1.1V16a6 6 0 1 1-6-6c.4 0 .7 0 1 .1v4.1a2 2 0 1 0 1 1.8V3h4Z" />
        </svg>
    );
}

function getInitials(
    displayName: string
) {
    return displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            (part) =>
                part.charAt(0).toUpperCase()
        )
        .join("");
}

export default ContactPage;