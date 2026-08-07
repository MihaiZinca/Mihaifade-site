import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import type {
    AppointmentResponse,
    AvailabilityResponse,
    BarbershopService,
} from "../types";

const BARBER_ID = 1;

function BookingPage() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [services, setServices] = useState<BarbershopService[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
        null
    );
    const [selectedDate, setSelectedDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [notes, setNotes] = useState("");

    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [creatingAppointment, setCreatingAppointment] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState<AppointmentResponse | null>(null);

    const selectedService = useMemo(
        () =>
            services.find(
                (service) => service.id === selectedServiceId
            ) ?? null,
        [services, selectedServiceId]
    );

    useEffect(() => {
        const loadServices = async () => {
            try {
                const response = await api.get<BarbershopService[]>("/services");

                const activeServices = response.data.filter(
                    (service) => service.active
                );

                setServices(activeServices);

                const serviceIdFromUrl = Number(
                    searchParams.get("serviceId")
                );

                if (
                    serviceIdFromUrl &&
                    activeServices.some(
                        (service) => service.id === serviceIdFromUrl
                    )
                ) {
                    setSelectedServiceId(serviceIdFromUrl);
                }
            } catch {
                setError("Serviciile nu au putut fi încărcate.");
            } finally {
                setLoadingServices(false);
            }
        };

        loadServices();
    }, [searchParams]);

    useEffect(() => {
        if (!selectedServiceId || !selectedDate) {
            setAvailableSlots([]);
            setSelectedTime("");
            return;
        }

        const loadAvailability = async () => {
            setLoadingSlots(true);
            setError("");
            setSelectedTime("");

            try {
                const response = await api.get<AvailabilityResponse>(
                    "/availability",
                    {
                        params: {
                            barberId: BARBER_ID,
                            serviceId: selectedServiceId,
                            date: selectedDate,
                        },
                    }
                );

                setAvailableSlots(response.data.availableSlots);
            } catch {
                setAvailableSlots([]);
                setError(
                    "Orele disponibile nu au putut fi încărcate."
                );
            } finally {
                setLoadingSlots(false);
            }
        };

        loadAvailability();
    }, [selectedServiceId, selectedDate]);

    const handleCreateAppointment = async () => {
        if (!selectedServiceId || !selectedDate || !selectedTime) {
            setError(
                "Alege serviciul, data și ora înainte de confirmare."
            );
            return;
        }

        setCreatingAppointment(true);
        setError("");

        try {
            const response = await api.post<AppointmentResponse>(
                "/appointments",
                {
                    barberId: BARBER_ID,
                    serviceId: selectedServiceId,
                    date: selectedDate,
                    startTime: selectedTime,
                    notes: notes.trim() === "" ? null : notes,
                }
            );

            setSuccess(response.data);
        } catch {
            setError(
                "Programarea nu a putut fi creată. Este posibil ca ora să fi fost ocupată între timp."
            );
        } finally {
            setCreatingAppointment(false);
        }
    };

    if (success) {
        return (
            <main className="booking-page">
                <section className="booking-success">
                    <p className="section-eyebrow">
                        PROGRAMARE CREATĂ
                    </p>

                    <h1>
                        Te așteptăm.
                    </h1>

                    <div className="booking-success__details">
                        <div>
                            <span>Serviciu</span>
                            <strong>{success.serviceName}</strong>
                        </div>

                        <div>
                            <span>Data</span>
                            <strong>{success.date}</strong>
                        </div>

                        <div>
                            <span>Ora</span>
                            <strong>
                                {success.startTime.slice(0, 5)}
                            </strong>
                        </div>

                        <div>
                            <span>Status</span>
                            <strong>{success.status}</strong>
                        </div>
                    </div>

                    <div className="booking-success__actions">
                        <Link to="/cont">
                            Vezi programările mele
                        </Link>

                        <Link to="/">
                            Înapoi acasă
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="booking-page">
            <header className="booking-header">
                <div className="booking-header__left">
                    <button
                        type="button"
                        className="booking-header__back"
                        onClick={() => navigate(-1)}
                     >           
                        Înapoi
                    </button>

                <Link to="/" className="booking-header__brand">
                MIHAIFADE
                </Link>
                </div>

                <div className="booking-header__steps">
                    <span className={selectedServiceId ? "active" : ""}>
                        01 Serviciu
                    </span>

                    <span className={selectedDate ? "active" : ""}>
                        02 Data
                    </span>

                    <span className={selectedTime ? "active" : ""}>
                        03 Ora
                    </span>

                    <span>
                        04 Confirmare
                    </span>
                </div>
            </header>

            <section className="booking-content">
                <div className="booking-intro">
                    <p className="section-eyebrow">
                        PROGRAMARE
                    </p>

                    <h1>
                        Alege.
                        <span> Restul îl facem noi.</span>
                    </h1>

                    <p>
                        Selectează serviciul, data și ora disponibilă.
                        Programarea va fi asociată automat contului tău.
                    </p>
                </div>

                {error && (
                    <p className="booking-error">
                        {error}
                    </p>
                )}

                <section className="booking-step">
                    <div className="booking-step__title">
                        <span>01</span>

                        <div>
                            <h2>
                                Alege serviciul
                            </h2>

                            <p>
                                Selectează serviciul dorit.
                            </p>
                        </div>
                    </div>

                    {loadingServices ? (
                        <p className="booking-message">
                            Se încarcă serviciile...
                        </p>
                    ) : (
                        <div className="booking-services">
                            {services.map((service) => (
                                <button
                                    type="button"
                                    key={service.id}
                                    className={
                                        selectedServiceId === service.id
                                            ? "booking-service booking-service--selected"
                                            : "booking-service"
                                    }
                                    onClick={() => {
                                        setSelectedServiceId(service.id);
                                        setSelectedDate("");
                                        setSelectedTime("");
                                        setAvailableSlots([]);
                                    }}
                                >
                                    <div>
                                        <h3>
                                            {service.name}
                                        </h3>

                                        <p>
                                            {service.description}
                                        </p>
                                    </div>

                                    <div className="booking-service__meta">
                                        <span>
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

                <section className="booking-step">
                    <div className="booking-step__title">
                        <span>02</span>

                        <div>
                            <h2>
                                Alege data
                            </h2>

                            <p>
                                Vei vedea doar orele disponibile în ziua aleasă.
                            </p>
                        </div>
                    </div>

                    <input
                        className="booking-date"
                        type="date"
                        value={selectedDate}
                        min={new Date().toISOString().split("T")[0]}
                        disabled={!selectedServiceId}
                        onChange={(event) => {
                            setSelectedDate(event.target.value);
                            setSelectedTime("");
                        }}
                    />
                </section>

                <section className="booking-step">
                    <div className="booking-step__title">
                        <span>03</span>

                        <div>
                            <h2>
                                Alege ora
                            </h2>

                            <p>
                                Orele vin în timp real din programul lui Mihai.
                            </p>
                        </div>
                    </div>

                    {!selectedDate && (
                        <p className="booking-message">
                            Alege mai întâi serviciul și data.
                        </p>
                    )}

                    {loadingSlots && (
                        <p className="booking-message">
                            Verificăm orele disponibile...
                        </p>
                    )}

                    {!loadingSlots &&
                        selectedDate &&
                        availableSlots.length === 0 && (
                            <p className="booking-message">
                                Nu există ore disponibile pentru această zi.
                            </p>
                        )}

                    {!loadingSlots && availableSlots.length > 0 && (
                        <div className="booking-slots">
                            {availableSlots.map((slot) => (
                                <button
                                    type="button"
                                    key={slot}
                                    className={
                                        selectedTime === slot
                                            ? "booking-slot booking-slot--selected"
                                            : "booking-slot"
                                    }
                                    onClick={() =>
                                        setSelectedTime(slot)
                                    }
                                >
                                    {slot.slice(0, 5)}
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="booking-step">
                    <div className="booking-step__title">
                        <span>04</span>

                        <div>
                            <h2>
                                Confirmare
                            </h2>

                            <p>
                                Verifică programarea înainte să o trimiți.
                            </p>
                        </div>
                    </div>

                    <div className="booking-confirmation">
                        <div className="booking-summary">
                            <div>
                                <span>Serviciu</span>
                                <strong>
                                    {selectedService?.name ?? "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Durată</span>
                                <strong>
                                    {selectedService
                                        ? `${selectedService.durationMinutes} min`
                                        : "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Preț</span>
                                <strong>
                                    {selectedService
                                        ? `${selectedService.price} lei`
                                        : "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Data</span>
                                <strong>
                                    {selectedDate || "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Ora</span>
                                <strong>
                                    {selectedTime
                                        ? selectedTime.slice(0, 5)
                                        : "—"}
                                </strong>
                            </div>
                        </div>

                        <label className="booking-notes">
                            Observații

                            <textarea
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                placeholder="Opțional"
                                rows={4}
                            />
                        </label>

                        <button
                            type="button"
                            className="booking-submit"
                            disabled={
                                !selectedServiceId ||
                                !selectedDate ||
                                !selectedTime ||
                                creatingAppointment
                            }
                            onClick={handleCreateAppointment}
                        >
                            {creatingAppointment
                                ? "Se creează programarea..."
                                : "Confirmă programarea"}
                        </button>
                    </div>
                </section>
            </section>
        </main>
    );
}

export default BookingPage;