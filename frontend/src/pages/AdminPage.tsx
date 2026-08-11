import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import type {
    AppointmentResponse,
    AppointmentStatus,
    BarbershopService,
} from "../types";

type WelcomeRewardType =
    | "NOTHING"
    | "ZERO_POINTS"
    | "DISCOUNT_10"
    | "DISCOUNT_25"
    | "DISCOUNT_50"
    | "CASH_50"
    | "CASH_100"
    | "FREE_HAIRCUT";

type AdminTab = "CALENDAR" | "CLIENTS" | "SERVICES";

interface UserResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: "CLIENT" | "OWNER";
    active: boolean;
    welcomeSpinUsed: boolean;
    welcomeReward: WelcomeRewardType | null;
    welcomeRewardUsed: boolean;
    createdAt: string;
}

interface WelcomeRewardStatusResponse {
    spinAvailable: boolean;
    reward: WelcomeRewardType | null;
    label: string | null;
    rewardUsed: boolean;
}

const WEEK_DAYS = [
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
    "Duminică",
];

const START_HOUR = 8;
const END_HOUR = 21;
const SLOT_HEIGHT = 64;

function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>("CALENDAR");

    const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [weekOffset, setWeekOffset] = useState(0);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [selectedAppointment, setSelectedAppointment] =
        useState<AppointmentResponse | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
    const [loadingUser, setLoadingUser] = useState(false);
    const [usingReward, setUsingReward] = useState(false);

    const [clients, setClients] = useState<UserResponse[]>([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [clientSearch, setClientSearch] = useState("");
    const [selectedClient, setSelectedClient] = useState<UserResponse | null>(
        null
    );
    const [usingClientReward, setUsingClientReward] = useState(false);

    const [services, setServices] = useState<BarbershopService[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [serviceSearch, setServiceSearch] = useState("");
    const [selectedService, setSelectedService] =
        useState<BarbershopService | null>(null);
    const [serviceFormOpen, setServiceFormOpen] = useState(false);
    const [serviceSaving, setServiceSaving] = useState(false);
    const [serviceDeletingId, setServiceDeletingId] =
        useState<number | null>(null);
    const [serviceName, setServiceName] = useState("");
    const [serviceDescription, setServiceDescription] = useState("");
    const [servicePrice, setServicePrice] = useState("");
    const [serviceDuration, setServiceDuration] = useState("");
    const [serviceActive, setServiceActive] = useState(true);

    const loadAppointments = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get<AppointmentResponse[]>(
                "/appointments"
            );

            setAppointments(response.data);
        } catch {
            setError("Programările nu au putut fi încărcate.");
        } finally {
            setLoading(false);
        }
    };

    const loadClients = async () => {
        setClientsLoading(true);

        try {
            const response = await api.get<UserResponse[]>(
                "/users"
            );

            setClients(
                response.data.filter(
                    (user) => user.role === "CLIENT"
                )
            );
        } catch {
            setError("Clienții nu au putut fi încărcați.");
        } finally {
            setClientsLoading(false);
        }
    };

    const loadServices = async () => {
        setServicesLoading(true);

        try {
            const response = await api.get<BarbershopService[]>(
                "/services"
            );

            setServices(response.data);
        } catch {
            setError("Serviciile nu au putut fi încărcate.");
        } finally {
            setServicesLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
        loadClients();
        loadServices();
    }, []);

    const weekDays = useMemo(() => {
        const today = new Date();
        const day = today.getDay();

        const differenceToMonday =
            day === 0 ? -6 : 1 - day;

        const monday = new Date(today);

        monday.setHours(0, 0, 0, 0);

        monday.setDate(
            today.getDate() +
                differenceToMonday +
                weekOffset * 7
        );

        return Array.from(
            {
                length: 7,
            },
            (_, index) => {
                const date = new Date(monday);

                date.setDate(
                    monday.getDate() + index
                );

                return date;
            }
        );
    }, [weekOffset]);

    const calendarAppointments = useMemo(() => {
        const startDate = formatDateForApi(
            weekDays[0]
        );

        const endDate = formatDateForApi(
            weekDays[6]
        );

        return appointments.filter(
            (appointment) =>
                appointment.date >= startDate &&
                appointment.date <= endDate &&
                appointment.status !== "CANCELLED"
        );
    }, [appointments, weekDays]);

    const filteredClients = useMemo(() => {
        const search = clientSearch
            .trim()
            .toLocaleLowerCase("ro-RO");

        const sorted = [...clients].sort((a, b) =>
            `${a.firstName} ${a.lastName}`.localeCompare(
                `${b.firstName} ${b.lastName}`,
                "ro-RO"
            )
        );

        if (!search) {
            return sorted;
        }

        return sorted.filter((client) => {
            const fullName =
                `${client.firstName} ${client.lastName}`.toLocaleLowerCase(
                    "ro-RO"
                );

            return (
                fullName.includes(search) ||
                client.email.toLocaleLowerCase("ro-RO").includes(search) ||
                (client.phone ?? "").includes(search)
            );
        });
    }, [clients, clientSearch]);

    const filteredServices = useMemo(() => {
        const search = serviceSearch
            .trim()
            .toLocaleLowerCase("ro-RO");

        const sorted = [...services].sort((a, b) => {
            if (a.active !== b.active) {
                return a.active ? -1 : 1;
            }

            return a.name.localeCompare(b.name, "ro-RO");
        });

        if (!search) {
            return sorted;
        }

        return sorted.filter((service) =>
            `${service.name} ${service.description ?? ""}`
                .toLocaleLowerCase("ro-RO")
                .includes(search)
        );
    }, [services, serviceSearch]);

    const resetServiceForm = () => {
        setSelectedService(null);
        setServiceName("");
        setServiceDescription("");
        setServicePrice("");
        setServiceDuration("");
        setServiceActive(true);
        setServiceFormOpen(false);
    };

    const handleCreateService = () => {
        setSelectedService(null);
        setServiceName("");
        setServiceDescription("");
        setServicePrice("");
        setServiceDuration("");
        setServiceActive(true);
        setServiceFormOpen(true);
        setError("");
    };

    const handleEditService = (service: BarbershopService) => {
        setSelectedService(service);
        setServiceName(service.name);
        setServiceDescription(service.description ?? "");
        setServicePrice(String(service.price));
        setServiceDuration(String(service.durationMinutes));
        setServiceActive(service.active);
        setServiceFormOpen(true);
        setError("");
    };

    const handleSaveService = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setError("");

        const normalizedName = serviceName.trim();
        const normalizedDescription = serviceDescription.trim();
        const price = Number(servicePrice);
        const durationMinutes = Number(serviceDuration);

        if (!normalizedName) {
            setError("Introdu numele serviciului.");
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            setError("Introdu un preț valid.");
            return;
        }

        if (
            !Number.isInteger(durationMinutes) ||
            durationMinutes < 1
        ) {
            setError("Durata trebuie să fie de cel puțin 1 minut.");
            return;
        }

        setServiceSaving(true);

        const payload = {
            name: normalizedName,
            description:
                normalizedDescription === ""
                    ? ""
                    : normalizedDescription,
            price,
            durationMinutes,
            active: serviceActive,
        };

        try {
            if (selectedService) {
                const response =
                    await api.put<BarbershopService>(
                        `/services/${selectedService.id}`,
                        payload
                    );

                setServices((current) =>
                    current.map((service) =>
                        service.id === response.data.id
                            ? response.data
                            : service
                    )
                );
            } else {
                const response =
                    await api.post<BarbershopService>(
                        "/services",
                        payload
                    );

                setServices((current) => [
                    ...current,
                    response.data,
                ]);
            }

            resetServiceForm();
        } catch {
            setError(
                "Serviciul nu a putut fi salvat. Verifică datele și numele serviciului."
            );
        } finally {
            setServiceSaving(false);
        }
    };

    const handleDeactivateService = async (
        service: BarbershopService
    ) => {
        if (
            !window.confirm(
                `Dezactivezi serviciul „${service.name}”?`
            )
        ) {
            return;
        }

        setServiceDeletingId(service.id);
        setError("");

        try {
            await api.delete(`/services/${service.id}`);

            setServices((current) =>
                current.map((item) =>
                    item.id === service.id
                        ? {
                              ...item,
                              active: false,
                          }
                        : item
                )
            );

            if (selectedService?.id === service.id) {
                resetServiceForm();
            }
        } catch {
            setError("Serviciul nu a putut fi dezactivat.");
        } finally {
            setServiceDeletingId(null);
        }
    };

    const handleReactivateService = async (
        service: BarbershopService
    ) => {
        setServiceDeletingId(service.id);
        setError("");

        try {
            const response =
                await api.put<BarbershopService>(
                    `/services/${service.id}`,
                    {
                        ...service,
                        active: true,
                    }
                );

            setServices((current) =>
                current.map((item) =>
                    item.id === response.data.id
                        ? response.data
                        : item
                )
            );
        } catch {
            setError("Serviciul nu a putut fi reactivat.");
        } finally {
            setServiceDeletingId(null);
        }
    };

    const handleDeleteServicePermanently = async (
        service: BarbershopService
    ) => {
        const confirmed = window.confirm(
            `Ștergi definitiv serviciul „${service.name}”? Această acțiune nu poate fi anulată.`
        );

        if (!confirmed) {
            return;
        }

        setServiceDeletingId(service.id);
        setError("");

        try {
            await api.delete(
                `/services/${service.id}/permanent`
            );

            setServices((current) =>
                current.filter(
                    (item) => item.id !== service.id
                )
            );

            if (selectedService?.id === service.id) {
                resetServiceForm();
            }
        } catch {
            setError(
                "Serviciul nu poate fi șters definitiv. Este posibil să fie folosit într-o programare."
            );
        } finally {
            setServiceDeletingId(null);
        }
    };

    const handleTabChange = (tab: AdminTab) => {
        setActiveTab(tab);
        setError("");

        if (tab !== "CALENDAR") {
            setSelectedAppointment(null);
            setSelectedUser(null);
        }

        if (tab !== "CLIENTS") {
            setSelectedClient(null);
        }

        if (tab !== "SERVICES") {
            resetServiceForm();
        }
    };

    const handleSelectAppointment = async (
        appointment: AppointmentResponse
    ) => {
        setSelectedAppointment(appointment);
        setSelectedUser(null);
        setLoadingUser(true);
        setError("");

        try {
            const response = await api.get<UserResponse>(
                `/users/${appointment.userId}`
            );

            setSelectedUser(response.data);
        } catch {
            setError(
                "Datele clientului nu au putut fi încărcate."
            );
        } finally {
            setLoadingUser(false);
        }
    };

    const handleCloseAppointment = () => {
        setSelectedAppointment(null);
        setSelectedUser(null);
    };

    const handleStatusChange = async (
        appointmentId: number,
        status: AppointmentStatus
    ) => {
        setUpdatingId(appointmentId);
        setError("");

        try {
            const response = await api.put<AppointmentResponse>(
                `/appointments/${appointmentId}/status`,
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

            setSelectedAppointment(response.data);
        } catch {
            setError(
                "Statusul programării nu a putut fi modificat."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUseReward = async () => {
        if (!selectedUser) {
            return;
        }

        setUsingReward(true);
        setError("");

        try {
            const response =
                await api.put<WelcomeRewardStatusResponse>(
                    `/rewards/users/${selectedUser.id}/use`
                );

            setSelectedUser((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    welcomeReward:
                        response.data.reward,
                    welcomeRewardUsed:
                        response.data.rewardUsed,
                };
            });

            setClients((current) =>
                current.map((client) =>
                    client.id === selectedUser.id
                        ? {
                              ...client,
                              welcomeReward:
                                  response.data.reward,
                              welcomeRewardUsed:
                                  response.data.rewardUsed,
                          }
                        : client
                )
            );
        } catch {
            setError(
                "Premiul nu a putut fi marcat ca folosit."
            );
        } finally {
            setUsingReward(false);
        }
    };

    const handleUseClientReward = async () => {
        if (!selectedClient) {
            return;
        }

        setUsingClientReward(true);
        setError("");

        try {
            const response =
                await api.put<WelcomeRewardStatusResponse>(
                    `/rewards/users/${selectedClient.id}/use`
                );

            const updatedClient: UserResponse = {
                ...selectedClient,
                welcomeReward: response.data.reward,
                welcomeRewardUsed: response.data.rewardUsed,
            };

            setSelectedClient(updatedClient);

            setClients((current) =>
                current.map((client) =>
                    client.id === updatedClient.id
                        ? updatedClient
                        : client
                )
            );

            if (selectedUser?.id === updatedClient.id) {
                setSelectedUser(updatedClient);
            }
        } catch {
            setError(
                "Premiul nu a putut fi marcat ca folosit."
            );
        } finally {
            setUsingClientReward(false);
        }
    };

    const dashboardStats = useMemo(() => {
        const now = new Date();
        const today = formatDateForApi(now);
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const isCurrentMonth = (date: string) => {
            const [year, month] = date.split("-").map(Number);

            return year === currentYear && month === currentMonth;
        };

        const todayAppointments = appointments.filter(
            (appointment) =>
                appointment.date === today &&
                appointment.status !== "CANCELLED"
        ).length;

        const completedThisMonth = appointments.filter(
            (appointment) =>
                appointment.status === "COMPLETED" &&
                isCurrentMonth(appointment.date)
        );

        const monthlyRevenue = completedThisMonth.reduce(
            (total, appointment) =>
                total + Number(appointment.servicePrice ?? 0),
            0
        );

        return {
            todayAppointments,
            totalClients: clients.length,
            completedThisMonth: completedThisMonth.length,
            monthlyRevenue,
        };
    }, [appointments, clients]);

    const weekLabel = `${formatShortDate(
        weekDays[0]
    )} - ${formatShortDate(weekDays[6])}`;

    const hasUsableReward =
        isUsableReward(selectedUser?.welcomeReward ?? null);

    const selectedClientHasUsableReward =
        isUsableReward(selectedClient?.welcomeReward ?? null);

    return (
        <main className="admin-page">
            <header className="admin-header">
                <div className="admin-header__identity">
                    <Link
                        to="/"
                        className="admin-header__brand"
                    >
                        MIHAIFADE
                    </Link>

                    <span>
                        ADMIN
                    </span>
                </div>

                <div className="admin-header__right">
                    <span>
                        OWNER
                    </span>

                    <Link to="/">
                        Vezi site-ul
                    </Link>
                </div>
            </header>

            <section className="admin-content">
                <div className="admin-intro">
                    <p className="section-eyebrow">
                        ADMIN
                    </p>

                    <h1>
                        {activeTab === "CALENDAR"
                            ? "Programări."
                            : activeTab === "CLIENTS"
                              ? "Clienți."
                              : "Servicii."}
                    </h1>

                    <p>
                        {activeTab === "CALENDAR"
                            ? "Organizează săptămâna și gestionează programările direct din calendar."
                            : activeTab === "CLIENTS"
                              ? "Vezi clienții, datele de contact și premiile de bun venit într-un singur loc."
                              : "Adaugă, editează, dezactivează și reactivează serviciile afișate pe site."}
                    </p>
                </div>

                <div className="admin-dashboard">
                    <article className="admin-stat-card">
                        <span className="admin-stat-card__label">
                            Programări azi
                        </span>
                        <strong className="admin-stat-card__value">
                            {dashboardStats.todayAppointments}
                        </strong>
                        <small className="admin-stat-card__meta">
                            Fără programările anulate
                        </small>
                    </article>

                    <article className="admin-stat-card">
                        <span className="admin-stat-card__label">
                            Clienți
                        </span>
                        <strong className="admin-stat-card__value">
                            {dashboardStats.totalClients}
                        </strong>
                        <small className="admin-stat-card__meta">
                            Conturi de client
                        </small>
                    </article>

                    <article className="admin-stat-card">
                        <span className="admin-stat-card__label">
                            Finalizate luna asta
                        </span>
                        <strong className="admin-stat-card__value">
                            {dashboardStats.completedThisMonth}
                        </strong>
                        <small className="admin-stat-card__meta">
                            Programări completate
                        </small>
                    </article>

                    <article className="admin-stat-card admin-stat-card--revenue">
                        <span className="admin-stat-card__label">
                            Venit luna asta
                        </span>
                        <strong className="admin-stat-card__value">
                            {formatCurrency(dashboardStats.monthlyRevenue)}
                        </strong>
                        <small className="admin-stat-card__meta">
                            Doar programări finalizate
                        </small>
                    </article>
                </div>

                <div className="admin-tabs">
                    <button
                        type="button"
                        className={
                            activeTab === "CALENDAR"
                                ? "admin-tab admin-tab--active"
                                : "admin-tab"
                        }
                        onClick={() =>
                            handleTabChange("CALENDAR")
                        }
                    >
                        Calendar
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "CLIENTS"
                                ? "admin-tab admin-tab--active"
                                : "admin-tab"
                        }
                        onClick={() =>
                            handleTabChange("CLIENTS")
                        }
                    >
                        Clienți
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "SERVICES"
                                ? "admin-tab admin-tab--active"
                                : "admin-tab"
                        }
                        onClick={() =>
                            handleTabChange("SERVICES")
                        }
                    >
                        Servicii
                    </button>
                </div>

                {error && (
                    <p className="admin-error">
                        {error}
                    </p>
                )}

                {activeTab === "CALENDAR" && (
                    <>
                        <div className="admin-calendar-toolbar">
                            <div className="admin-calendar-toolbar__navigation">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setWeekOffset(
                                            (current) =>
                                                current - 1
                                        )
                                    }
                                >
                                    ←
                                </button>

                                <strong>
                                    {weekLabel}
                                </strong>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setWeekOffset(
                                            (current) =>
                                                current + 1
                                        )
                                    }
                                >
                                    →
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setWeekOffset(0)
                                    }
                                >
                                    Azi
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <p className="admin-message">
                                Se încarcă programările...
                            </p>
                        ) : (
                            <div
                                className={
                                    selectedAppointment
                                        ? "admin-calendar-layout admin-calendar-layout--details"
                                        : "admin-calendar-layout"
                                }
                            >
                                <div className="admin-calendar-scroll">
                                    <div className="admin-calendar">
                                        <div className="admin-calendar__corner" />

                                        {weekDays.map(
                                            (date, index) => (
                                                <div
                                                    key={date.toISOString()}
                                                    className="admin-calendar__day-header"
                                                >
                                                    <span>
                                                        {
                                                            WEEK_DAYS[
                                                                index
                                                            ]
                                                        }
                                                    </span>

                                                    <strong>
                                                        {date.getDate()}
                                                    </strong>
                                                </div>
                                            )
                                        )}

                                        <div className="admin-calendar__hours">
                                            {Array.from(
                                                {
                                                    length:
                                                        END_HOUR -
                                                        START_HOUR +
                                                        1,
                                                },
                                                (_, index) => {
                                                    const hour =
                                                        START_HOUR +
                                                        index;

                                                    return (
                                                        <div
                                                            key={
                                                                hour
                                                            }
                                                            className="admin-calendar__hour"
                                                        >
                                                            {String(
                                                                hour
                                                            ).padStart(
                                                                2,
                                                                "0"
                                                            )}
                                                            :00
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>

                                        {weekDays.map((date) => {
                                            const dateKey =
                                                formatDateForApi(
                                                    date
                                                );

                                            const dayAppointments =
                                                calendarAppointments.filter(
                                                    (appointment) =>
                                                        appointment.date ===
                                                        dateKey
                                                );

                                            return (
                                                <div
                                                    key={dateKey}
                                                    className="admin-calendar__day"
                                                    style={{
                                                        height:
                                                            (END_HOUR -
                                                                START_HOUR +
                                                                1) *
                                                            SLOT_HEIGHT,
                                                    }}
                                                >
                                                    {Array.from(
                                                        {
                                                            length:
                                                                END_HOUR -
                                                                START_HOUR +
                                                                1,
                                                        },
                                                        (
                                                            _,
                                                            index
                                                        ) => (
                                                            <div
                                                                key={
                                                                    index
                                                                }
                                                                className="admin-calendar__grid-line"
                                                                style={{
                                                                    top:
                                                                        index *
                                                                        SLOT_HEIGHT,
                                                                }}
                                                            />
                                                        )
                                                    )}

                                                    {dayAppointments.map(
                                                        (
                                                            appointment
                                                        ) => {
                                                            const position =
                                                                getAppointmentPosition(
                                                                    appointment
                                                                );

                                                            return (
                                                                <button
                                                                    key={
                                                                        appointment.id
                                                                    }
                                                                    type="button"
                                                                    className={`admin-calendar-event admin-calendar-event--${appointment.status.toLowerCase()}`}
                                                                    style={{
                                                                        top: position.top,
                                                                        height: position.height,
                                                                    }}
                                                                    onClick={() =>
                                                                        handleSelectAppointment(
                                                                            appointment
                                                                        )
                                                                    }
                                                                >
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

                                                                    <strong>
                                                                        {
                                                                            appointment.clientName
                                                                        }
                                                                    </strong>

                                                                    <small>
                                                                        {
                                                                            appointment.serviceName
                                                                        }
                                                                    </small>

                                                                    <small>
                                                                        {appointment.clientPhone ??
                                                                            "Fără telefon"}
                                                                    </small>
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {selectedAppointment && (
                                    <aside className="admin-appointment-panel">
                                        <div className="admin-appointment-panel__top">
                                            <div>
                                                <p className="section-eyebrow">
                                                    DETALII
                                                </p>

                                                <h2>
                                                    Programare
                                                </h2>
                                            </div>

                                            <button
                                                type="button"
                                                className="admin-appointment-panel__close"
                                                onClick={
                                                    handleCloseAppointment
                                                }
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <div className="admin-appointment-panel__status">
                                            {
                                                selectedAppointment.status
                                            }
                                        </div>

                                        <div className="admin-appointment-panel__time">
                                            <strong>
                                                {selectedAppointment.startTime.slice(
                                                    0,
                                                    5
                                                )}
                                                {" - "}
                                                {selectedAppointment.endTime.slice(
                                                    0,
                                                    5
                                                )}
                                            </strong>

                                            <span>
                                                {formatLongDate(
                                                    selectedAppointment.date
                                                )}
                                            </span>
                                        </div>

                                        <div className="admin-appointment-panel__info">
                                            <div>
                                                <span>
                                                    Client
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment.clientName
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Telefon
                                                </span>

                                                <strong>
                                                    {selectedAppointment.clientPhone ??
                                                        "Fără telefon"}
                                                </strong>
                                            </div>

                                            {selectedUser && (
                                                <div>
                                                    <span>
                                                        Email
                                                    </span>

                                                    <strong>
                                                        {selectedUser.email}
                                                    </strong>
                                                </div>
                                            )}

                                            <div>
                                                <span>
                                                    Serviciu
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment.serviceName
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Barber
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment.barberName
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Note
                                                </span>

                                                <strong>
                                                    {selectedAppointment.notes ??
                                                        "Fără note"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="admin-reward">
                                            <p className="section-eyebrow">
                                                PREMIU CLIENT
                                            </p>

                                            {loadingUser ? (
                                                <p className="admin-reward__loading">
                                                    Se încarcă premiul...
                                                </p>
                                            ) : !selectedUser ? (
                                                <p className="admin-reward__loading">
                                                    Datele premiului nu sunt disponibile.
                                                </p>
                                            ) : !selectedUser.welcomeSpinUsed ? (
                                                <div className="admin-reward__empty">
                                                    Clientul nu a învârtit încă roata.
                                                </div>
                                            ) : selectedUser.welcomeReward ? (
                                                <>
                                                    <div className="admin-reward__header">
                                                        <strong>
                                                            {getRewardLabel(
                                                                selectedUser.welcomeReward
                                                            )}
                                                        </strong>

                                                        {hasUsableReward && (
                                                            <span
                                                                className={
                                                                    selectedUser.welcomeRewardUsed
                                                                        ? "admin-reward__status admin-reward__status--used"
                                                                        : "admin-reward__status admin-reward__status--available"
                                                                }
                                                            >
                                                                {selectedUser.welcomeRewardUsed
                                                                    ? "FOLOSIT"
                                                                    : "DISPONIBIL"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {selectedUser.welcomeReward ===
                                                        "NOTHING" && (
                                                        <p className="admin-reward__message">
                                                            Clientul nu a câștigat un beneficiu.
                                                        </p>
                                                    )}

                                                    {selectedUser.welcomeReward ===
                                                        "ZERO_POINTS" && (
                                                        <p className="admin-reward__message">
                                                            Rezultatul roții a fost 0 puncte.
                                                        </p>
                                                    )}

                                                    {hasUsableReward &&
                                                        !selectedUser.welcomeRewardUsed && (
                                                            <button
                                                                type="button"
                                                                className="admin-reward__use"
                                                                onClick={
                                                                    handleUseReward
                                                                }
                                                                disabled={
                                                                    usingReward
                                                                }
                                                            >
                                                                {usingReward
                                                                    ? "Se actualizează..."
                                                                    : "Marchează ca folosit"}
                                                            </button>
                                                        )}
                                                </>
                                            ) : (
                                                <div className="admin-reward__empty">
                                                    Nu există premiu salvat.
                                                </div>
                                            )}
                                        </div>

                                        <div className="admin-appointment-panel__actions">
                                            <button
                                                type="button"
                                                className="admin-appointment-panel__complete"
                                                disabled={
                                                    updatingId ===
                                                        selectedAppointment.id ||
                                                    selectedAppointment.status ===
                                                        "COMPLETED" ||
                                                    selectedAppointment.status ===
                                                        "CANCELLED"
                                                }
                                                onClick={() =>
                                                    handleStatusChange(
                                                        selectedAppointment.id,
                                                        "COMPLETED"
                                                    )
                                                }
                                            >
                                                {updatingId ===
                                                selectedAppointment.id
                                                    ? "Se actualizează..."
                                                    : "Finalizează"}
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-appointment-panel__cancel"
                                                disabled={
                                                    updatingId ===
                                                        selectedAppointment.id ||
                                                    selectedAppointment.status ===
                                                        "CANCELLED" ||
                                                    selectedAppointment.status ===
                                                        "COMPLETED"
                                                }
                                                onClick={() =>
                                                    handleStatusChange(
                                                        selectedAppointment.id,
                                                        "CANCELLED"
                                                    )
                                                }
                                            >
                                                Anulează programarea
                                            </button>
                                        </div>

                                        <p className="admin-appointment-panel__id">
                                            ID programare:{" "}
                                            {selectedAppointment.id}
                                        </p>
                                    </aside>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === "CLIENTS" && (
                    <>
                        <div className="admin-clients-toolbar">
                            <div>
                                <p className="section-eyebrow">
                                    CLIENȚI
                                </p>

                                <strong>
                                    {clients.length}{" "}
                                    {clients.length === 1
                                        ? "client"
                                        : "clienți"}
                                </strong>
                            </div>

                            <input
                                type="search"
                                value={clientSearch}
                                onChange={(event) =>
                                    setClientSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Caută după nume, email sau telefon..."
                            />
                        </div>

                        {clientsLoading ? (
                            <p className="admin-message">
                                Se încarcă clienții...
                            </p>
                        ) : (
                            <div
                                className={
                                    selectedClient
                                        ? "admin-clients-layout admin-clients-layout--details"
                                        : "admin-clients-layout"
                                }
                            >
                                <div className="admin-clients-list">
                                    {filteredClients.length ===
                                    0 ? (
                                        <p className="admin-message">
                                            Nu există clienți pentru căutarea selectată.
                                        </p>
                                    ) : (
                                        filteredClients.map(
                                            (client) => (
                                                <button
                                                    key={
                                                        client.id
                                                    }
                                                    type="button"
                                                    className={
                                                        selectedClient?.id ===
                                                        client.id
                                                            ? "admin-client-row admin-client-row--active"
                                                            : "admin-client-row"
                                                    }
                                                    onClick={() =>
                                                        setSelectedClient(
                                                            client
                                                        )
                                                    }
                                                >
                                                    <div className="admin-client-row__identity">
                                                        <strong>
                                                            {
                                                                client.firstName
                                                            }{" "}
                                                            {
                                                                client.lastName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                client.email
                                                            }
                                                        </span>

                                                        <span>
                                                            {client.phone ??
                                                                "Fără telefon"}
                                                        </span>
                                                    </div>

                                                    <div className="admin-client-row__status">
                                                        <span
                                                            className={
                                                                client.active
                                                                    ? "admin-client-status admin-client-status--active"
                                                                    : "admin-client-status admin-client-status--inactive"
                                                            }
                                                        >
                                                            {client.active
                                                                ? "ACTIV"
                                                                : "INACTIV"}
                                                        </span>
                                                    </div>

                                                    <div className="admin-client-row__reward">
                                                        <span>
                                                            Premiu
                                                        </span>

                                                        <strong>
                                                            {getClientRewardDisplay(
                                                                client
                                                            )}
                                                        </strong>

                                                        {isUsableReward(
                                                            client.welcomeReward
                                                        ) && (
                                                            <small>
                                                                {client.welcomeRewardUsed
                                                                    ? "FOLOSIT"
                                                                    : "DISPONIBIL"}
                                                            </small>
                                                        )}
                                                    </div>

                                                    <div className="admin-client-row__created">
                                                        <span>
                                                            Cont creat
                                                        </span>

                                                        <strong>
                                                            {formatAccountDate(
                                                                client.createdAt
                                                            )}
                                                        </strong>
                                                    </div>
                                                </button>
                                            )
                                        )
                                    )}
                                </div>

                                {selectedClient && (
                                    <aside className="admin-client-panel">
                                        <div className="admin-appointment-panel__top">
                                            <div>
                                                <p className="section-eyebrow">
                                                    DETALII
                                                </p>

                                                <h2>
                                                    Client
                                                </h2>
                                            </div>

                                            <button
                                                type="button"
                                                className="admin-appointment-panel__close"
                                                onClick={() =>
                                                    setSelectedClient(
                                                        null
                                                    )
                                                }
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <div className="admin-client-panel__name">
                                            <strong>
                                                {
                                                    selectedClient.firstName
                                                }{" "}
                                                {
                                                    selectedClient.lastName
                                                }
                                            </strong>

                                            <span
                                                className={
                                                    selectedClient.active
                                                        ? "admin-client-status admin-client-status--active"
                                                        : "admin-client-status admin-client-status--inactive"
                                                }
                                            >
                                                {selectedClient.active
                                                    ? "ACTIV"
                                                    : "INACTIV"}
                                            </span>
                                        </div>

                                        <div className="admin-appointment-panel__info">
                                            <div>
                                                <span>
                                                    Email
                                                </span>

                                                <strong>
                                                    {
                                                        selectedClient.email
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Telefon
                                                </span>

                                                <strong>
                                                    {selectedClient.phone ??
                                                        "Fără telefon"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Cont creat
                                                </span>

                                                <strong>
                                                    {formatAccountDate(
                                                        selectedClient.createdAt
                                                    )}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="admin-reward">
                                            <p className="section-eyebrow">
                                                PREMIU DE BUN VENIT
                                            </p>

                                            {!selectedClient.welcomeSpinUsed ? (
                                                <div className="admin-reward__empty">
                                                    Clientul nu a învârtit încă roata.
                                                </div>
                                            ) : selectedClient.welcomeReward ? (
                                                <>
                                                    <div className="admin-reward__header">
                                                        <strong>
                                                            {getRewardLabel(
                                                                selectedClient.welcomeReward
                                                            )}
                                                        </strong>

                                                        {selectedClientHasUsableReward && (
                                                            <span
                                                                className={
                                                                    selectedClient.welcomeRewardUsed
                                                                        ? "admin-reward__status admin-reward__status--used"
                                                                        : "admin-reward__status admin-reward__status--available"
                                                                }
                                                            >
                                                                {selectedClient.welcomeRewardUsed
                                                                    ? "FOLOSIT"
                                                                    : "DISPONIBIL"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {selectedClient.welcomeReward ===
                                                        "NOTHING" && (
                                                        <p className="admin-reward__message">
                                                            Clientul nu a câștigat un beneficiu.
                                                        </p>
                                                    )}

                                                    {selectedClient.welcomeReward ===
                                                        "ZERO_POINTS" && (
                                                        <p className="admin-reward__message">
                                                            Rezultatul roții a fost 0 puncte.
                                                        </p>
                                                    )}

                                                    {selectedClientHasUsableReward &&
                                                        !selectedClient.welcomeRewardUsed && (
                                                            <button
                                                                type="button"
                                                                className="admin-reward__use"
                                                                onClick={
                                                                    handleUseClientReward
                                                                }
                                                                disabled={
                                                                    usingClientReward
                                                                }
                                                            >
                                                                {usingClientReward
                                                                    ? "Se actualizează..."
                                                                    : "Marchează ca folosit"}
                                                            </button>
                                                        )}
                                                </>
                                            ) : (
                                                <div className="admin-reward__empty">
                                                    Nu există premiu salvat.
                                                </div>
                                            )}
                                        </div>

                                        <p className="admin-appointment-panel__id">
                                            ID client:{" "}
                                            {selectedClient.id}
                                        </p>
                                    </aside>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === "SERVICES" && (
                    <>
                        <div className="admin-services-toolbar">
                            <div>
                                <p className="section-eyebrow">
                                    SERVICII
                                </p>

                                <strong>
                                    {services.length}{" "}
                                    {services.length === 1
                                        ? "serviciu"
                                        : "servicii"}
                                </strong>
                            </div>

                            <div className="admin-services-toolbar__actions">
                                <input
                                    type="search"
                                    value={serviceSearch}
                                    onChange={(event) =>
                                        setServiceSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Caută serviciu..."
                                />

                                <button
                                    type="button"
                                    className="admin-service-add"
                                    onClick={handleCreateService}
                                >
                                    + Adaugă serviciu
                                </button>
                            </div>
                        </div>

                        {servicesLoading ? (
                            <p className="admin-message">
                                Se încarcă serviciile...
                            </p>
                        ) : (
                            <div
                                className={
                                    serviceFormOpen
                                        ? "admin-services-layout admin-services-layout--details"
                                        : "admin-services-layout"
                                }
                            >
                                <div className="admin-services-list">
                                    {filteredServices.length === 0 ? (
                                        <p className="admin-message">
                                            Nu există servicii pentru căutarea selectată.
                                        </p>
                                    ) : (
                                        filteredServices.map(
                                            (service) => (
                                                <article
                                                    key={service.id}
                                                    className={
                                                        selectedService?.id ===
                                                        service.id
                                                            ? "admin-service-row admin-service-row--active"
                                                            : "admin-service-row"
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        className="admin-service-row__main"
                                                        onClick={() =>
                                                            handleEditService(
                                                                service
                                                            )
                                                        }
                                                    >
                                                        <div className="admin-service-row__identity">
                                                            <strong>
                                                                {service.name}
                                                            </strong>

                                                            <span>
                                                                {service.description ||
                                                                    "Fără descriere"}
                                                            </span>
                                                        </div>

                                                        <div className="admin-service-row__meta">
                                                            <span>
                                                                Preț
                                                            </span>
                                                            <strong>
                                                                {formatCurrency(
                                                                    Number(
                                                                        service.price
                                                                    )
                                                                )}
                                                            </strong>
                                                        </div>

                                                        <div className="admin-service-row__meta">
                                                            <span>
                                                                Durată
                                                            </span>
                                                            <strong>
                                                                {
                                                                    service.durationMinutes
                                                                }{" "}
                                                                min
                                                            </strong>
                                                        </div>

                                                        <span
                                                            className={
                                                                service.active
                                                                    ? "admin-client-status admin-client-status--active"
                                                                    : "admin-client-status admin-client-status--inactive"
                                                            }
                                                        >
                                                            {service.active
                                                                ? "ACTIV"
                                                                : "INACTIV"}
                                                        </span>
                                                    </button>

                                                    <div className="admin-service-row__actions">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEditService(
                                                                    service
                                                                )
                                                            }
                                                        >
                                                            Editează
                                                        </button>

                                                        {service.active ? (
                                                            <button
                                                                type="button"
                                                                className="admin-service-row__danger"
                                                                disabled={
                                                                    serviceDeletingId ===
                                                                    service.id
                                                                }
                                                                onClick={() =>
                                                                    handleDeactivateService(
                                                                        service
                                                                    )
                                                                }
                                                            >
                                                                {serviceDeletingId ===
                                                                service.id
                                                                    ? "Se actualizează..."
                                                                    : "Dezactivează"}
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="admin-service-row__restore"
                                                                    disabled={
                                                                        serviceDeletingId ===
                                                                        service.id
                                                                    }
                                                                    onClick={() =>
                                                                        handleReactivateService(
                                                                            service
                                                                        )
                                                                    }
                                                                >
                                                                    {serviceDeletingId ===
                                                                    service.id
                                                                        ? "Se actualizează..."
                                                                        : "Reactivează"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="admin-service-row__delete-permanent"
                                                                    disabled={
                                                                        serviceDeletingId ===
                                                                        service.id
                                                                    }
                                                                    onClick={() =>
                                                                        handleDeleteServicePermanently(
                                                                            service
                                                                        )
                                                                    }
                                                                >
                                                                    Șterge definitiv
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </article>
                                            )
                                        )
                                    )}
                                </div>

                                {serviceFormOpen && (
                                    <aside className="admin-service-panel">
                                        <div className="admin-appointment-panel__top">
                                            <div>
                                                <p className="section-eyebrow">
                                                    {selectedService
                                                        ? "EDITARE"
                                                        : "SERVICIU NOU"}
                                                </p>

                                                <h2>
                                                    {selectedService
                                                        ? "Editează serviciul"
                                                        : "Adaugă serviciu"}
                                                </h2>
                                            </div>

                                            <button
                                                type="button"
                                                className="admin-appointment-panel__close"
                                                onClick={
                                                    resetServiceForm
                                                }
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <form
                                            className="admin-service-form"
                                            onSubmit={
                                                handleSaveService
                                            }
                                        >
                                            <label>
                                                Nume

                                                <input
                                                    type="text"
                                                    value={
                                                        serviceName
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setServiceName(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    required
                                                />
                                            </label>

                                            <label>
                                                Descriere

                                                <textarea
                                                    value={
                                                        serviceDescription
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setServiceDescription(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    rows={5}
                                                    maxLength={
                                                        1000
                                                    }
                                                />
                                            </label>

                                            <div className="admin-service-form__row">
                                                <label>
                                                    Preț (lei)

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            servicePrice
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setServicePrice(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </label>

                                                <label>
                                                    Durată (minute)

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={
                                                            serviceDuration
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setServiceDuration(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </label>
                                            </div>

                                            <label className="admin-service-form__toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        serviceActive
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setServiceActive(
                                                            event
                                                                .target
                                                                .checked
                                                        )
                                                    }
                                                />

                                                <span>
                                                    Serviciu activ
                                                </span>
                                            </label>

                                            <button
                                                type="submit"
                                                className="admin-service-form__submit"
                                                disabled={
                                                    serviceSaving
                                                }
                                            >
                                                {serviceSaving
                                                    ? "Se salvează..."
                                                    : selectedService
                                                      ? "Salvează modificările"
                                                      : "Adaugă serviciul"}
                                            </button>
                                        </form>

                                        {selectedService && (
                                            <p className="admin-appointment-panel__id">
                                                ID serviciu:{" "}
                                                {
                                                    selectedService.id
                                                }
                                            </p>
                                        )}
                                    </aside>
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

function isUsableReward(
    reward: WelcomeRewardType | null
) {
    return (
        reward !== null &&
        reward !== "NOTHING" &&
        reward !== "ZERO_POINTS"
    );
}

function getClientRewardDisplay(
    client: UserResponse
) {
    if (!client.welcomeSpinUsed) {
        return "Roată nefolosită";
    }

    if (!client.welcomeReward) {
        return "Fără premiu";
    }

    return getRewardLabel(
        client.welcomeReward
    );
}

function getRewardLabel(
    reward: WelcomeRewardType
) {
    switch (reward) {
        case "NOTHING":
            return "Nimic";
        case "ZERO_POINTS":
            return "0 puncte";
        case "DISCOUNT_10":
            return "10% reducere";
        case "DISCOUNT_25":
            return "25% reducere";
        case "DISCOUNT_50":
            return "50% reducere";
        case "CASH_50":
            return "50 lei";
        case "CASH_100":
            return "100 lei";
        case "FREE_HAIRCUT":
            return "Un tuns";
    }
}

function formatDateForApi(date: Date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
    return new Intl.DateTimeFormat(
        "ro-RO",
        {
            day: "2-digit",
            month: "short",
        }
    ).format(date);
}

function formatLongDate(date: string) {
    return new Intl.DateTimeFormat(
        "ro-RO",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    ).format(
        new Date(`${date}T12:00:00`)
    );
}

function formatAccountDate(date: string) {
    return new Intl.DateTimeFormat(
        "ro-RO",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    ).format(
        new Date(date)
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("ro-RO", {
        style: "currency",
        currency: "RON",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

function getAppointmentPosition(
    appointment: AppointmentResponse
) {
    const [startHour, startMinute] =
        appointment.startTime
            .split(":")
            .map(Number);

    const [endHour, endMinute] =
        appointment.endTime
            .split(":")
            .map(Number);

    const startMinutes =
        startHour * 60 + startMinute;

    const endMinutes =
        endHour * 60 + endMinute;

    const calendarStart =
        START_HOUR * 60;

    const top =
        ((startMinutes - calendarStart) / 60) *
        SLOT_HEIGHT;

    const height =
        ((endMinutes - startMinutes) / 60) *
        SLOT_HEIGHT;

    return {
        top: Math.max(0, top),
        height: Math.max(38, height),
    };
}

export default AdminPage;
