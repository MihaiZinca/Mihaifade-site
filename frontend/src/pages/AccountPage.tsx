import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getRole, logout } from "../services/auth";
import {
    arePushNotificationsEnabled,
    disablePushNotifications,
    enablePushNotifications,
} from "../services/pushSubscriptions";
import type {
    AppointmentResponse,
    AvailabilityResponse,
} from "../types";

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

function AccountPage() {
    const navigate = useNavigate();
    const role = getRole();

    const [appointments, setAppointments] =
        useState<AppointmentResponse[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [cancellingId, setCancellingId] =
        useState<number | null>(null);

    const [deletingAccount, setDeletingAccount] =
        useState(false);

    /*
     * RESCHEDULE
     */

    const [reschedulingAppointment, setReschedulingAppointment] =
        useState<AppointmentResponse | null>(null);

    const [rescheduleDate, setRescheduleDate] =
        useState("");

    const [rescheduleSlots, setRescheduleSlots] =
        useState<string[]>([]);

    const [rescheduleTime, setRescheduleTime] =
        useState("");

    const [rescheduleLoadingSlots, setRescheduleLoadingSlots] =
        useState(false);

    const [rescheduleSaving, setRescheduleSaving] =
        useState(false);

    const [rescheduleError, setRescheduleError] =
        useState("");

    const [rescheduleSuccess, setRescheduleSuccess] =
        useState("");

    /*
     * PUSH NOTIFICATIONS
     */

    const [notificationsEnabled, setNotificationsEnabled] =
        useState(
            role === "CLIENT" &&
            arePushNotificationsEnabled()
        );

    const [notificationLoading, setNotificationLoading] =
        useState(false);

    const [notificationError, setNotificationError] =
        useState("");

    const [notificationSuccess, setNotificationSuccess] =
        useState("");

    /*
     * REVIEW
     */

    const [review, setReview] =
        useState<ReviewResponse | null>(null);

    const [reviewRating, setReviewRating] =
        useState(5);

    const [reviewComment, setReviewComment] =
        useState("");

    const [reviewLoading, setReviewLoading] =
        useState(false);

    const [reviewSaving, setReviewSaving] =
        useState(false);

    const [reviewDeleting, setReviewDeleting] =
        useState(false);

    const [reviewError, setReviewError] =
        useState("");

    const [reviewSuccess, setReviewSuccess] =
        useState("");

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

    const loadMyReview = async () => {
        if (role !== "CLIENT") {
            return;
        }

        setReviewLoading(true);
        setReviewError("");

        try {
            const response =
                await api.get<ReviewResponse | null>(
                    "/reviews/me"
                );

            const reviewData =
                response.data;

            if (
                response.status === 204 ||
                !reviewData
            ) {
                setReview(null);
                setReviewRating(5);
                setReviewComment("");
                return;
            }

            setReview(
                reviewData
            );

            setReviewRating(
                reviewData.rating
            );

            setReviewComment(
                reviewData.comment
            );
        } catch {
            setReview(null);
            setReviewRating(5);
            setReviewComment("");
        } finally {
            setReviewLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();

        if (role === "CLIENT") {
            loadMyReview();
        }
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

    const handleCancel = async (
        appointmentId: number
    ) => {
        if (role !== "CLIENT") {
            return;
        }

        setCancellingId(appointmentId);
        setError("");

        try {
            const response =
                await api.put<AppointmentResponse>(
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
            setError(
                "Programarea nu a putut fi anulată."
            );
        } finally {
            setCancellingId(null);
        }
    };

    const handleOpenReschedule = async (
        appointment: AppointmentResponse
    ) => {
        if (role !== "CLIENT") {
            return;
        }

        setReschedulingAppointment(
            appointment
        );

        setRescheduleDate(
            appointment.date
        );

        setRescheduleSlots([]);
        setRescheduleTime("");
        setRescheduleError("");
        setRescheduleSuccess("");

        setRescheduleLoadingSlots(true);

        try {
            const response =
                await api.get<AvailabilityResponse>(
                    "/availability",
                    {
                        params: {
                            barberId:
                                appointment.barberId,
                            serviceId:
                                appointment.serviceId,
                            date:
                                appointment.date,
                            excludeAppointmentId:
                                appointment.id,
                        },
                    }
                );

            setRescheduleSlots(
                response.data.availableSlots
            );
        } catch {
            setRescheduleSlots([]);

            setRescheduleError(
                "Orele disponibile nu au putut fi încărcate."
            );
        } finally {
            setRescheduleLoadingSlots(false);
        }
    };

    const handleCloseReschedule = () => {
        if (rescheduleSaving) {
            return;
        }

        setReschedulingAppointment(null);
        setRescheduleDate("");
        setRescheduleSlots([]);
        setRescheduleTime("");
        setRescheduleError("");
        setRescheduleSuccess("");
    };

    const handleRescheduleDateChange = async (
        appointment: AppointmentResponse,
        date: string
    ) => {
        setRescheduleDate(date);
        setRescheduleTime("");
        setRescheduleSlots([]);
        setRescheduleError("");
        setRescheduleSuccess("");

        if (!date) {
            return;
        }

        setRescheduleLoadingSlots(true);

        try {
            const response =
                await api.get<AvailabilityResponse>(
                    "/availability",
                    {
                        params: {
                            barberId: appointment.barberId,
                            serviceId: appointment.serviceId,
                            date,
                            excludeAppointmentId: appointment.id,
                        },
                    }
                );

            setRescheduleSlots(
                response.data.availableSlots
            );
        } catch {
            setRescheduleSlots([]);
            setRescheduleError(
                "Orele disponibile nu au putut fi încărcate."
            );
        } finally {
            setRescheduleLoadingSlots(false);
        }
    };

    const handleReschedule = async () => {
        if (
            role !== "CLIENT" ||
            !reschedulingAppointment
        ) {
            return;
        }

        if (!rescheduleDate || !rescheduleTime) {
            setRescheduleError(
                "Alege noua dată și noua oră."
            );
            return;
        }

        setRescheduleSaving(true);
        setRescheduleError("");
        setRescheduleSuccess("");

        try {
            const response =
                await api.put<AppointmentResponse>(
                    `/appointments/${reschedulingAppointment.id}/reschedule`,
                    {
                        date: rescheduleDate,
                        startTime: rescheduleTime,
                    }
                );

            setAppointments((current) =>
                current.map((appointment) =>
                    appointment.id ===
                    reschedulingAppointment.id
                        ? response.data
                        : appointment
                )
            );

            setReschedulingAppointment(response.data);
            setRescheduleDate(response.data.date);
            setRescheduleSlots([]);
            setRescheduleTime("");
            setRescheduleSuccess(
                "Programarea a fost modificată."
            );
        } catch {
            setRescheduleError(
                "Programarea nu a putut fi modificată. Este posibil ca ora să fi fost ocupată între timp."
            );
        } finally {
            setRescheduleSaving(false);
        }
    };

    const handleBarberStatusChange = async (
        appointmentId: number,
        status:
            | "COMPLETED"
            | "CANCELLED"
            | "NO_SHOW"
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
            const response =
                await api.put<AppointmentResponse>(
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

    /*
     * REVIEW - SAVE
     */

    const handleSaveReview = async () => {
        if (role !== "CLIENT") {
            return;
        }

        const cleanComment =
            reviewComment.trim();

        setReviewError("");
        setReviewSuccess("");

        if (
            reviewRating < 1 ||
            reviewRating > 5
        ) {
            setReviewError(
                "Alege un rating între 1 și 5 stele."
            );
            return;
        }

        if (!cleanComment) {
            setReviewError(
                "Scrie câteva cuvinte despre experiența ta."
            );
            return;
        }

        if (cleanComment.length > 1500) {
            setReviewError(
                "Recenzia poate avea maximum 1500 de caractere."
            );
            return;
        }

        setReviewSaving(true);

        try {
            const payload = {
                rating: reviewRating,
                comment: cleanComment,
            };

            let response;

            if (review) {
                response =
                    await api.put<ReviewResponse>(
                        "/reviews/me",
                        payload
                    );
            } else {
                response =
                    await api.post<ReviewResponse>(
                        "/reviews/me",
                        payload
                    );
            }

            setReview(response.data);

            setReviewRating(
                response.data.rating
            );

            setReviewComment(
                response.data.comment
            );

            setReviewSuccess(
                review
                    ? "Recenzia a fost actualizată."
                    : "Recenzia a fost publicată. Mulțumim!"
            );
        } catch {
            setReviewError(
                review
                    ? "Recenzia nu a putut fi actualizată."
                    : "Recenzia nu a putut fi publicată."
            );
        } finally {
            setReviewSaving(false);
        }
    };

    /*
     * REVIEW - DELETE
     */

    const handleDeleteReview = async () => {
        if (
            role !== "CLIENT" ||
            !review
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                "Sigur vrei să ștergi recenzia?"
            );

        if (!confirmed) {
            return;
        }

        setReviewDeleting(true);
        setReviewError("");
        setReviewSuccess("");

        try {
            await api.delete(
                "/reviews/me"
            );

            setReview(null);
            setReviewRating(5);
            setReviewComment("");

            setReviewSuccess(
                "Recenzia a fost ștearsă."
            );
        } catch {
            setReviewError(
                "Recenzia nu a putut fi ștearsă."
            );
        } finally {
            setReviewDeleting(false);
        }
    };

    /*
     * PUSH NOTIFICATIONS
     */

    const handleEnableNotifications = async () => {
        if (role !== "CLIENT") {
            return;
        }

        setNotificationLoading(true);
        setNotificationError("");
        setNotificationSuccess("");

        try {
            const result =
                await enablePushNotifications();

            if (!result.success) {
                if (
                    "Notification" in window &&
                    Notification.permission === "denied"
                ) {
                    setNotificationError(
                        "Notificările sunt blocate în browser. Activează-le din setările site-ului și încearcă din nou."
                    );
                } else {
                    setNotificationError(
                        "Notificările nu au putut fi activate pe acest dispozitiv."
                    );
                }

                return;
            }

            setNotificationsEnabled(true);

            setNotificationSuccess(
                "Notificările au fost activate pe acest dispozitiv."
            );
        } catch {
            setNotificationError(
                "Notificările nu au putut fi activate. Încearcă din nou."
            );
        } finally {
            setNotificationLoading(false);
        }
    };

    const handleDisableNotifications = async () => {
        if (role !== "CLIENT") {
            return;
        }

        setNotificationLoading(true);
        setNotificationError("");
        setNotificationSuccess("");

        try {
            await disablePushNotifications();

            setNotificationsEnabled(false);

            setNotificationSuccess(
                "Notificările au fost dezactivate pe acest dispozitiv."
            );
        } catch {
            setNotificationError(
                "Notificările nu au putut fi dezactivate. Încearcă din nou."
            );
        } finally {
            setNotificationLoading(false);
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

        const confirmed =
            window.confirm(
                "Sigur vrei să îți ștergi contul? Nu vei mai putea folosi acest cont pentru autentificare."
            );

        if (!confirmed) {
            return;
        }

        setDeletingAccount(true);
        setError("");

        try {
            await api.delete(
                "/users/me"
            );

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
                <Link
                    to="/"
                    className="account-header__brand"
                >
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
                                    {
                                        activeAppointments.length
                                    }
                                </span>
                            </div>

                            {activeAppointments.length ===
                            0 ? (
                                <div className="account-empty">
                                    <p>
                                        Nu ai nicio
                                        programare activă.
                                    </p>

                                    {role ===
                                        "CLIENT" && (
                                        <Link to="/programare">
                                            Fă o programare
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="account-appointments">
                                    {activeAppointments.map(
                                        (
                                            appointment
                                        ) => (
                                            <article
                                                key={
                                                    appointment.id
                                                }
                                                className="account-appointment"
                                            >
                                                <div className="account-appointment__main">
                                                    <div>
                                                        <span className="account-appointment__status">
                                                            {
                                                                appointment.status
                                                            }
                                                        </span>

                                                        <h3>
                                                            {
                                                                appointment.serviceName
                                                            }
                                                        </h3>

                                                        <p>
                                                            {
                                                                appointment.barberName
                                                            }
                                                        </p>
                                                    </div>

                                                    <div className="account-appointment__date">
                                                        <strong>
                                                            {
                                                                appointment.date
                                                            }
                                                        </strong>

                                                        <span>
                                                            {appointment.startTime.slice(
                                                                0,
                                                                5
                                                            )}

                                                            {
                                                                " - "
                                                            }

                                                            {appointment.endTime.slice(
                                                                0,
                                                                5
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {appointment.notes && (
                                                    <p className="account-appointment__notes">
                                                        {
                                                            appointment.notes
                                                        }
                                                    </p>
                                                )}

                                                <div className="account-appointment__actions">
                                                    {role ===
                                                    "CLIENT" ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="account-appointment__reschedule"
                                                                disabled={
                                                                    cancellingId ===
                                                                        appointment.id ||
                                                                    rescheduleSaving
                                                                }
                                                                onClick={() =>
                                                                    handleOpenReschedule(
                                                                        appointment
                                                                    )
                                                                }
                                                            >
                                                                Modifică programarea
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    cancellingId ===
                                                                        appointment.id ||
                                                                    rescheduleSaving
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
                                                        </>
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
                                                                No
                                                                show
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                {role === "CLIENT" &&
                                                    reschedulingAppointment?.id ===
                                                        appointment.id && (
                                                        <div className="account-reschedule">
                                                            <div className="account-reschedule__header">
                                                                <div>
                                                                    <span>MODIFICĂ PROGRAMAREA</span>
                                                                    <strong>{appointment.serviceName}</strong>
                                                                    <p>Barber: {appointment.barberName}</p>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    className="account-reschedule__close"
                                                                    onClick={handleCloseReschedule}
                                                                    disabled={rescheduleSaving}
                                                                >
                                                                    Închide
                                                                </button>
                                                            </div>

                                                            <div className="account-reschedule__current">
                                                                <span>Programarea actuală</span>
                                                                <strong>
                                                                    {appointment.date} ·{" "}
                                                                    {appointment.startTime.slice(0, 5)}
                                                                </strong>
                                                            </div>

                                                            <label className="account-reschedule__field">
                                                                <span>Noua dată</span>
                                                                <input
                                                                    type="date"
                                                                    value={rescheduleDate}
                                                                    min={new Date().toISOString().split("T")[0]}
                                                                    disabled={rescheduleSaving}
                                                                    onChange={(event) =>
                                                                        handleRescheduleDateChange(
                                                                            appointment,
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                />
                                                            </label>

                                                            <div className="account-reschedule__times">
                                                                <span className="account-reschedule__label">
                                                                    Noua oră
                                                                </span>

                                                                {rescheduleLoadingSlots && (
                                                                    <p className="account-message">
                                                                        Verificăm orele disponibile...
                                                                    </p>
                                                                )}

                                                                {!rescheduleLoadingSlots &&
                                                                    rescheduleDate &&
                                                                    rescheduleSlots.length === 0 &&
                                                                    !rescheduleError && (
                                                                        <p className="account-message">
                                                                            Nu există ore disponibile pentru această zi.
                                                                        </p>
                                                                    )}

                                                                {!rescheduleLoadingSlots &&
                                                                    rescheduleSlots.length > 0 && (
                                                                        <div className="account-reschedule__slots">
                                                                            {rescheduleSlots.map((slot) => (
                                                                                <button
                                                                                    type="button"
                                                                                    key={slot}
                                                                                    className={
                                                                                        rescheduleTime === slot
                                                                                            ? "account-reschedule__slot account-reschedule__slot--selected"
                                                                                            : "account-reschedule__slot"
                                                                                    }
                                                                                    onClick={() => {
                                                                                        setRescheduleTime(slot);
                                                                                        setRescheduleError("");
                                                                                        setRescheduleSuccess("");
                                                                                    }}
                                                                                    disabled={rescheduleSaving}
                                                                                >
                                                                                    {slot.slice(0, 5)}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            {rescheduleError && (
                                                                <p className="account-reschedule__error">
                                                                    {rescheduleError}
                                                                </p>
                                                            )}

                                                            {rescheduleSuccess && (
                                                                <p className="account-reschedule__success">
                                                                    {rescheduleSuccess}
                                                                </p>
                                                            )}

                                                            <div className="account-reschedule__actions">
                                                                <button
                                                                    type="button"
                                                                    className="account-reschedule__save"
                                                                    onClick={handleReschedule}
                                                                    disabled={
                                                                        !rescheduleDate ||
                                                                        !rescheduleTime ||
                                                                        rescheduleSaving
                                                                    }
                                                                >
                                                                    {rescheduleSaving
                                                                        ? "Se modifică..."
                                                                        : "Confirmă modificarea"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="account-reschedule__cancel"
                                                                    onClick={handleCloseReschedule}
                                                                    disabled={rescheduleSaving}
                                                                >
                                                                    Renunță
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                            </article>
                                        )
                                    )}
                                </div>
                            )}
                        </section>

                        {role === "CLIENT" && (
                            <section className="account-section account-notifications">
                                <div className="account-section__header">
                                    <div>
                                        <p className="section-eyebrow">
                                            NOTIFICĂRI
                                        </p>

                                        <h2>
                                            Remindere pentru programări
                                        </h2>
                                    </div>

                                    <span>
                                        {notificationsEnabled
                                            ? "ACTIVE"
                                            : "OFF"}
                                    </span>
                                </div>

                                <div className="account-notifications__content">
                                    <div className="account-notifications__copy">
                                        <p>
                                            Activează notificările pentru a primi
                                            remindere și actualizări importante
                                            despre programările tale.
                                        </p>

                                        <small>
                                            Permisiunea se aplică doar acestui
                                            browser și acestui dispozitiv.
                                        </small>
                                    </div>

                                    {notificationError && (
                                        <p className="account-notifications__error">
                                            {notificationError}
                                        </p>
                                    )}

                                    {notificationSuccess && (
                                        <p className="account-notifications__success">
                                            {notificationSuccess}
                                        </p>
                                    )}

                                    <div className="account-notifications__actions">
                                        {notificationsEnabled ? (
                                            <button
                                                type="button"
                                                className="account-notifications__disable"
                                                onClick={
                                                    handleDisableNotifications
                                                }
                                                disabled={
                                                    notificationLoading
                                                }
                                            >
                                                {notificationLoading
                                                    ? "Se dezactivează..."
                                                    : "Dezactivează notificările"}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="account-notifications__enable"
                                                onClick={
                                                    handleEnableNotifications
                                                }
                                                disabled={
                                                    notificationLoading
                                                }
                                            >
                                                {notificationLoading
                                                    ? "Se activează..."
                                                    : "Activează notificările"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        <section className="account-section">
                            <div className="account-section__header">
                                <div>
                                    <p className="section-eyebrow">
                                        ISTORIC
                                    </p>

                                    <h2>
                                        Programări
                                        anterioare
                                    </h2>
                                </div>

                                <span>
                                    {
                                        historyAppointments.length
                                    }
                                </span>
                            </div>

                            {historyAppointments.length ===
                            0 ? (
                                <p className="account-message">
                                    Nu există încă
                                    programări în istoric.
                                </p>
                            ) : (
                                <div className="account-history">
                                    {historyAppointments.map(
                                        (
                                            appointment
                                        ) => (
                                            <article
                                                key={
                                                    appointment.id
                                                }
                                                className="account-history__item"
                                            >
                                                <div>
                                                    <span>
                                                        {
                                                            appointment.status
                                                        }
                                                    </span>

                                                    <strong>
                                                        {
                                                            appointment.serviceName
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        {
                                                            appointment.date
                                                        }
                                                    </span>

                                                    <strong>
                                                        {appointment.startTime.slice(
                                                            0,
                                                            5
                                                        )}
                                                    </strong>
                                                </div>
                                            </article>
                                        )
                                    )}
                                </div>
                            )}
                        </section>

                        {role === "CLIENT" && (
                            <section className="account-section account-review">
                                <div className="account-section__header">
                                    <div>
                                        <p className="section-eyebrow">
                                            RECENZIA MEA
                                        </p>

                                        <h2>
                                            Spune-ne cum a
                                            fost.
                                        </h2>
                                    </div>

                                    {review && (
                                        <span>
                                            {
                                                review.rating
                                            }
                                            /5
                                        </span>
                                    )}
                                </div>

                                {reviewLoading ? (
                                    <p className="account-message">
                                        Se încarcă
                                        recenzia...
                                    </p>
                                ) : (
                                    <div className="account-review__content">
                                        <div className="account-review__intro">
                                            <p>
                                                Experiența ta
                                                contează.
                                                Alege numărul
                                                de stele și
                                                spune-ne cum a
                                                fost vizita ta
                                                la MIHAIFADE.
                                            </p>

                                            {review && (
                                                <span className="account-review__published">
                                                    Recenzie
                                                    publicată
                                                </span>
                                            )}
                                        </div>

                                        <div className="account-review__rating">
                                            <span className="account-review__label">
                                                Rating
                                            </span>

                                            <div className="account-review__stars">
                                                {[
                                                    1, 2, 3, 4,
                                                    5,
                                                ].map(
                                                    (
                                                        star
                                                    ) => (
                                                        <button
                                                            key={
                                                                star
                                                            }
                                                            type="button"
                                                            className={
                                                                star <=
                                                                reviewRating
                                                                    ? "account-review__star account-review__star--active"
                                                                    : "account-review__star"
                                                            }
                                                            onClick={() => {
                                                                setReviewRating(
                                                                    star
                                                                );

                                                                setReviewError(
                                                                    ""
                                                                );

                                                                setReviewSuccess(
                                                                    ""
                                                                );
                                                            }}
                                                            aria-label={`${star} stele`}
                                                            title={`${star} stele`}
                                                        >
                                                            ★
                                                        </button>
                                                    )
                                                )}
                                            </div>

                                            <strong>
                                                {
                                                    reviewRating
                                                }
                                                /5
                                            </strong>
                                        </div>

                                        <label className="account-review__field">
                                            <span>
                                                Recenzia ta
                                            </span>

                                            <textarea
                                                value={
                                                    reviewComment
                                                }
                                                onChange={(
                                                    event
                                                ) => {
                                                    setReviewComment(
                                                        event
                                                            .target
                                                            .value
                                                    );

                                                    setReviewError(
                                                        ""
                                                    );

                                                    setReviewSuccess(
                                                        ""
                                                    );
                                                }}
                                                maxLength={
                                                    1500
                                                }
                                                rows={6}
                                                placeholder="Scrie aici cum a fost experiența ta..."
                                            />

                                            <small>
                                                {
                                                    reviewComment.length
                                                }
                                                /1500
                                            </small>
                                        </label>

                                        {reviewError && (
                                            <p className="account-review__error">
                                                {
                                                    reviewError
                                                }
                                            </p>
                                        )}

                                        {reviewSuccess && (
                                            <p className="account-review__success">
                                                {
                                                    reviewSuccess
                                                }
                                            </p>
                                        )}

                                        <div className="account-review__actions">
                                            <button
                                                type="button"
                                                className="account-review__save"
                                                onClick={
                                                    handleSaveReview
                                                }
                                                disabled={
                                                    reviewSaving ||
                                                    reviewDeleting
                                                }
                                            >
                                                {reviewSaving
                                                    ? "Se salvează..."
                                                    : review
                                                      ? "Salvează modificările"
                                                      : "Publică recenzia"}
                                            </button>

                                            {review && (
                                                <button
                                                    type="button"
                                                    className="account-review__delete"
                                                    onClick={
                                                        handleDeleteReview
                                                    }
                                                    disabled={
                                                        reviewSaving ||
                                                        reviewDeleting
                                                    }
                                                >
                                                    {reviewDeleting
                                                        ? "Se șterge..."
                                                        : "Șterge recenzia"}
                                                </button>
                                            )}
                                        </div>

                                        {review && (
                                            <p className="account-review__date">
                                                Publicată la{" "}
                                                {formatReviewDate(
                                                    review.createdAt
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

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
                                        Contul va fi
                                        dezactivat și nu te
                                        vei mai putea
                                        autentifica folosind
                                        acest cont.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        handleDeleteAccount
                                    }
                                    disabled={
                                        deletingAccount
                                    }
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

function formatReviewDate(
    value: string
) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "ro-RO",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    ).format(date);
}

export default AccountPage;