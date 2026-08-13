import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getRole, logout } from "../services/auth";
import type { AppointmentResponse } from "../types";

function AccountPage() {
    const navigate = useNavigate();
    const role = getRole();

    const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [deletingAccount, setDeletingAccount] = useState(false);

    const loadAppointments = async () => {
        setLoading(true);
        setError("");

        try {
            if (role === "CLIENT") {
                const response =
                    await api.get<AppointmentResponse[]>(
                        "/appointments/me"
                    );

                setAppointments(response.data);
                return;
            }

            if (
                role === "BARBER" ||
                role === "OWNER"
            ) {
                const response =
                    await api.get<AppointmentResponse[]>(
                        "/appointments/barber/me"
                    );

                setAppointments(response.data);
                return;
            }

            setAppointments([]);
            setError(
                "Rolul contului nu a putut fi identificat."
            );
        } catch {
            setError(
                role === "CLIENT"
                    ? "Programările nu au putut fi încărcate."
                    : "Programările barberului nu au putut fi încărcate."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, [role]);

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
        if (role !== "CLIENT") {
            return;
        }

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

    const handleBarberStatusChange = async (
        appointmentId: number,
        status: "COMPLETED" | "CANCELLED" | "NO_SHOW"
    ) => {
        if (
            role !== "BARBER" &&
            role !== "OWNER"
        ) {
            return;
        }

        setCancellingId(appointmentId);
        setError("");

        try {
            const response = await api.put<AppointmentResponse>(
                `/appointments/barber/me/${appointmentId}/status`,
                null,
                {
                    params: {
                        status,
                    },
                }
            );

            setAppointments((current) =>
                current.map((appointment) =>
                    appointment.id === appointmentId
                        ? response.data
                        : appointment
                )
            );
        } catch {
            setError(
                "Statusul programării nu a putut fi actualizat."
            );
        } finally {
            setCancellingId(null);
        }
    };

    const handleBack = () => {
        navigate("/");
    };

    const handleLogout = () => {
        logout();

        navigate("/", {
            replace: true,
        });
    };

    const handleDeleteAccount = async () => {
        if (role !== "CLIENT") {
            return;
        }

        const confirmed = window.confirm(
            "Sigur vrei să îți ștergi contul? Nu vei mai putea folosi acest cont pentru autentificare."
        );

        if (!confirmed) {
            return;
        }

        setDeletingAccount(true);
        setError("");

        try {
            await api.delete("/users/me");

            logout();

            navigate("/", {
                replace: true,
            });
        } catch {
            setError(
                "Contul nu a putut fi șters. Încearcă din nou."
            );
        } finally {
            setDeletingAccount(false);
        }
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

                    {role === "CLIENT" && (
                        <Link
                            to="/programare"
                            className="account-header__booking"
                        >
                            Programare nouă
                        </Link>
                    )}

                    {role === "OWNER" && (
                        <Link
                            to="/admin"
                            className="account-header__booking"
                        >
                            Panou
                        </Link>
                    )}

                    {role === "BARBER" && (
                        <Link
                            to="/barber"
                            className="account-header__booking"
                        >
                            Panou
                        </Link>
                    )}

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
                        {role === "CLIENT"
                            ? "Programările mele."
                            : "Programările mele ca barber."}
                    </h1>

                    <p>
                        {role === "CLIENT"
                            ? "Vezi programările active, istoricul și anulează programările care nu mai sunt de actualitate."
                            : "Vezi programările tale de barber și actualizează statusul lor."}
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

                                    {role === "CLIENT" && (
                                        <Link to="/programare">
                                            Fă o programare
                                        </Link>
                                    )}
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
                                                {role === "CLIENT" ? (
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
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                cancellingId ===
                                                                appointment.id
                                                            }
                                                            onClick={() =>
                                                                handleBarberStatusChange(
                                                                    appointment.id,
                                                                    "COMPLETED"
                                                                )
                                                            }
                                                        >
                                                            Finalizează
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                cancellingId ===
                                                                appointment.id
                                                            }
                                                            onClick={() =>
                                                                handleBarberStatusChange(
                                                                    appointment.id,
                                                                    "NO_SHOW"
                                                                )
                                                            }
                                                        >
                                                            No show
                                                        </button>
                                                    </>
                                                )}
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

                        {role === "CLIENT" && (
                        <section className="account-danger">
                            <div>
                                <p className="section-eyebrow">
                                    CONT
                                </p>

                                <h2>
                                    Șterge contul
                                </h2>

                                <p>
                                    Contul va fi dezactivat și nu te vei
                                    mai putea autentifica folosind acest cont.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deletingAccount}
                            >
                                {deletingAccount
                                    ? "Se șterge..."
                                    : "Șterge contul"}
                            </button>
                        </section>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

export default AccountPage;