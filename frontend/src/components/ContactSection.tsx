import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import mihaiFadeImage from "../assets/images/barbers/mihai-fade.jpg";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

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

function ContactSection() {
    const navigate = useNavigate();

    const [barbers, setBarbers] =
        useState<BarberResponse[]>([]);

    const [shopSettings, setShopSettings] =
        useState<ShopSettingsResponse | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

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

    const activeBarbers =
        useMemo(
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

    const handleBooking = (
        barberId?: number
    ) => {
        if (!isAuthenticated()) {
            navigate("/login");
            return;
        }

        if (barberId) {
            navigate(
                `/programare?barberId=${barberId}`
            );
            return;
        }

        navigate("/programare");
    };

    return (
        <section
            id="contact"
            className="home-contact"
        >
            <div className="home-contact__header">
                <div>
                    <p className="section-eyebrow">
                        CONTACT
                    </p>

                    <h2>
                        Echipa{" "}
                        <span>
                            noastră.
                        </span>
                    </h2>
                </div>

                <p className="home-contact__intro">
                    Descoperă frizerii,
                    urmărește-i pe platformele
                    preferate și alege omul
                    potrivit pentru stilul tău.
                </p>
            </div>

            {error && (
                <div className="home-contact__error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="home-contact__loading">
                    Se încarcă echipa...
                </div>
            ) : (
                <>
                    {activeBarbers.length === 0 ? (
                        <div className="home-contact__empty">
                            Momentan nu există barberi
                            disponibili.
                        </div>
                    ) : (
                        <div className="home-contact__barbers">
                            {activeBarbers.map(
                                (
                                    barber,
                                    index
                                ) => (
                                    <article
                                        key={
                                            barber.id
                                        }
                                        className="home-contact-barber"
                                    >
                                        <div className="home-contact-barber__image">
                                            {barber.displayName ===
                                            "Mihai Fade" ? (
                                                <img
                                                    src={
                                                        mihaiFadeImage
                                                    }
                                                    alt={
                                                        barber.displayName
                                                    }
                                                    loading="lazy"
                                                />
                                            ) : barber.imageUrl ? (
                                                <img
                                                    src={
                                                        barber.imageUrl
                                                    }
                                                    alt={
                                                        barber.displayName
                                                    }
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="home-contact-barber__placeholder">
                                                    {getInitials(
                                                        barber.displayName
                                                    )}
                                                </div>
                                            )}

                                            <span className="home-contact-barber__number">
                                                {String(
                                                    index +
                                                        1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </span>
                                        </div>

                                        <div className="home-contact-barber__content">
                                            <div className="home-contact-barber__top">
                                                <div>
                                                    <span className="home-contact-barber__role">
                                                        BARBER
                                                    </span>

                                                    <h3>
                                                        {
                                                            barber.displayName
                                                        }
                                                    </h3>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="home-contact-barber__booking"
                                                    onClick={() =>
                                                        handleBooking(
                                                            barber.id
                                                        )
                                                    }
                                                >
                                                    Programează-te

                                                    <span>
                                                        →
                                                    </span>
                                                </button>
                                            </div>

                                            <p className="home-contact-barber__bio">
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

                    <div className="home-contact__location">
                        <div className="home-contact__location-header">
                            <div>
                                <p className="section-eyebrow">
                                    LOCAȚIE
                                </p>

                                <h2>
                                    Ne găsești{" "}
                                    <span>
                                        aici.
                                    </span>
                                </h2>
                            </div>

                            <div className="home-contact__address">
                                <span>
                                    ADRESĂ
                                </span>

                                <strong>
                                    {shopSettings?.address ||
                                        "Adresa frizeriei nu este configurată."}
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

                        <div className="home-contact__map">
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
                                <div className="home-contact__map-empty">
                                    <span>
                                        MIHAIFADE
                                    </span>

                                    <strong>
                                        Harta nu este
                                        configurată încă.
                                    </strong>

                                    <p>
                                        Configurează linkul
                                        Google Maps din
                                        panoul de administrare.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

function SocialLinks({
    barber,
}: {
    barber: BarberResponse;
}) {
    const hasSocialLinks =
        Boolean(barber.instagramUrl) ||
        Boolean(barber.facebookUrl) ||
        Boolean(barber.youtubeUrl) ||
        Boolean(barber.tiktokUrl);

    if (!hasSocialLinks) {
        return (
            <div className="home-contact-socials home-contact-socials--empty">
                <span>
                    Social media neconfigurată
                </span>
            </div>
        );
    }

    return (
        <div className="home-contact-socials">
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
            className="home-contact-social"
            aria-label={label}
            title={label}
        >
            <span className="home-contact-social__icon">
                {children}
            </span>

            <span className="home-contact-social__label">
                {label}
            </span>

            <span className="home-contact-social__arrow">
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
                className="home-contact-social__fill"
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
                className="home-contact-social__cutout"
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
                part
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");
}

export default ContactSection;