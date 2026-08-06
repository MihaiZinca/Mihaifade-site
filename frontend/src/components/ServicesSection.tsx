import { useEffect, useState } from "react";
import { ArrowUpRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";
import type { BarbershopService } from "../types";

function ServicesSection() {
    const navigate = useNavigate();

    const [services, setServices] = useState<BarbershopService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        api.get<BarbershopService[]>("/services")
            .then((response) => {
                const activeServices = response.data.filter(
                    (service) => service.active
                );

                setServices(activeServices);
            })
            .catch(() => {
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleServiceClick = (serviceId: number) => {
        if (isAuthenticated()) {
            navigate(`/programare?serviceId=${serviceId}`);
            return;
        }

        navigate("/login");
    };

    return (
        <section id="servicii" className="services">
            <div className="services__header">
                <div>
                    <p className="section-eyebrow">
                        SERVICII
                    </p>

                    <h2>
                        Alegi stilul.
                        <span>
                            Mihai se ocupă de restul.
                        </span>
                    </h2>
                </div>

                <p className="services__intro">
                    De la un fade curat până la schimbări complete de look.
                    Fiecare serviciu are timpul lui, fără grabă și fără compromisuri.
                </p>
            </div>

            {loading && (
                <p className="services__message">
                    Se încarcă serviciile...
                </p>
            )}

            {error && (
                <p className="services__message services__message--error">
                    Serviciile nu au putut fi încărcate.
                </p>
            )}

            {!loading && !error && services.length === 0 && (
                <p className="services__message">
                    Momentan nu există servicii disponibile.
                </p>
            )}

            {!loading && !error && services.length > 0 && (
                <div className="services__grid">
                    {services.map((service, index) => (
                        <button
                            type="button"
                            className="service-card"
                            key={service.id}
                            onClick={() => handleServiceClick(service.id)}
                        >
                            <div className="service-card__top">
                                <span className="service-card__number">
                                    {String(index + 1).padStart(2, "0")}
                                </span>

                                <ArrowUpRight
                                    size={22}
                                    strokeWidth={1.5}
                                />
                            </div>

                            <div className="service-card__content">
                                <h3>
                                    {service.name}
                                </h3>

                                <p>
                                    {service.description}
                                </p>
                            </div>

                            <div className="service-card__footer">
                                <span className="service-card__duration">
                                    <Clock
                                        size={16}
                                        strokeWidth={1.7}
                                    />

                                    {service.durationMinutes} min
                                </span>

                                <strong>
                                    {service.price} lei
                                </strong>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}

export default ServicesSection;