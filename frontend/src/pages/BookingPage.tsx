import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import type {
    AppointmentResponse,
    AvailabilityResponse,
    BarbershopService,
} from "../types";

interface BarberResponse {
    id: number;
    displayName: string;
    bio: string | null;
    imageUrl: string | null;
    active: boolean;
    services: BarbershopService[];
}

interface BarberServiceOfferingResponse {
    id: number;
    barberId: number;
    barberName: string;
    serviceId: number;
    serviceName: string;
    serviceDescription: string | null;
    price: number;
    durationMinutes: number;
    active: boolean;
}

function BookingPage() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [barbers, setBarbers] = useState<BarberResponse[]>([]);
    const [selectedBarberId, setSelectedBarberId] = useState<number | null>(
        null
    );

    const [services, setServices] = useState<BarbershopService[]>([]);
    const [barberOfferings, setBarberOfferings] =
        useState<BarberServiceOfferingResponse[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
        null
    );
    const [selectedDate, setSelectedDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [notes, setNotes] = useState("");

    const [loadingBarbers, setLoadingBarbers] = useState(true);
    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingOfferings, setLoadingOfferings] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [creatingAppointment, setCreatingAppointment] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState<AppointmentResponse | null>(null);

    const selectedBarber = useMemo(
        () =>
            barbers.find(
                (barber) => barber.id === selectedBarberId
            ) ?? null,
        [barbers, selectedBarberId]
    );

    const visibleServices = useMemo(() => {
        if (!selectedBarberId) {
            return [];
        }

        return barberOfferings
            .filter(
                (offering) =>
                    offering.active
            )
            .sort((a, b) =>
                a.serviceName.localeCompare(
                    b.serviceName,
                    "ro-RO"
                )
            );
    }, [
        barberOfferings,
        selectedBarberId,
    ]);

    const selectedService = useMemo(
        () =>
            visibleServices.find(
                (service) =>
                    service.serviceId ===
                    selectedServiceId
            ) ?? null,
        [
            visibleServices,
            selectedServiceId,
        ]
    );

    useEffect(() => {
        const loadBookingData = async () => {
            setLoadingBarbers(true);
            setLoadingServices(true);

            try {
                const [barbersResponse, servicesResponse] =
                    await Promise.all([
                        api.get<BarberResponse[]>("/barbers"),
                        api.get<BarbershopService[]>("/services"),
                    ]);

                const activeServices =
                    servicesResponse.data.filter(
                        (service) => service.active
                    );

                const activeBarbers =
                    barbersResponse.data.filter(
                        (barber) => barber.active
                    );

                setServices(activeServices);
                setBarbers(activeBarbers);

                const barberIdFromUrl = Number(
                    searchParams.get("barberId")
                );

                const serviceIdFromUrl = Number(
                    searchParams.get("serviceId")
                );

                const initialBarber =
                    activeBarbers.find(
                        (barber) =>
                            barber.id === barberIdFromUrl
                    ) ??
                    activeBarbers.find((barber) =>
                        (barber.services ?? []).some(
                            (service) =>
                                service.id === serviceIdFromUrl &&
                                service.active
                        )
                    ) ??
                    null;

                if (initialBarber) {
                    setSelectedBarberId(
                        initialBarber.id
                    );

                    if (serviceIdFromUrl) {
                        setSelectedServiceId(
                            serviceIdFromUrl
                        );
                    }
                }
            } catch {
                setError(
                    "Barberii și serviciile nu au putut fi încărcate."
                );
            } finally {
                setLoadingBarbers(false);
                setLoadingServices(false);
            }
        };

        loadBookingData();
    }, [searchParams]);

    useEffect(() => {
        if (!selectedBarberId) {
            setBarberOfferings([]);
            setSelectedServiceId(null);
            return;
        }

        const loadBarberOfferings = async () => {
            setLoadingOfferings(true);
            setError("");

            try {
                const response =
                    await api.get<
                        BarberServiceOfferingResponse[]
                    >(
                        `/barber-service-offerings/barber/${selectedBarberId}/active`
                    );

                setBarberOfferings(
                    response.data
                );

                setSelectedServiceId(
                    (current) => {
                        if (!current) {
                            return null;
                        }

                        const stillAvailable =
                            response.data.some(
                                (offering) =>
                                    offering.serviceId ===
                                    current &&
                                    offering.active
                            );

                        return stillAvailable
                            ? current
                            : null;
                    }
                );
            } catch {
                setBarberOfferings([]);
                setSelectedServiceId(null);
                setError(
                    "Serviciile barberului selectat nu au putut fi încărcate."
                );
            } finally {
                setLoadingOfferings(false);
            }
        };

        loadBarberOfferings();
    }, [selectedBarberId]);

    useEffect(() => {
        if (
            !selectedBarberId ||
            !selectedServiceId ||
            !selectedDate
        ) {
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
                            barberId: selectedBarberId,
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
    }, [
        selectedBarberId,
        selectedServiceId,
        selectedDate,
    ]);

    const handleCreateAppointment = async () => {
        if (
            !selectedBarberId ||
            !selectedServiceId ||
            !selectedDate ||
            !selectedTime
        ) {
            setError(
                "Alege barberul, serviciul, data și ora înainte de confirmare."
            );
            return;
        }

        setCreatingAppointment(true);
        setError("");

        try {
            const response = await api.post<AppointmentResponse>(
                "/appointments",
                {
                    barberId: selectedBarberId,
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
                            <span>Barber</span>
                            <strong>{success.barberName}</strong>
                        </div>

                        <div>
                            <span>Serviciu</span>
                            <strong>{success.serviceName}</strong>
                        </div>

                        <div>
                            <span>Preț</span>
                            <strong>
                                {success.servicePrice} lei
                            </strong>
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
                        onClick={() => navigate("/")}
                     >           
                        Înapoi
                    </button>

                <Link to="/" className="booking-header__brand">
                MIHAIFADE
                </Link>
                </div>

                <div className="booking-header__steps">
                    <span className={selectedBarberId ? "active" : ""}>
                        01 Barber
                    </span>

                    <span className={selectedServiceId ? "active" : ""}>
                        02 Serviciu
                    </span>

                    <span className={selectedDate ? "active" : ""}>
                        03 Data
                    </span>

                    <span className={selectedTime ? "active" : ""}>
                        04 Ora
                    </span>

                    <span>
                        05 Confirmare
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
                        Alege barberul, serviciul, data și ora disponibilă.
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
                                Alege barberul
                            </h2>

                            <p>
                                Selectează barberul la care vrei să te programezi.
                            </p>
                        </div>
                    </div>

                    {loadingBarbers ? (
                        <p className="booking-message">
                            Se încarcă barberii...
                        </p>
                    ) : barbers.length === 0 ? (
                        <p className="booking-message">
                            Nu există barberi disponibili momentan.
                        </p>
                    ) : (
                        <div className="booking-services">
                            {barbers.map((barber) => (
                                <button
                                    type="button"
                                    key={barber.id}
                                    className={
                                        selectedBarberId === barber.id
                                            ? "booking-service booking-service--selected"
                                            : "booking-service"
                                    }
                                    onClick={() => {
                                        setSelectedBarberId(barber.id);
                                        setBarberOfferings([]);
                                        setSelectedServiceId(null);
                                        setSelectedDate("");
                                        setSelectedTime("");
                                        setAvailableSlots([]);
                                    }}
                                >
                                    <div>
                                        <h3>{barber.displayName}</h3>
                                        <p>
                                            {barber.bio ||
                                                "Alege acest barber pentru programare."}
                                        </p>
                                    </div>

                                    <div className="booking-service__meta">
                                        <span>
                                            {(barber.services ?? []).filter(
                                                (service) => service.active
                                            ).length} servicii
                                        </span>

                                        <strong>Alege</strong>
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
                                Alege serviciul
                            </h2>

                            <p>
                                Selectează serviciul dorit.
                            </p>
                        </div>
                    </div>

                    {!selectedBarberId ? (
                        <p className="booking-message">
                            Alege mai întâi barberul.
                        </p>
                    ) : loadingServices || loadingOfferings ? (
                        <p className="booking-message">
                            Se încarcă serviciile barberului...
                        </p>
                    ) : visibleServices.length === 0 ? (
                        <p className="booking-message">
                            Barberul selectat nu are servicii active momentan.
                        </p>
                    ) : (
                        <div className="booking-services">
                            {visibleServices.map((service) => (
                                <button
                                    type="button"
                                    key={service.id}
                                    className={
                                        selectedServiceId === service.serviceId
                                            ? "booking-service booking-service--selected"
                                            : "booking-service"
                                    }
                                    onClick={() => {
                                        setSelectedServiceId(
                                            service.serviceId
                                        );
                                        setSelectedDate("");
                                        setSelectedTime("");
                                        setAvailableSlots([]);
                                    }}
                                >
                                    <div>
                                        <h3>
                                            {service.serviceName}
                                        </h3>

                                        <p>
                                            {service.serviceDescription ||
                                                "Fără descriere"}
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
                        <span>03</span>

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
                        disabled={
                            !selectedBarberId ||
                            !selectedServiceId
                        }
                        onChange={(event) => {
                            setSelectedDate(event.target.value);
                            setSelectedTime("");
                        }}
                    />
                </section>

                <section className="booking-step">
                    <div className="booking-step__title">
                        <span>04</span>

                        <div>
                            <h2>
                                Alege ora
                            </h2>

                            <p>
                                Orele vin în timp real din programul barberului selectat.
                            </p>
                        </div>
                    </div>

                    {!selectedDate && (
                        <p className="booking-message">
                            Alege mai întâi barberul, serviciul și data.
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
                        <span>05</span>

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
                                <span>Barber</span>
                                <strong>
                                    {selectedBarber?.displayName ?? "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Serviciu</span>
                                <strong>
                                    {selectedService?.serviceName ?? "—"}
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
                                !selectedBarberId ||
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