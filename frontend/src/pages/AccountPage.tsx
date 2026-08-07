import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { logout } from "../services/auth";
import type { AppointmentResponse } from "../types";

function AccountPage() {
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    const loadAppointments = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get<AppointmentResponse[]>(
                "/appointments/me"
            );

            setAppointments(response.data);
        } catch {
            setError("Programările nu au putut fi încărcate.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const activeAppointments = useMemo(
        () =>
            appointments
                .filter(
                    (appointment) =>
                        appointment.status === "PENDING" ||
                        appointment.status === "CONFIRMED"
                )
                .sort((a, b) =>
                    `${a.date}T${a.startTime}`.localeCompare(
                        `${b.date}T${b.startTime}`
                    )
                ),
        [appointments]
    );

    const historyAppointments = useMemo(
        () =>
            appointments
                .filter(
                    (appointment) =>
                        appointment.status !== "PENDING" &&
                        appointment.status !== "CONFIRMED"
                )
                .sort((a, b) =>
                    `${b.date}T${b.startTime}`.localeCompare(
                        `${a.date}T${a.startTime}`
                    )
                ),
        [appointments]
    );

    const handleCancel = async (appointmentId: number) => {
        setCancellingId(appointmentId);
        setError("");

        try {
            const response = await api.put<AppointmentResponse>(
                `/appointments/${appointmentId}/cancel`
            );

            setAppointments((current) =>
                current.map((appointment) =>
                    appointment.id === appointmentId
                        ? response.data
                        : appointment
                )
            );
        } catch {
            setError("Programarea nu a putut fi anulată.");
        } finally {
            setCancellingId(null);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleLogout = () => {
        logout();
        navigate("/", {
            replace: true,
        });
    };

    return (
        <main className="account-page">
            <header className="account-header">
                <Link to="/" className="account-header__brand">
                    MIHAIFADE
                </Link>

                <div className="account-header__actions">
                    <button
                        type="button"
                        className="account-header__back"
                        onClick={handleBack}
                    >
                        Înapoi
                    </button>

                    <Link
                        to="/programare"
                        className="account-header__booking"
                    >
                        Programare nouă
                    </Link>

                    <button
                        type="button"
                        className="account-header__logout"
                        onClick={handleLogout}
                    >
                        Ieși din cont
                    </button>
                </div>
            </header>

            <section className="account-content">
                <div className="account-intro">
                    <p className="section-eyebrow">
                        CONTUL MEU
                    </p>

                    <h1>
                        Programările mele.
                    </h1>

                    <p>
                        Vezi programările active, istoricul și anulează
                        programările care nu mai sunt de actualitate.
                    </p>
                </div>

                {error && (
                    <p className="account-error">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p className="account-message">
                        Se încarcă programările...
                    </p>
                ) : (
                    <>
                        <section className="account-section">
                            <div className="account-section__header">
                                <div>
                                    <p className="section-eyebrow">
                                        URMEAZĂ
                                    </p>

                                    <h2>
                                        Programări active
                                    </h2>
                                </div>

                                <span>
                                    {activeAppointments.length}
                                </span>
                            </div>

                            {activeAppointments.length === 0 ? (
                                <div className="account-empty">
                                    <p>
                                        Nu ai nicio programare activă.
                                    </p>

                                    <Link to="/programare">
                                        Fă o programare
                                    </Link>
                                </div>
                            ) : (
                                <div className="account-appointments">
                                    {activeAppointments.map((appointment) => (
                                        <article
                                            key={appointment.id}
                                            className="account-appointment"
                                        >
                                            <div className="account-appointment__main">
                                                <div>
                                                    <span className="account-appointment__status">
                                                        {appointment.status}
                                                    </span>

                                                    <h3>
                                                        {appointment.serviceName}
                                                    </h3>

                                                    <p>
                                                        {appointment.barberName}
                                                    </p>
                                                </div>

                                                <div className="account-appointment__date">
                                                    <strong>
                                                        {appointment.date}
                                                    </strong>

                                                    <span>
                                                        {appointment.startTime.slice(
                                                            0,
                                                            5
                                                        )}
                                                        {" - "}
                                                        {appointment.endTime.slice(
                                                            0,
                                                            5
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {appointment.notes && (
                                                <p className="account-appointment__notes">
                                                    {appointment.notes}
                                                </p>
                                            )}

                                            <div className="account-appointment__actions">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        cancellingId ===
                                                        appointment.id
                                                    }
                                                    onClick={() =>
                                                        handleCancel(
                                                            appointment.id
                                                        )
                                                    }
                                                >
                                                    {cancellingId ===
                                                    appointment.id
                                                        ? "Se anulează..."
                                                        : "Anulează programarea"}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="account-section">
                            <div className="account-section__header">
                                <div>
                                    <p className="section-eyebrow">
                                        ISTORIC
                                    </p>

                                    <h2>
                                        Programări anterioare
                                    </h2>
                                </div>

                                <span>
                                    {historyAppointments.length}
                                </span>
                            </div>

                            {historyAppointments.length === 0 ? (
                                <p className="account-message">
                                    Nu există încă programări în istoric.
                                </p>
                            ) : (
                                <div className="account-history">
                                    {historyAppointments.map((appointment) => (
                                        <article
                                            key={appointment.id}
                                            className="account-history__item"
                                        >
                                            <div>
                                                <span>
                                                    {appointment.status}
                                                </span>

                                                <strong>
                                                    {appointment.serviceName}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    {appointment.date}
                                                </span>

                                                <strong>
                                                    {appointment.startTime.slice(
                                                        0,
                                                        5
                                                    )}
                                                </strong>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </section>
        </main>
    );
}

export default AccountPage;