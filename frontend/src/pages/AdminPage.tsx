import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import type {
    AppointmentResponse,
    AppointmentStatus,
    BarbershopService,
} from "../types";
import "./AdminPage.css";
import "./AdminReviews.css";

type WelcomeRewardType =
    | "NOTHING"
    | "POWDER"
    | "DISCOUNT_10"
    | "DISCOUNT_25"
    | "DISCOUNT_50"
    | "CASH_50"
    | "CASH_100"
    | "FREE_HAIRCUT";

type AdminTab = "CALENDAR" | "CLIENTS" | "ASSISTANT" | "SERVICES" | "PROGRAM" | "BARBER" | "REVIEWS" | "GALLERY" | "CONTACT";

interface UserResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: "CLIENT" | "BARBER" | "OWNER";
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

interface AssistantClientResponse {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    lastVisitDate: string;
    completedAppointments: number;
}

interface AssistantNotificationResponse {
    selectedClients: number;
    notifiedClients: number;
    clientsWithoutNotifications: number;
    sentNotifications: number;
}

interface AssistantDiscountResponse {
    selectedClients: number;
    offersCreated: number;
    discountPercent: number;
    expiresAt: string;
}

type AssistantCampaignType = "NOTIFICATION" | "DISCOUNT";

interface AssistantCampaignResponse {
    id: number;
    type: AssistantCampaignType;
    title: string | null;
    message: string | null;
    selectedClients: number;
    notifiedClients: number | null;
    sentNotifications: number | null;
    createdOffers: number | null;
    discountPercent: number | null;
    validDays: number | null;
    createdAt: string;
}

type DayOfWeek =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

interface BarberResponse {
    id: number;
    displayName: string;
    bio: string | null;
    imageUrl: string | null;
    phoneNumber: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    youtubeUrl: string | null;
    tiktokUrl: string | null;
    active: boolean;
    services?: BarbershopService[];
    user?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        role: "BARBER" | "OWNER";
        active: boolean;
    } | null;
}

interface BarberStatsResponse {
    barberId: number;
    barberName: string;
    appointmentsToday: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    uniqueClients: number;
    revenueToday: number;
    revenueThisMonth: number;
    totalRevenue: number;
}

interface WorkingHoursResponse {
    id: number | null;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    active: boolean;
}

interface TimeOffResponse {
    id: number;
    date: string;
    startTime: string | null;
    endTime: string | null;
    fullDay: boolean;
    reason: string | null;
}

interface ShopSettingsResponse {
    id: number;
    address: string;
    mapEmbedUrl: string | null;
    mapsUrl: string | null;
}

interface GalleryImageResponse {
    id: number;
    imageUrl: string;
    displayOrder: number;
    active: boolean;
    createdAt: string;
}

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

const WEEK_DAYS = [
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
    "Duminică",
];

const DAY_OF_WEEK_VALUES: DayOfWeek[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];

const DEFAULT_PROGRAM_START = "09:00";
const DEFAULT_PROGRAM_END = "18:00";

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

    const [assistantClients, setAssistantClients] = useState<AssistantClientResponse[]>([]);
    const [assistantSelectedIds, setAssistantSelectedIds] = useState<number[]>([]);
    const [assistantLoading, setAssistantLoading] = useState(false);
    const [assistantSending, setAssistantSending] = useState(false);
    const [assistantDiscountSaving, setAssistantDiscountSaving] = useState(false);
    const [assistantInactiveDays, setAssistantInactiveDays] = useState("30");
    const [assistantStartDate, setAssistantStartDate] = useState("");
    const [assistantEndDate, setAssistantEndDate] = useState("");
    const [assistantTitle, setAssistantTitle] = useState("");
    const [assistantMessage, setAssistantMessage] = useState("");
    const [assistantDiscountPercent, setAssistantDiscountPercent] = useState("10");
    const [assistantDiscountValidDays, setAssistantDiscountValidDays] = useState("30");
    const [assistantSuccess, setAssistantSuccess] = useState("");
    const [assistantHistory, setAssistantHistory] = useState<AssistantCampaignResponse[]>([]);
    const [assistantHistoryLoading, setAssistantHistoryLoading] = useState(false);

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

    const [barbers, setBarbers] = useState<BarberResponse[]>([]);
    const [barber, setBarber] = useState<BarberResponse | null>(null);
    const [workingHours, setWorkingHours] =
        useState<WorkingHoursResponse[]>([]);
    const [timeOff, setTimeOff] = useState<TimeOffResponse[]>([]);
    const [programLoading, setProgramLoading] = useState(true);
    const [savingProgramDay, setSavingProgramDay] =
        useState<DayOfWeek | null>(null);
    const [timeOffSaving, setTimeOffSaving] = useState(false);
    const [timeOffDeletingId, setTimeOffDeletingId] =
        useState<number | null>(null);
    const [timeOffDate, setTimeOffDate] = useState("");
    const [timeOffFullDay, setTimeOffFullDay] = useState(true);
    const [timeOffStart, setTimeOffStart] = useState("12:00");
    const [timeOffEnd, setTimeOffEnd] = useState("13:00");
    const [timeOffReason, setTimeOffReason] = useState("");

    const [barberSaving, setBarberSaving] = useState(false);
    const [barberStats, setBarberStats] = useState<BarberStatsResponse | null>(null);
    const [barberStatsLoading, setBarberStatsLoading] = useState(false);
    const [barberImageUploading, setBarberImageUploading] = useState(false);
    const [barberImageSuccess, setBarberImageSuccess] = useState("");
    const [barberDeletingId, setBarberDeletingId] =
        useState<number | null>(null);
    const [barberDisplayName, setBarberDisplayName] = useState("");
    const [barberBio, setBarberBio] = useState("");
    const [barberPhoneNumber, setBarberPhoneNumber] = useState("");
    const [barberInstagramUrl, setBarberInstagramUrl] = useState("");
    const [barberFacebookUrl, setBarberFacebookUrl] = useState("");
    const [barberYoutubeUrl, setBarberYoutubeUrl] = useState("");
    const [barberTiktokUrl, setBarberTiktokUrl] = useState("");
    const [barberActive, setBarberActive] = useState(true);
    const [barberServiceIds, setBarberServiceIds] = useState<number[]>([]);

    const [shopSettings, setShopSettings] =
        useState<ShopSettingsResponse | null>(null);
    const [shopSettingsLoading, setShopSettingsLoading] = useState(true);
    const [shopSettingsSaving, setShopSettingsSaving] = useState(false);
    const [shopAddress, setShopAddress] = useState("");
    const [shopMapEmbedUrl, setShopMapEmbedUrl] = useState("");
    const [shopMapsUrl, setShopMapsUrl] = useState("");

    const [galleryImages, setGalleryImages] = useState<GalleryImageResponse[]>([]);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [galleryReplacingId, setGalleryReplacingId] = useState<number | null>(null);
    const [galleryUpdatingId, setGalleryUpdatingId] = useState<number | null>(null);
    const [galleryDeletingId, setGalleryDeletingId] = useState<number | null>(null);
    const [gallerySuccess, setGallerySuccess] = useState("");

    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewUpdatingId, setReviewUpdatingId] = useState<number | null>(null);
    const [reviewDeletingId, setReviewDeletingId] = useState<number | null>(null);
    const [reviewSuccess, setReviewSuccess] = useState("");

    const [barberCreateOpen, setBarberCreateOpen] = useState(false);
    const [barberCreating, setBarberCreating] = useState(false);
    const [newBarberFirstName, setNewBarberFirstName] = useState("");
    const [newBarberLastName, setNewBarberLastName] = useState("");
    const [newBarberEmail, setNewBarberEmail] = useState("");
    const [newBarberPhone, setNewBarberPhone] = useState("");
    const [newBarberPassword, setNewBarberPassword] = useState("");
    const [newBarberDisplayName, setNewBarberDisplayName] = useState("");
    const [newBarberBio, setNewBarberBio] = useState("");
    const [newBarberServiceIds, setNewBarberServiceIds] = useState<number[]>([]);

    const loadShopSettings = async () => {
        setShopSettingsLoading(true);

        try {
            const response =
                await api.get<ShopSettingsResponse>(
                    "/shop-settings"
                );

            setShopSettings(
                response.data
            );

            setShopAddress(
                response.data.address ?? ""
            );

            setShopMapEmbedUrl(
                response.data.mapEmbedUrl ?? ""
            );

            setShopMapsUrl(
                response.data.mapsUrl ?? ""
            );
        } catch {
            setShopSettings(null);
            setError(
                "Datele de contact ale frizeriei nu au putut fi încărcate."
            );
        } finally {
            setShopSettingsLoading(false);
        }
    };

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

    const loadBarberStats = async (
        barberId: number
    ) => {
        setBarberStatsLoading(true);

        try {
            const response = await api.get<BarberStatsResponse>(
                `/barbers/${barberId}/stats`
            );

            setBarberStats(response.data);
        } catch {
            setBarberStats(null);
            setError(
                "Statisticile barberului nu au putut fi încărcate."
            );
        } finally {
            setBarberStatsLoading(false);
        }
    };

    const loadBarberSchedule = async (
        selectedBarber: BarberResponse
    ) => {
        setProgramLoading(true);

        try {
            const [
                workingHoursResponse,
                timeOffResponse,
            ] = await Promise.all([
                api.get<WorkingHoursResponse[]>(
                    `/barbers/${selectedBarber.id}/working-hours`
                ),
                api.get<TimeOffResponse[]>(
                    `/barbers/${selectedBarber.id}/time-off`
                ),
            ]);

            setWorkingHours(
                workingHoursResponse.data.map((item) => ({
                    ...item,
                    startTime: item.startTime.slice(0, 5),
                    endTime: item.endTime.slice(0, 5),
                }))
            );

            setTimeOff(timeOffResponse.data);
        } catch {
            setWorkingHours([]);
            setTimeOff([]);
            setError(
                "Programul de lucru nu a putut fi încărcat."
            );
        } finally {
            setProgramLoading(false);
        }
    };

    const loadProgram = async () => {
        setProgramLoading(true);

        try {
            const barbersResponse =
                await api.get<BarberResponse[]>("/barbers");

            setBarbers(barbersResponse.data);

            const selectedBarber =
                barbersResponse.data.find(
                    (item) => item.active
                ) ?? barbersResponse.data[0];

            if (!selectedBarber) {
                setBarber(null);
                setWorkingHours([]);
                setTimeOff([]);
                setError(
                    "Nu există niciun barber configurat."
                );
                return;
            }

            setBarber(selectedBarber);

            await loadBarberSchedule(
                selectedBarber
            );
        } catch {
            setBarbers([]);
            setBarber(null);
            setWorkingHours([]);
            setTimeOff([]);
            setError(
                "Barberii nu au putut fi încărcați."
            );
            setProgramLoading(false);
        }
    };

    const handleSelectBarber = async (
        barberId: number
    ) => {
        const selectedBarber =
            barbers.find(
                (item) => item.id === barberId
            );

        if (!selectedBarber) {
            return;
        }

        setBarber(selectedBarber);
        setError("");

        await loadBarberSchedule(
            selectedBarber
        );
    };

    useEffect(() => {
        loadAppointments();
        loadClients();
        loadServices();
        loadProgram();
        loadShopSettings();
    }, []);

    useEffect(() => {
        if (!barber) {
            setBarberStats(null);
            return;
        }

        void loadBarberStats(barber.id);

        setBarberDisplayName(barber.displayName);
        setBarberBio(barber.bio ?? "");
        setBarberPhoneNumber(barber.phoneNumber ?? "");
        setBarberInstagramUrl(barber.instagramUrl ?? "");
        setBarberFacebookUrl(barber.facebookUrl ?? "");
        setBarberYoutubeUrl(barber.youtubeUrl ?? "");
        setBarberTiktokUrl(barber.tiktokUrl ?? "");
        setBarberActive(barber.active);
        setBarberServiceIds(
            (barber.services ?? []).map((service) => service.id)
        );
    }, [barber]);

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

    const calendarBounds = useMemo(() => {
        const activeProgram =
            workingHours.filter(
                (item) => item.active
            );

        let startHour =
            activeProgram.length > 0
                ? Math.min(
                      ...activeProgram.map((item) =>
                          Math.floor(
                              timeToMinutes(
                                  item.startTime
                              ) / 60
                          )
                      )
                  )
                : START_HOUR;

        let endHour =
            activeProgram.length > 0
                ? Math.max(
                      ...activeProgram.map((item) =>
                          Math.ceil(
                              timeToMinutes(
                                  item.endTime
                              ) / 60
                          )
                      )
                  )
                : END_HOUR;

        if (calendarAppointments.length > 0) {
            startHour = Math.min(
                startHour,
                ...calendarAppointments.map(
                    (appointment) =>
                        Math.floor(
                            timeToMinutes(
                                appointment.startTime
                            ) / 60
                        )
                )
            );

            endHour = Math.max(
                endHour,
                ...calendarAppointments.map(
                    (appointment) =>
                        Math.ceil(
                            timeToMinutes(
                                appointment.endTime
                            ) / 60
                        )
                )
            );
        }

        startHour = Math.max(0, startHour);
        endHour = Math.min(23, endHour);

        if (endHour <= startHour) {
            endHour = Math.min(
                23,
                startHour + 1
            );
        }

        return {
            startHour,
            endHour,
            hourCount:
                endHour - startHour + 1,
        };
    }, [
        workingHours,
        calendarAppointments,
    ]);

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

    const programDays = useMemo(
        () =>
            DAY_OF_WEEK_VALUES.map((dayOfWeek) => {
                const existing = workingHours.find(
                    (item) =>
                        item.dayOfWeek === dayOfWeek
                );

                return (
                    existing ?? {
                        id: null,
                        dayOfWeek,
                        startTime:
                            DEFAULT_PROGRAM_START,
                        endTime:
                            DEFAULT_PROGRAM_END,
                        active: false,
                    }
                );
            }),
        [workingHours]
    );

    const updateWorkingDay = (
        dayOfWeek: DayOfWeek,
        patch: Partial<WorkingHoursResponse>
    ) => {
        setWorkingHours((current) => {
            const existing = current.find(
                (item) =>
                    item.dayOfWeek === dayOfWeek
            );

            if (existing) {
                return current.map((item) =>
                    item.dayOfWeek === dayOfWeek
                        ? {
                              ...item,
                              ...patch,
                          }
                        : item
                );
            }

            return [
                ...current,
                {
                    id: null,
                    dayOfWeek,
                    startTime:
                        DEFAULT_PROGRAM_START,
                    endTime:
                        DEFAULT_PROGRAM_END,
                    active: false,
                    ...patch,
                },
            ];
        });
    };

    const handleSaveWorkingDay = async (
        day: WorkingHoursResponse
    ) => {
        if (!barber) {
            return;
        }

        if (
            day.active &&
            day.startTime >= day.endTime
        ) {
            setError(
                "Ora de început trebuie să fie înaintea orei de final."
            );
            return;
        }

        setSavingProgramDay(day.dayOfWeek);
        setError("");

        try {
            const response =
                await api.put<WorkingHoursResponse>(
                    `/barbers/${barber.id}/working-hours`,
                    {
                        dayOfWeek: day.dayOfWeek,
                        startTime: day.startTime,
                        endTime: day.endTime,
                        active: day.active,
                    }
                );

            setWorkingHours((current) => {
                const normalized = {
                    ...response.data,
                    startTime:
                        response.data.startTime.slice(
                            0,
                            5
                        ),
                    endTime:
                        response.data.endTime.slice(
                            0,
                            5
                        ),
                };

                const exists = current.some(
                    (item) =>
                        item.dayOfWeek ===
                        normalized.dayOfWeek
                );

                if (!exists) {
                    return [
                        ...current,
                        normalized,
                    ];
                }

                return current.map((item) =>
                    item.dayOfWeek ===
                    normalized.dayOfWeek
                        ? normalized
                        : item
                );
            });
        } catch {
            setError(
                "Programul pentru această zi nu a putut fi salvat."
            );
        } finally {
            setSavingProgramDay(null);
        }
    };

    const handleSaveTimeOff = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!barber) {
            return;
        }

        if (!timeOffDate) {
            setError("Selectează data.");
            return;
        }

        if (
            !timeOffFullDay &&
            timeOffStart >= timeOffEnd
        ) {
            setError(
                "Ora de început a pauzei trebuie să fie înaintea orei de final."
            );
            return;
        }

        setTimeOffSaving(true);
        setError("");

        try {
            const response =
                await api.put<TimeOffResponse>(
                    `/barbers/${barber.id}/time-off`,
                    {
                        date: timeOffDate,
                        startTime:
                            timeOffFullDay
                                ? null
                                : timeOffStart,
                        endTime:
                            timeOffFullDay
                                ? null
                                : timeOffEnd,
                        fullDay: timeOffFullDay,
                        reason:
                            timeOffReason.trim() === ""
                                ? null
                                : timeOffReason.trim(),
                    }
                );

            setTimeOff((current) => {
                const exists = current.some(
                    (item) =>
                        item.date ===
                        response.data.date
                );

                const next = exists
                    ? current.map((item) =>
                          item.date ===
                          response.data.date
                              ? response.data
                              : item
                      )
                    : [
                          ...current,
                          response.data,
                      ];

                return [...next].sort((a, b) =>
                    a.date.localeCompare(b.date)
                );
            });

            setTimeOffDate("");
            setTimeOffFullDay(true);
            setTimeOffStart("12:00");
            setTimeOffEnd("13:00");
            setTimeOffReason("");
        } catch {
            setError(
                "Ziua liberă / pauza nu a putut fi salvată."
            );
        } finally {
            setTimeOffSaving(false);
        }
    };

    const handleDeleteTimeOff = async (
        item: TimeOffResponse
    ) => {
        if (!barber) {
            return;
        }

        if (
            !window.confirm(
                `Ștergi indisponibilitatea din ${formatLongDate(
                    item.date
                )}?`
            )
        ) {
            return;
        }

        setTimeOffDeletingId(item.id);
        setError("");

        try {
            await api.delete(
                `/barbers/${barber.id}/time-off/${item.id}`
            );

            setTimeOff((current) =>
                current.filter(
                    (entry) =>
                        entry.id !== item.id
                )
            );
        } catch {
            setError(
                "Indisponibilitatea nu a putut fi ștearsă."
            );
        } finally {
            setTimeOffDeletingId(null);
        }
    };

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

                const nextServices = services.map((service) =>
                    service.id === response.data.id
                        ? response.data
                        : service
                );

                setServices(nextServices);

            } else {
                const response =
                    await api.post<BarbershopService>(
                        "/services",
                        payload
                    );

                const nextServices = [
                    ...services,
                    response.data,
                ];

                setServices(nextServices);

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

            const nextServices = services.map((item) =>
                item.id === service.id
                    ? {
                          ...item,
                          active: false,
                      }
                    : item
            );

            setServices(nextServices);


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

            const nextServices = services.map((item) =>
                item.id === response.data.id
                    ? response.data
                    : item
            );

            setServices(nextServices);

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

            const nextServices = services.filter(
                (item) => item.id !== service.id
            );

            setServices(nextServices);


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

    const handleToggleBarberService = (
        serviceId: number
    ) => {
        setBarberServiceIds((current) =>
            current.includes(serviceId)
                ? current.filter(
                      (id) => id !== serviceId
                  )
                : [...current, serviceId]
        );
    };

    const handleToggleNewBarberService = (
        serviceId: number
    ) => {
        setNewBarberServiceIds((current) =>
            current.includes(serviceId)
                ? current.filter(
                      (id) => id !== serviceId
                  )
                : [...current, serviceId]
        );
    };

    const resetNewBarberForm = () => {
        setNewBarberFirstName("");
        setNewBarberLastName("");
        setNewBarberEmail("");
        setNewBarberPhone("");
        setNewBarberPassword("");
        setNewBarberDisplayName("");
        setNewBarberBio("");
        setNewBarberServiceIds([]);
        setBarberCreateOpen(false);
    };

    const handleCreateBarberAccount = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const firstName =
            newBarberFirstName.trim();
        const lastName =
            newBarberLastName.trim();
        const email =
            newBarberEmail.trim();
        const displayName =
            newBarberDisplayName.trim();

        if (
            !firstName ||
            !lastName ||
            !email ||
            !newBarberPassword ||
            !displayName
        ) {
            setError(
                "Completează numele, emailul, parola și numele afișat."
            );
            return;
        }

        setBarberCreating(true);
        setError("");

        try {
            const createResponse =
                await api.post<BarberResponse>(
                    "/barbers/account",
                    {
                        firstName,
                        lastName,
                        email,
                        phone:
                            newBarberPhone.trim() === ""
                                ? null
                                : newBarberPhone.trim(),
                        password:
                            newBarberPassword,
                        displayName,
                        bio:
                            newBarberBio.trim() === ""
                                ? null
                                : newBarberBio.trim(),
                    }
                );

            let createdBarber =
                createResponse.data;

            if (
                newBarberServiceIds.length > 0
            ) {
                const servicesResponse =
                    await api.put<BarberResponse>(
                        `/barbers/${createdBarber.id}/services`,
                        newBarberServiceIds
                    );

                createdBarber =
                    servicesResponse.data;
            }

            setBarbers((current) => [
                ...current,
                createdBarber,
            ]);

            setBarber(createdBarber);
            resetNewBarberForm();

            await loadBarberSchedule(
                createdBarber
            );
        } catch {
            setError(
                "Contul barberului nu a putut fi creat. Verifică emailul, telefonul și datele introduse."
            );
        } finally {
            setBarberCreating(false);
        }
    };

    const handleDeleteBarberPermanently = async (
        barberToDelete: BarberResponse
    ) => {
        if (
            barberToDelete.user?.role === "OWNER"
        ) {
            setError(
                "Contul OWNER nu poate fi șters din lista de barberi."
            );
            return;
        }

        const confirmed = window.confirm(
            `Ștergi definitiv barberul „${barberToDelete.displayName}”? Profilul și contul lui vor fi șterse definitiv. Dacă are programări în istoric, ștergerea va fi refuzată.`
        );

        if (!confirmed) {
            return;
        }

        setBarberDeletingId(
            barberToDelete.id
        );
        setError("");

        try {
            await api.delete(
                `/barbers/${barberToDelete.id}/permanent`
            );

            const remainingBarbers =
                barbers.filter(
                    (item) =>
                        item.id !==
                        barberToDelete.id
                );

            setBarbers(
                remainingBarbers
            );

            if (
                barber?.id ===
                barberToDelete.id
            ) {
                const nextBarber =
                    remainingBarbers.find(
                        (item) => item.active
                    ) ??
                    remainingBarbers[0] ??
                    null;

                setBarber(
                    nextBarber
                );

                if (nextBarber) {
                    await loadBarberSchedule(
                        nextBarber
                    );
                } else {
                    setWorkingHours([]);
                    setTimeOff([]);
                }
            }
        } catch {
            setError(
                "Barberul nu poate fi șters definitiv. Dacă are programări în istoric, păstrează-l dezactivat."
            );
        } finally {
            setBarberDeletingId(null);
        }
    };

    const handleSaveShopSettings = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const address =
            shopAddress.trim();

        if (!address) {
            setError(
                "Introdu adresa frizeriei."
            );
            return;
        }

        setShopSettingsSaving(true);
        setError("");

        try {
            const response =
                await api.put<ShopSettingsResponse>(
                    "/shop-settings",
                    {
                        address,
                        mapEmbedUrl:
                            shopMapEmbedUrl.trim() === ""
                                ? null
                                : shopMapEmbedUrl.trim(),
                        mapsUrl:
                            shopMapsUrl.trim() === ""
                                ? null
                                : shopMapsUrl.trim(),
                    }
                );

            setShopSettings(
                response.data
            );

            setShopAddress(
                response.data.address ?? ""
            );

            setShopMapEmbedUrl(
                response.data.mapEmbedUrl ?? ""
            );

            setShopMapsUrl(
                response.data.mapsUrl ?? ""
            );
        } catch {
            setError(
                "Datele de contact ale frizeriei nu au putut fi salvate."
            );
        } finally {
            setShopSettingsSaving(false);
        }
    };

    const handleBarberImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!barber || !file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Fișierul selectat trebuie să fie o imagine.");
            event.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Imaginea poate avea maximum 10 MB.");
            event.target.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setBarberImageUploading(true);
        setBarberImageSuccess("");
        setError("");

        try {
            const response = await api.put<BarberResponse>(
                `/barbers/${barber.id}/image`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setBarber(response.data);

            setBarbers((current) =>
                current.map((item) =>
                    item.id === response.data.id
                        ? {
                              ...item,
                              ...response.data,
                          }
                        : item
                )
            );

            setBarberImageSuccess(
                "Imaginea barberului a fost actualizată."
            );
        } catch {
            setError(
                "Imaginea barberului nu a putut fi actualizată."
            );
        } finally {
            setBarberImageUploading(false);
            event.target.value = "";
        }
    };

    const handleSaveBarber = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!barber) {
            return;
        }

        const displayName = barberDisplayName.trim();

        if (!displayName) {
            setError("Introdu numele barberului.");
            return;
        }

        setBarberSaving(true);
        setError("");

        try {
            const profileResponse = await api.put<BarberResponse>(
                `/barbers/${barber.id}`,
                {
                    displayName,
                    bio:
                        barberBio.trim() === ""
                            ? null
                            : barberBio.trim(),
                    imageUrl: barber.imageUrl,
                    phoneNumber:
                        barberPhoneNumber.trim() === ""
                            ? null
                            : barberPhoneNumber.trim(),
                    instagramUrl:
                        barberInstagramUrl.trim() === ""
                            ? null
                            : barberInstagramUrl.trim(),
                    facebookUrl:
                        barberFacebookUrl.trim() === ""
                            ? null
                            : barberFacebookUrl.trim(),
                    youtubeUrl:
                        barberYoutubeUrl.trim() === ""
                            ? null
                            : barberYoutubeUrl.trim(),
                    tiktokUrl:
                        barberTiktokUrl.trim() === ""
                            ? null
                            : barberTiktokUrl.trim(),
                    active: barberActive,
                }
            );

            const servicesResponse =
                await api.put<BarberResponse>(
                    `/barbers/${barber.id}/services`,
                    barberServiceIds
                );

            const updatedBarber: BarberResponse = {
                ...profileResponse.data,
                services:
                    servicesResponse.data.services ??
                    services.filter((service) =>
                        barberServiceIds.includes(
                            service.id
                        )
                    ),
                user:
                    profileResponse.data.user ??
                    barber.user,
            };

            setBarber(updatedBarber);

            setBarbers((current) =>
                current.map((item) =>
                    item.id === updatedBarber.id
                        ? updatedBarber
                        : item
                )
            );
        } catch {
            setError(
                "Datele barberului nu au putut fi salvate."
            );
        } finally {
            setBarberSaving(false);
        }
    };

    const loadGallery = async () => {
        setGalleryLoading(true);
        setGallerySuccess("");

        try {
            const response = await api.get<GalleryImageResponse[]>(
                "/gallery/admin"
            );

            setGalleryImages(response.data);
        } catch {
            setGalleryImages([]);
            setError("Galeria nu a putut fi încărcată.");
        } finally {
            setGalleryLoading(false);
        }
    };

    const handleGalleryUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Fișierul selectat trebuie să fie o imagine.");
            event.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Imaginea poate avea maximum 10 MB.");
            event.target.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setGalleryUploading(true);
        setGallerySuccess("");
        setError("");

        try {
            await api.post<GalleryImageResponse>(
                "/gallery",
                formData,
                {
                    headers: {
                    "Content-Type": "multipart/form-data",
                    },
                }
            );
            

            await loadGallery();
            setGallerySuccess("Imaginea a fost adăugată în galerie.");
        } catch {
            setError("Imaginea nu a putut fi încărcată.");
        } finally {
            setGalleryUploading(false);
            event.target.value = "";
        }
    };

    const handleGalleryReplace = async (
        image: GalleryImageResponse,
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Fișierul selectat trebuie să fie o imagine.");
            event.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Imaginea poate avea maximum 10 MB.");
            event.target.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setGalleryReplacingId(image.id);
        setGallerySuccess("");
        setError("");

        try {
            const response = await api.put<GalleryImageResponse>(
                `/gallery/${image.id}/image`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setGalleryImages((current) =>
                current.map((item) =>
                    item.id === response.data.id
                        ? response.data
                        : item
                )
            );

            setGallerySuccess("Imaginea a fost înlocuită cu succes.");
        } catch {
            setError("Imaginea nu a putut fi înlocuită.");
        } finally {
            setGalleryReplacingId(null);
            event.target.value = "";
        }
    };

    const handleGalleryToggleActive = async (
        image: GalleryImageResponse
    ) => {
        setGalleryUpdatingId(image.id);
        setGallerySuccess("");
        setError("");

        try {
            const response = await api.put<GalleryImageResponse>(
                `/gallery/${image.id}/active`,
                null,
                {
                    params: {
                        active: !image.active,
                    },
                }
            );

            setGalleryImages((current) =>
                current.map((item) =>
                    item.id === response.data.id
                        ? response.data
                        : item
                )
            );

            setGallerySuccess(
                response.data.active
                    ? "Imaginea este acum vizibilă în galeria publică."
                    : "Imaginea a fost ascunsă din galeria publică."
            );
        } catch {
            setError("Vizibilitatea imaginii nu a putut fi modificată.");
        } finally {
            setGalleryUpdatingId(null);
        }
    };

    const handleGalleryChangeOrder = async (
        image: GalleryImageResponse,
        newOrder: number
    ) => {
        if (
            newOrder < 1 ||
            newOrder > galleryImages.length ||
            newOrder === image.displayOrder
        ) {
            return;
        }

        setGalleryUpdatingId(image.id);
        setGallerySuccess("");
        setError("");

        try {
            await api.put<GalleryImageResponse>(
                `/gallery/${image.id}/order`,
                null,
                {
                    params: {
                        order: newOrder,
                    },
                }
            );

            await loadGallery();
            setGallerySuccess("Ordinea galeriei a fost actualizată.");
        } catch {
            setError("Ordinea imaginii nu a putut fi modificată.");
        } finally {
            setGalleryUpdatingId(null);
        }
    };

    const handleGalleryDelete = async (
        image: GalleryImageResponse
    ) => {
        if (
            !window.confirm(
                "Ștergi definitiv această imagine din galerie?"
            )
        ) {
            return;
        }

        setGalleryDeletingId(image.id);
        setGallerySuccess("");
        setError("");

        try {
            await api.delete(`/gallery/${image.id}`);
            await loadGallery();
            setGallerySuccess("Imaginea a fost ștearsă definitiv.");
        } catch {
            setError("Imaginea nu a putut fi ștearsă.");
        } finally {
            setGalleryDeletingId(null);
        }
    };

    const loadReviews = async () => {
        setReviewsLoading(true);
        setReviewSuccess("");

        try {
            const response = await api.get<ReviewResponse[]>(
                "/reviews/admin"
            );

            setReviews(response.data);
        } catch {
            setReviews([]);
            setError("Recenziile nu au putut fi încărcate.");
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleReviewToggleActive = async (
        review: ReviewResponse
    ) => {
        setReviewUpdatingId(review.id);
        setReviewSuccess("");
        setError("");

        try {
            const response = await api.put<ReviewResponse>(
                `/reviews/${review.id}/active`,
                null,
                {
                    params: {
                        active: !review.active,
                    },
                }
            );

            setReviews((current) =>
                current.map((item) =>
                    item.id === response.data.id
                        ? response.data
                        : item
                )
            );

            setReviewSuccess(
                response.data.active
                    ? "Recenzia este din nou vizibilă pe site."
                    : "Recenzia a fost ascunsă de pe site."
            );
        } catch {
            setError("Vizibilitatea recenziei nu a putut fi modificată.");
        } finally {
            setReviewUpdatingId(null);
        }
    };

    const handleReviewDelete = async (
        review: ReviewResponse
    ) => {
        const confirmed = window.confirm(
            `Ștergi definitiv recenzia lăsată de ${review.clientName}? Această acțiune nu poate fi anulată.`
        );

        if (!confirmed) {
            return;
        }

        setReviewDeletingId(review.id);
        setReviewSuccess("");
        setError("");

        try {
            await api.delete(
                `/reviews/${review.id}/permanent`
            );

            setReviews((current) =>
                current.filter(
                    (item) => item.id !== review.id
                )
            );

            setReviewSuccess("Recenzia a fost ștearsă definitiv.");
        } catch {
            setError("Recenzia nu a putut fi ștearsă.");
        } finally {
            setReviewDeletingId(null);
        }
    };

    const handleTabChange = (tab: AdminTab) => {
        setActiveTab(tab);
        setError("");

        if (tab === "ASSISTANT") {
            void loadAssistantHistory();
        }

        if (tab === "BARBER" && barber) {
            void loadBarberStats(barber.id);
        }

        if (tab === "REVIEWS") {
            void loadReviews();
        }

        if (tab === "GALLERY") {
            void loadGallery();
        }

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
        setError("");

        if (appointment.userId == null) {
            setLoadingUser(false);
            return;
        }

        setLoadingUser(true);

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

    const loadAssistantHistory = async () => {
        setAssistantHistoryLoading(true);

        try {
            const response = await api.get<AssistantCampaignResponse[]>(
                "/owner/assistant/history"
            );

            setAssistantHistory(response.data);
        } catch {
            setError("Istoricul campaniilor nu a putut fi încărcat.");
        } finally {
            setAssistantHistoryLoading(false);
        }
    };

    const loadAssistantInactiveClients = async () => {
        const inactiveDays = Number(assistantInactiveDays);

        if (!Number.isInteger(inactiveDays) || inactiveDays < 1) {
            setError("Introdu o perioadă validă de inactivitate.");
            return;
        }

        setAssistantLoading(true);
        setAssistantSuccess("");
        setError("");

        try {
            const response = await api.get<AssistantClientResponse[]>(
                "/owner/assistant/inactive-clients",
                { params: { days: inactiveDays } }
            );

            setAssistantClients(response.data);
            setAssistantSelectedIds([]);
        } catch {
            setError("Clienții inactivi nu au putut fi încărcați.");
        } finally {
            setAssistantLoading(false);
        }
    };

    const loadAssistantClientsByPeriod = async () => {
        if (!assistantStartDate || !assistantEndDate) {
            setError("Selectează data de început și data de sfârșit.");
            return;
        }

        if (assistantStartDate > assistantEndDate) {
            setError("Data de început nu poate fi după data de sfârșit.");
            return;
        }

        setAssistantLoading(true);
        setAssistantSuccess("");
        setError("");

        try {
            const response = await api.get<AssistantClientResponse[]>(
                "/owner/assistant/clients-by-visit-period",
                {
                    params: {
                        startDate: assistantStartDate,
                        endDate: assistantEndDate,
                    },
                }
            );

            setAssistantClients(response.data);
            setAssistantSelectedIds([]);
        } catch {
            setError("Clienții din perioada selectată nu au putut fi încărcați.");
        } finally {
            setAssistantLoading(false);
        }
    };

    const loadAssistantAllClients = () => {
        const allClients: AssistantClientResponse[] = clients
            .filter((client) => client.active)
            .map((client) => ({
                userId: client.id,
                firstName: client.firstName,
                lastName: client.lastName,
                email: client.email,
                phone: client.phone,
                lastVisitDate: "",
                completedAppointments: 0,
            }));

        setAssistantClients(allClients);
        setAssistantSelectedIds([]);
        setAssistantSuccess("");
        setError("");
    };

    const toggleAssistantClient = (userId: number) => {
        setAssistantSelectedIds((current) =>
            current.includes(userId)
                ? current.filter((id) => id !== userId)
                : [...current, userId]
        );
    };

    const toggleAllAssistantClients = () => {
        const allIds = assistantClients.map((client) => client.userId);
        const allSelected =
            allIds.length > 0 &&
            allIds.every((id) => assistantSelectedIds.includes(id));

        setAssistantSelectedIds(allSelected ? [] : allIds);
    };

    const handleAssistantSendNotification = async () => {
        const title = assistantTitle.trim();
        const message = assistantMessage.trim();

        if (assistantSelectedIds.length === 0) {
            setError("Selectează cel puțin un client.");
            return;
        }

        if (!title || !message) {
            setError("Completează titlul și mesajul notificării.");
            return;
        }

        if (!window.confirm(`Trimiți notificarea către ${assistantSelectedIds.length} clienți?`)) {
            return;
        }

        setAssistantSending(true);
        setAssistantSuccess("");
        setError("");

        try {
            const response = await api.post<AssistantNotificationResponse>(
                "/owner/assistant/notifications",
                {
                    userIds: assistantSelectedIds,
                    title,
                    message,
                }
            );

            setAssistantSuccess(
                `Notificare trimisă: ${response.data.notifiedClients} clienți notificați, ${response.data.clientsWithoutNotifications} fără notificări active.`
            );
            await loadAssistantHistory();
        } catch {
            setError("Notificarea nu a putut fi trimisă.");
        } finally {
            setAssistantSending(false);
        }
    };

    const handleAssistantCreateDiscount = async () => {
        const discountPercent = Number(assistantDiscountPercent);
        const validDays = Number(assistantDiscountValidDays);

        if (assistantSelectedIds.length === 0) {
            setError("Selectează cel puțin un client.");
            return;
        }

        if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 50) {
            setError("Reducerea trebuie să fie între 1% și 50%.");
            return;
        }

        if (!Number.isInteger(validDays) || validDays < 1) {
            setError("Valabilitatea reducerii trebuie să fie de cel puțin o zi.");
            return;
        }

        if (!window.confirm(`Acorzi ${discountPercent}% reducere pentru ${assistantSelectedIds.length} clienți?`)) {
            return;
        }

        setAssistantDiscountSaving(true);
        setAssistantSuccess("");
        setError("");

        try {
            const response = await api.post<AssistantDiscountResponse>(
                "/owner/assistant/discounts",
                {
                    userIds: assistantSelectedIds,
                    discountPercent,
                    validDays,
                }
            );

            setAssistantSuccess(
                `${response.data.offersCreated} reduceri de ${response.data.discountPercent}% au fost create.`
            );
            await loadAssistantHistory();
        } catch {
            setError("Reducerile nu au putut fi create.");
        } finally {
            setAssistantDiscountSaving(false);
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

                    <Link to="/barber">
                        Mod Barber
                    </Link>

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
                              : activeTab === "ASSISTANT"
                                ? "Asistent."
                                : activeTab === "SERVICES"
                                ? "Servicii."
                                : activeTab === "PROGRAM"
                                  ? "Program."
                                  : activeTab === "BARBER"
                                    ? "Barberi."
                                    : activeTab === "REVIEWS"
                                      ? "Recenzii."
                                      : activeTab === "GALLERY"
                                        ? "Galerie."
                                        : "Contact."}
                    </h1>

                    <p>
                        {activeTab === "CALENDAR"
                            ? "Organizează săptămâna și gestionează programările direct din calendar."
                            : activeTab === "CLIENTS"
                              ? "Vezi clienții, datele de contact și premiile de bun venit într-un singur loc."
                              : activeTab === "ASSISTANT"
                                ? "Filtrează clienții, trimite notificări și acordă reduceri controlate direct de OWNER."
                                : activeTab === "SERVICES"
                                ? "Adaugă, editează, dezactivează și reactivează serviciile afișate pe site."
                                : activeTab === "PROGRAM"
                                  ? "Modifică orele de lucru, zilele închise și perioadele în care nu ești disponibil."
                                  : activeTab === "BARBER"
                                    ? "Administrează echipa, conturile, serviciile și rețelele sociale ale fiecărui barber."
                                    : activeTab === "REVIEWS"
                                      ? "Gestionează recenziile clienților, controlează vizibilitatea lor și șterge definitiv conținutul nedorit."
                                      : activeTab === "GALLERY"
                                        ? "Adaugă, ordonează, ascunde și șterge imaginile afișate în galeria publică."
                                        : "Modifică adresa frizeriei și linkurile Google Maps afișate pe pagina de contact."}
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
                            activeTab === "ASSISTANT"
                                ? "admin-tab admin-tab--active"
                                : "admin-tab"
                        }
                        onClick={() =>
                            handleTabChange("ASSISTANT")
                        }
                    >
                        Asistent
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

                    <button
                        type="button"
                        className={
                            activeTab === "PROGRAM"
                                ? "admin-tab admin-tab--active"
                                : "admin-tab"
                        }
                        onClick={() =>
                            handleTabChange("PROGRAM")
                        }
                    >
                        Program
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "BARBER"
                                ? "admin-tab admin-tab--active"
                                : "admin-tab"
                        }
                        onClick={() =>
                            handleTabChange("BARBER")
                        }
                    >
                        Barber
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "REVIEWS"
                                ? "admin-tab admin-tab--active"
                                : "admin-tab"
                        }
                        onClick={() =>
                            handleTabChange("REVIEWS")
                        }
                    >
                        Recenzii
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "GALLERY"
                                ? "admin-tab admin-tab--active"
                                : "admin-tab"
                        }
                        onClick={() =>
                            handleTabChange("GALLERY")
                        }
                    >
                        Galerie
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "CONTACT"
                                ? "admin-tab admin-tab--active"
                                : "admin-tab"
                        }
                        onClick={() =>
                            handleTabChange("CONTACT")
                        }
                    >
                        Contact
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
                                                        calendarBounds.hourCount,
                                                },
                                                (_, index) => {
                                                    const hour =
                                                        calendarBounds.startHour +
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
                                                            calendarBounds.hourCount *
                                                            SLOT_HEIGHT,
                                                    }}
                                                >
                                                    {Array.from(
                                                        {
                                                            length:
                                                                calendarBounds.hourCount,
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
                                                                    appointment,
                                                                    calendarBounds.startHour
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
                                                        "POWDER" && (
                                                        <p className="admin-reward__message">
                                                            Clientul a câștigat o pudră.
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
                                                        "POWDER" && (
                                                        <p className="admin-reward__message">
                                                            Clientul a câștigat o pudră.
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

                {activeTab === "PROGRAM" && (
                    <>
                        {programLoading ? (
                            <p className="admin-message">
                                Se încarcă programul...
                            </p>
                        ) : !barber ? (
                            <p className="admin-message">
                                Nu există barber configurat.
                            </p>
                        ) : (
                            <div className="admin-program">
                                <div className="admin-program__header">
                                    <div>
                                        <p className="section-eyebrow">
                                            PROGRAM SĂPTĂMÂNAL
                                        </p>

                                        <h2>
                                            {barber.displayName}
                                        </h2>

                                        <p>
                                            Selectează barberul și modifică programul lui de lucru. Disponibilitatea clienților se actualizează automat.
                                        </p>
                                    </div>

                                    <label className="admin-barber-select-field">
                                        Barber

                                        <select
                                            className="admin-barber-select"
                                            value={barber.id}
                                            onChange={(event) =>
                                                handleSelectBarber(
                                                    Number(
                                                        event.target.value
                                                    )
                                                )
                                            }
                                        >
                                            {barbers.map(
                                                (item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.displayName}
                                                        {!item.active
                                                            ? " (inactiv)"
                                                            : ""}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>
                                </div>

                                <div className="admin-program-days">
                                    {programDays.map(
                                        (day, index) => (
                                            <article
                                                key={
                                                    day.dayOfWeek
                                                }
                                                className={
                                                    day.active
                                                        ? "admin-program-day admin-program-day--active"
                                                        : "admin-program-day admin-program-day--closed"
                                                }
                                            >
                                                <div className="admin-program-day__identity">
                                                    <strong>
                                                        {
                                                            WEEK_DAYS[
                                                                index
                                                            ]
                                                        }
                                                    </strong>

                                                    <span>
                                                        {day.active
                                                            ? `${day.startTime} — ${day.endTime}`
                                                            : "Închis"}
                                                    </span>
                                                </div>

                                                <label className="admin-program-day__toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            day.active
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateWorkingDay(
                                                                day.dayOfWeek,
                                                                {
                                                                    active: event
                                                                        .target
                                                                        .checked,
                                                                }
                                                            )
                                                        }
                                                    />

                                                    <span>
                                                        Deschis
                                                    </span>
                                                </label>

                                                <label>
                                                    De la

                                                    <input
                                                        type="time"
                                                        value={
                                                            day.startTime
                                                        }
                                                        disabled={
                                                            !day.active
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateWorkingDay(
                                                                day.dayOfWeek,
                                                                {
                                                                    startTime:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }
                                                            )
                                                        }
                                                    />
                                                </label>

                                                <label>
                                                    Până la

                                                    <input
                                                        type="time"
                                                        value={
                                                            day.endTime
                                                        }
                                                        disabled={
                                                            !day.active
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            updateWorkingDay(
                                                                day.dayOfWeek,
                                                                {
                                                                    endTime:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }
                                                            )
                                                        }
                                                    />
                                                </label>

                                                <button
                                                    type="button"
                                                    className="admin-program-day__save"
                                                    disabled={
                                                        savingProgramDay ===
                                                        day.dayOfWeek
                                                    }
                                                    onClick={() =>
                                                        handleSaveWorkingDay(
                                                            day
                                                        )
                                                    }
                                                >
                                                    {savingProgramDay ===
                                                    day.dayOfWeek
                                                        ? "Se salvează..."
                                                        : "Salvează"}
                                                </button>
                                            </article>
                                        )
                                    )}
                                </div>

                                <div className="admin-time-off">
                                    <div className="admin-time-off__intro">
                                        <div>
                                            <p className="section-eyebrow">
                                                ZILE LIBERE / PAUZE
                                            </p>

                                            <h2>
                                                Indisponibilitate
                                            </h2>

                                            <p>
                                                Poți bloca o zi întreagă sau doar un interval. Sloturile respective nu vor mai fi oferite clienților.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="admin-time-off__layout">
                                        <form
                                            className="admin-time-off-form"
                                            onSubmit={
                                                handleSaveTimeOff
                                            }
                                        >
                                            <label className="admin-date-picker">
                                                Data

                                                <div className="admin-date-picker__field">
                                                    <input
                                                        type="date"
                                                        value={
                                                            timeOffDate
                                                        }
                                                        min={formatDateForApi(
                                                            new Date()
                                                        )}
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setTimeOffDate(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        required
                                                    />

                                                    <span
                                                        className="admin-date-picker__icon"
                                                        aria-hidden="true"
                                                    >
                                                        📅
                                                    </span>
                                                </div>
                                            </label>

                                            <label className="admin-time-off-form__toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        timeOffFullDay
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setTimeOffFullDay(
                                                            event
                                                                .target
                                                                .checked
                                                        )
                                                    }
                                                />

                                                <span>
                                                    Toată ziua
                                                </span>
                                            </label>

                                            {!timeOffFullDay && (
                                                <div className="admin-time-off-form__row">
                                                    <label>
                                                        De la

                                                        <input
                                                            type="time"
                                                            value={
                                                                timeOffStart
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setTimeOffStart(
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </label>

                                                    <label>
                                                        Până la

                                                        <input
                                                            type="time"
                                                            value={
                                                                timeOffEnd
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setTimeOffEnd(
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </label>
                                                </div>
                                            )}

                                            <label>
                                                Motiv

                                                <textarea
                                                    rows={4}
                                                    maxLength={
                                                        500
                                                    }
                                                    value={
                                                        timeOffReason
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setTimeOffReason(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Ex: concediu, curs, pauză..."
                                                />
                                            </label>

                                            <button
                                                type="submit"
                                                className="admin-time-off-form__submit"
                                                disabled={
                                                    timeOffSaving
                                                }
                                            >
                                                {timeOffSaving
                                                    ? "Se salvează..."
                                                    : "Adaugă indisponibilitate"}
                                            </button>
                                        </form>

                                        <div className="admin-time-off-list">
                                            {timeOff.length ===
                                            0 ? (
                                                <p className="admin-message">
                                                    Nu există zile libere sau pauze configurate.
                                                </p>
                                            ) : (
                                                timeOff.map(
                                                    (item) => (
                                                        <article
                                                            key={
                                                                item.id
                                                            }
                                                            className="admin-time-off-item"
                                                        >
                                                            <div>
                                                                <strong>
                                                                    {formatLongDate(
                                                                        item.date
                                                                    )}
                                                                </strong>

                                                                <span>
                                                                    {item.fullDay
                                                                        ? "Toată ziua"
                                                                        : `${item.startTime?.slice(
                                                                              0,
                                                                              5
                                                                          )} — ${item.endTime?.slice(
                                                                              0,
                                                                              5
                                                                          )}`}
                                                                </span>

                                                                {item.reason && (
                                                                    <small>
                                                                        {
                                                                            item.reason
                                                                        }
                                                                    </small>
                                                                )}
                                                            </div>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    timeOffDeletingId ===
                                                                    item.id
                                                                }
                                                                onClick={() =>
                                                                    handleDeleteTimeOff(
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                {timeOffDeletingId ===
                                                                item.id
                                                                    ? "Se șterge..."
                                                                    : "Șterge"}
                                                            </button>
                                                        </article>
                                                    )
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "BARBER" && (
                    <>
                        <div className="admin-services-toolbar">
                            <div>
                                <p className="section-eyebrow">
                                    BARBERI
                                </p>

                                <strong>
                                    {barbers.length}{" "}
                                    {barbers.length === 1
                                        ? "barber"
                                        : "barberi"}
                                </strong>
                            </div>

                            <button
                                type="button"
                                className="admin-service-add"
                                onClick={() => {
                                    setBarberCreateOpen(true);
                                    setError("");
                                }}
                            >
                                + Adaugă barber
                            </button>
                        </div>

                        {barber && (
                            <section className="admin-program-card">
                                <div className="admin-program-card__header">
                                    <div>
                                        <p className="section-eyebrow">
                                            STATISTICI
                                        </p>

                                        <h2>
                                            {barber.displayName}
                                        </h2>
                                    </div>
                                </div>

                                {barberStatsLoading ? (
                                    <p className="admin-empty-state">
                                        Se încarcă statisticile...
                                    </p>
                                ) : barberStats ? (
                                    <div className="admin-dashboard">
                                        <article className="admin-stat-card admin-stat-card--revenue">
                                            <span className="admin-stat-card__label">
                                                Venit total
                                            </span>
                                            <strong className="admin-stat-card__value">
                                                {formatCurrency(
                                                    barberStats.totalRevenue
                                                )}
                                            </strong>
                                            <small className="admin-stat-card__meta">
                                                Doar programări finalizate
                                            </small>
                                        </article>

                                        <article className="admin-stat-card">
                                            <span className="admin-stat-card__label">
                                                Venit luna asta
                                            </span>
                                            <strong className="admin-stat-card__value">
                                                {formatCurrency(
                                                    barberStats.revenueThisMonth
                                                )}
                                            </strong>
                                            <small className="admin-stat-card__meta">
                                                Luna curentă
                                            </small>
                                        </article>

                                        <article className="admin-stat-card">
                                            <span className="admin-stat-card__label">
                                                Programări finalizate
                                            </span>
                                            <strong className="admin-stat-card__value">
                                                {barberStats.completedAppointments}
                                            </strong>
                                            <small className="admin-stat-card__meta">
                                                Total istoric
                                            </small>
                                        </article>

                                        <article className="admin-stat-card">
                                            <span className="admin-stat-card__label">
                                                Clienți unici
                                            </span>
                                            <strong className="admin-stat-card__value">
                                                {barberStats.uniqueClients}
                                            </strong>
                                            <small className="admin-stat-card__meta">
                                                Cu programări finalizate
                                            </small>
                                        </article>
                                    </div>
                                ) : null}
                            </section>
                        )}

                        {barberCreateOpen && (
                            <section className="admin-program-card">
                                <div className="admin-program-card__header">
                                    <div>
                                        <p className="section-eyebrow">
                                            CONT NOU
                                        </p>

                                        <h2>
                                            Adaugă barber
                                        </h2>
                                    </div>

                                    <button
                                        type="button"
                                        className="admin-appointment-panel__close"
                                        onClick={
                                            resetNewBarberForm
                                        }
                                    >
                                        ×
                                    </button>
                                </div>

                                <form
                                    className="admin-time-off-form"
                                    onSubmit={
                                        handleCreateBarberAccount
                                    }
                                >
                                    <div className="admin-time-off-form__row">
                                        <label>
                                            Prenume

                                            <input
                                                type="text"
                                                value={
                                                    newBarberFirstName
                                                }
                                                onChange={(event) =>
                                                    setNewBarberFirstName(
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </label>

                                        <label>
                                            Nume

                                            <input
                                                type="text"
                                                value={
                                                    newBarberLastName
                                                }
                                                onChange={(event) =>
                                                    setNewBarberLastName(
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </label>
                                    </div>

                                    <div className="admin-time-off-form__row">
                                        <label>
                                            Email

                                            <input
                                                type="email"
                                                value={
                                                    newBarberEmail
                                                }
                                                onChange={(event) =>
                                                    setNewBarberEmail(
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </label>

                                        <label>
                                            Telefon

                                            <input
                                                type="tel"
                                                value={
                                                    newBarberPhone
                                                }
                                                onChange={(event) =>
                                                    setNewBarberPhone(
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>

                                    <div className="admin-time-off-form__row">
                                        <label>
                                            Parolă inițială

                                            <input
                                                type="password"
                                                value={
                                                    newBarberPassword
                                                }
                                                onChange={(event) =>
                                                    setNewBarberPassword(
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </label>

                                        <label>
                                            Nume afișat

                                            <input
                                                type="text"
                                                value={
                                                    newBarberDisplayName
                                                }
                                                onChange={(event) =>
                                                    setNewBarberDisplayName(
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </label>
                                    </div>

                                    <label>
                                        Bio / descriere

                                        <textarea
                                            rows={5}
                                            value={newBarberBio}
                                            onChange={(event) =>
                                                setNewBarberBio(
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <div className="admin-program-card__header">
                                        <div>
                                            <p className="section-eyebrow">
                                                SERVICII
                                            </p>

                                            <h2>
                                                Serviciile noului barber
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="admin-barber-services">
                                        {services
                                            .filter(
                                                (service) =>
                                                    service.active
                                            )
                                            .map((service) => (
                                                <label
                                                    key={service.id}
                                                    className="admin-barber-service-card"
                                                >
                                                    <div>
                                                        <strong>
                                                            {service.name}
                                                        </strong>

                                                        <span>
                                                            {service.description ||
                                                                "Fără descriere"}
                                                        </span>
                                                    </div>

                                                    <div className="admin-barber-service-card__meta">
                                                        <input
                                                            type="checkbox"
                                                            checked={newBarberServiceIds.includes(
                                                                service.id
                                                            )}
                                                            onChange={() =>
                                                                handleToggleNewBarberService(
                                                                    service.id
                                                                )
                                                            }
                                                        />

                                                        <span>
                                                            {service.durationMinutes} min
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                    </div>

                                    <button
                                        type="submit"
                                        className="admin-service-form__submit"
                                        disabled={barberCreating}
                                    >
                                        {barberCreating
                                            ? "Se creează..."
                                            : "Creează contul barberului"}
                                    </button>
                                </form>
                            </section>
                        )}

                        {programLoading && barbers.length === 0 ? (
                            <p className="admin-message">
                                Se încarcă barberii...
                            </p>
                        ) : barbers.length === 0 ? (
                            <p className="admin-message">
                                Nu există niciun barber configurat.
                            </p>
                        ) : (
                            <div className="admin-program-layout admin-barber-layout">
                                <section className="admin-program-card">
                                    <div className="admin-program-card__header">
                                        <div>
                                            <p className="section-eyebrow">
                                                ECHIPĂ
                                            </p>

                                            <h2>
                                                Barberi
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="admin-clients-list">
                                        {barbers.map(
                                            (item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    className={
                                                        barber?.id ===
                                                        item.id
                                                            ? "admin-client-row admin-client-row--active"
                                                            : "admin-client-row"
                                                    }
                                                    onClick={() =>
                                                        handleSelectBarber(
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    <div className="admin-client-row__identity">
                                                        <strong>
                                                            {
                                                                item.displayName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {item.user?.email ??
                                                                "Cont neasociat"}
                                                        </span>

                                                        <span>
                                                            {item.bio ||
                                                                "Fără descriere"}
                                                        </span>
                                                    </div>

                                                    <div className="admin-client-row__status">
                                                        <span
                                                            className={
                                                                item.active
                                                                    ? "admin-client-status admin-client-status--active"
                                                                    : "admin-client-status admin-client-status--inactive"
                                                            }
                                                        >
                                                            {item.active
                                                                ? "ACTIV"
                                                                : "INACTIV"}
                                                        </span>
                                                    </div>

                                                    <div className="admin-client-row__reward">
                                                        <span>
                                                            Servicii
                                                        </span>

                                                        <strong>
                                                            {
                                                                (
                                                                    item.services ??
                                                                    []
                                                                ).length
                                                            }
                                                        </strong>
                                                    </div>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </section>

                                {barber && (
                                    <aside className="admin-program-card">
                                        <div className="admin-program-card__header">
                                            <div>
                                                <p className="section-eyebrow">
                                                    PROFIL BARBER
                                                </p>

                                                <h2>
                                                    {
                                                        barber.displayName
                                                    }
                                                </h2>
                                            </div>

                                            <span
                                                className={
                                                    barberActive
                                                        ? "admin-client-status admin-client-status--active"
                                                        : "admin-client-status admin-client-status--inactive"
                                                }
                                            >
                                                {barberActive
                                                    ? "ACTIV"
                                                    : "INACTIV"}
                                            </span>
                                        </div>

                                        <form
                                            className="admin-time-off-form"
                                            onSubmit={
                                                handleSaveBarber
                                            }
                                        >
                                            {barber.user && (
                                                <div className="admin-appointment-panel__info">
                                                    <div>
                                                        <span>
                                                            Cont
                                                        </span>

                                                        <strong>
                                                            {
                                                                barber.user
                                                                    .email
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Rol
                                                        </span>

                                                        <strong>
                                                            {
                                                                barber.user
                                                                    .role
                                                            }
                                                        </strong>
                                                    </div>
                                                </div>
                                            )}

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: "14px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        overflow: "hidden",
                                                        width: "100%",
                                                        aspectRatio: "16 / 10",
                                                        background: "rgba(255, 255, 255, 0.04)",
                                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                                    }}
                                                >
                                                    {barber.imageUrl ? (
                                                        <img
                                                            src={
                                                                barber.imageUrl
                                                            }
                                                            alt={
                                                                barber.displayName
                                                            }
                                                            style={{
                                                                display: "block",
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                                objectPosition: "center",
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                color: "rgba(255, 255, 255, 0.55)",
                                                                fontSize: "12px",
                                                                letterSpacing: "1px",
                                                                textTransform: "uppercase",
                                                            }}
                                                        >
                                                            Fără imagine
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <input
                                                        id={`admin-barber-image-${barber.id}`}
                                                        className="admin-gallery__file-input"
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={
                                                            barberImageUploading
                                                        }
                                                        onChange={
                                                            handleBarberImageUpload
                                                        }
                                                    />

                                                    <label
                                                        htmlFor={`admin-barber-image-${barber.id}`}
                                                        className={
                                                            barberImageUploading
                                                                ? "admin-gallery__upload-button admin-gallery__upload-button--disabled"
                                                                : "admin-gallery__upload-button"
                                                        }
                                                    >
                                                        {barberImageUploading
                                                            ? "Se încarcă..."
                                                            : barber.imageUrl
                                                              ? "Schimbă poza"
                                                              : "Adaugă poza"}
                                                    </label>
                                                </div>

                                                {barberImageSuccess && (
                                                    <p className="admin-gallery__message admin-gallery__message--success">
                                                        {
                                                            barberImageSuccess
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <label>
                                                Nume afișat

                                                <input
                                                    type="text"
                                                    value={
                                                        barberDisplayName
                                                    }
                                                    onChange={(event) =>
                                                        setBarberDisplayName(
                                                            event.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                            </label>

                                            <label>
                                                Bio / descriere

                                                <textarea
                                                    value={
                                                        barberBio
                                                    }
                                                    onChange={(event) =>
                                                        setBarberBio(
                                                            event.target.value
                                                        )
                                                    }
                                                    rows={6}
                                                />
                                            </label>

                                            <div className="admin-program-card__header">
                                                <div>
                                                    <p className="section-eyebrow">
                                                        CONTACT BARBER
                                                    </p>

                                                    <h2>
                                                        Contact și rețele sociale
                                                    </h2>

                                                    <p>
                                                        Completează numărul de telefon și platformele pe care barberul le folosește. Datele vor fi afișate pe pagina de contact.
                                                    </p>
                                                </div>
                                            </div>

                                            <label>
                                                Telefon

                                                <input
                                                    type="tel"
                                                    value={
                                                        barberPhoneNumber
                                                    }
                                                    onChange={(event) =>
                                                        setBarberPhoneNumber(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="07xx xxx xxx"
                                                />
                                            </label>

                                            <label>
                                                Instagram

                                                <input
                                                    type="url"
                                                    value={
                                                        barberInstagramUrl
                                                    }
                                                    onChange={(event) =>
                                                        setBarberInstagramUrl(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="https://instagram.com/..."
                                                />
                                            </label>

                                            <label>
                                                Facebook

                                                <input
                                                    type="url"
                                                    value={
                                                        barberFacebookUrl
                                                    }
                                                    onChange={(event) =>
                                                        setBarberFacebookUrl(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="https://facebook.com/..."
                                                />
                                            </label>

                                            <label>
                                                YouTube

                                                <input
                                                    type="url"
                                                    value={
                                                        barberYoutubeUrl
                                                    }
                                                    onChange={(event) =>
                                                        setBarberYoutubeUrl(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="https://youtube.com/..."
                                                />
                                            </label>

                                            <label>
                                                TikTok

                                                <input
                                                    type="url"
                                                    value={
                                                        barberTiktokUrl
                                                    }
                                                    onChange={(event) =>
                                                        setBarberTiktokUrl(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="https://tiktok.com/@..."
                                                />
                                            </label>

                                            <label
                                                className="admin-barber-active-toggle"
                                                style={{
                                                    width: "fit-content",
                                                    display: "inline-flex",
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    justifyContent: "flex-start",
                                                    gap: "10px",
                                                    marginTop: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <span
                                                    className="admin-barber-active-toggle__label"
                                                    style={{
                                                        color: "rgba(255, 255, 255, 0.62)",
                                                        fontSize: "10px",
                                                        fontWeight: 700,
                                                        letterSpacing: "1.8px",
                                                        lineHeight: 1,
                                                        textTransform: "uppercase",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    Barber activ
                                                </span>

                                                <input
                                                    type="checkbox"
                                                    checked={barberActive}
                                                    onChange={(event) =>
                                                        setBarberActive(
                                                            event.target.checked
                                                        )
                                                    }
                                                    style={{
                                                        appearance: "auto",
                                                        width: "18px",
                                                        minWidth: "18px",
                                                        maxWidth: "18px",
                                                        height: "18px",
                                                        minHeight: "18px",
                                                        maxHeight: "18px",
                                                        flex: "0 0 18px",
                                                        margin: 0,
                                                        padding: 0,
                                                        cursor: "pointer",
                                                        accentColor: "#e4cc98",
                                                    }}
                                                />
                                            </label>

                                            <div className="admin-program-card__header">
                                                <div>
                                                    <p className="section-eyebrow">
                                                        SERVICII
                                                    </p>

                                                    <h2>
                                                        Servicii oferite
                                                    </h2>

                                                    <p>
                                                        Fiecare barber poate avea propriul set de servicii.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="admin-barber-services">
                                                {services
                                                    .filter(
                                                        (service) =>
                                                            service.active
                                                    )
                                                    .map(
                                                        (service) => (
                                                            <label
                                                                key={
                                                                    service.id
                                                                }
                                                                className="admin-barber-service-card"
                                                            >
                                                                <div>
                                                                    <strong>
                                                                        {
                                                                            service.name
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        {service.description ||
                                                                            "Fără descriere"}
                                                                    </span>
                                                                </div>

                                                                <div className="admin-barber-service-card__meta">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={barberServiceIds.includes(
                                                                            service.id
                                                                        )}
                                                                        onChange={() =>
                                                                            handleToggleBarberService(
                                                                                service.id
                                                                            )
                                                                        }
                                                                    />

                                                                    <strong>
                                                                        {formatCurrency(
                                                                            Number(
                                                                                service.price
                                                                            )
                                                                        )}
                                                                    </strong>

                                                                    <span>
                                                                        {
                                                                            service.durationMinutes
                                                                        }{" "}
                                                                        min
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        )
                                                    )}
                                            </div>

                                            <button
                                                type="submit"
                                                className="admin-service-form__submit"
                                                disabled={
                                                    barberSaving
                                                }
                                            >
                                                {barberSaving
                                                    ? "Se salvează..."
                                                    : "Salvează barberul"}
                                            </button>

                                            {barber.user?.role !== "OWNER" && (
                                                <button
                                                    type="button"
                                                    className="admin-barber-delete"
                                                    disabled={
                                                        barberDeletingId ===
                                                        barber.id
                                                    }
                                                    onClick={() =>
                                                        handleDeleteBarberPermanently(
                                                            barber
                                                        )
                                                    }
                                                >
                                                    {barberDeletingId ===
                                                    barber.id
                                                        ? "Se șterge..."
                                                        : "Șterge definitiv barberul"}
                                                </button>
                                            )}
                                        </form>
                                    </aside>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === "ASSISTANT" && (
                    <div
                        className="admin-program-layou admin-assistant"
                        style={{ alignItems: "start" }}
                    >
                        <section className="admin-program-card">
                            <div className="admin-program-card__header">
                                <div>
                                    <p className="section-eyebrow">
                                        SELECTARE CLIENȚI
                                    </p>
                                    <h2>Audiență</h2>
                                    <p>
                                        Alege toți clienții, clienții inactivi sau clienții care au fost în salon într-o anumită perioadă.
                                    </p>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gap: "14px",
                                }}
                            >
                                <button
                                    type="button"
                                    className="admin-service-form__submit"
                                    onClick={loadAssistantAllClients}
                                >
                                    Toți clienții activi
                                </button>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "minmax(0, 1fr) auto",
                                        gap: "10px",
                                        alignItems: "end",
                                    }}
                                >
                                    <label>
                                        Inactivi de cel puțin
                                        <select
                                            value={assistantInactiveDays}
                                            onChange={(event) =>
                                                setAssistantInactiveDays(event.target.value)
                                            }
                                        >
                                            <option value="30">30 zile</option>
                                            <option value="60">60 zile</option>
                                            <option value="90">90 zile</option>
                                            <option value="180">6 luni</option>
                                            <option value="365">1 an</option>
                                        </select>
                                    </label>
                                    <button
                                        type="button"
                                        className="admin-service-form__submit"
                                        disabled={assistantLoading}
                                        onClick={loadAssistantInactiveClients}
                                    >
                                        Filtrează
                                    </button>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                        gap: "10px",
                                    }}
                                >
                                    <label>
                                        De la
                                        <input
                                            type="date"
                                            value={assistantStartDate}
                                            onChange={(event) =>
                                                setAssistantStartDate(event.target.value)
                                            }
                                        />
                                    </label>
                                    <label>
                                        Până la
                                        <input
                                            type="date"
                                            value={assistantEndDate}
                                            onChange={(event) =>
                                                setAssistantEndDate(event.target.value)
                                            }
                                        />
                                    </label>
                                </div>

                                <button
                                    type="button"
                                    className="admin-service-form__submit"
                                    disabled={assistantLoading}
                                    onClick={loadAssistantClientsByPeriod}
                                >
                                    Clienți din perioada selectată
                                </button>
                            </div>

                            <div style={{ marginTop: "22px" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "12px",
                                        flexWrap: "wrap",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <strong>
                                        {assistantLoading
                                            ? "Se încarcă..."
                                            : `${assistantClients.length} clienți găsiți`}
                                    </strong>

                                    {assistantClients.length > 0 && (
                                        <button
                                            type="button"
                                            className="admin-tab"
                                            onClick={toggleAllAssistantClients}
                                        >
                                            {assistantClients.every((client) =>
                                                assistantSelectedIds.includes(client.userId)
                                            )
                                                ? "Deselectează tot"
                                                : "Selectează tot"}
                                        </button>
                                    )}
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gap: "8px",
                                        maxHeight: "430px",
                                        overflowY: "auto",
                                    }}
                                >
                                    {assistantClients.map((client) => (
                                        <label
                                            key={client.userId}
                                            className="admin-barber-service-card"
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div>
                                                <strong>
                                                    {client.firstName} {client.lastName}
                                                </strong>
                                                <span>{client.email}</span>
                                                <span>
                                                    {client.phone ?? "Fără telefon"}
                                                </span>
                                                {client.lastVisitDate && (
                                                    <span>
                                                        Ultima vizită: {formatLongDate(client.lastVisitDate)}
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={assistantSelectedIds.includes(client.userId)}
                                                onChange={() =>
                                                    toggleAssistantClient(client.userId)
                                                }
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <aside
                            style={{
                                display: "grid",
                                gap: "18px",
                            }}
                        >
                            <section className="admin-program-card">
                                <div className="admin-program-card__header">
                                    <div>
                                        <p className="section-eyebrow">
                                            NOTIFICARE
                                        </p>
                                        <h2>Mesaj manual</h2>
                                        <p>
                                            Mesajul este scris de OWNER și ajunge doar la clienții selectați care au notificările active.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-time-off-form">
                                    <label>
                                        Titlu
                                        <input
                                            type="text"
                                            value={assistantTitle}
                                            onChange={(event) =>
                                                setAssistantTitle(event.target.value)
                                            }
                                            placeholder="Ex: Program aglomerat"
                                        />
                                    </label>

                                    <label>
                                        Mesaj
                                        <textarea
                                            rows={5}
                                            value={assistantMessage}
                                            onChange={(event) =>
                                                setAssistantMessage(event.target.value)
                                            }
                                            placeholder="Scrie mesajul care va fi trimis clienților..."
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        className="admin-service-form__submit"
                                        disabled={
                                            assistantSending ||
                                            assistantSelectedIds.length === 0
                                        }
                                        onClick={handleAssistantSendNotification}
                                    >
                                        {assistantSending
                                            ? "Se trimite..."
                                            : `Trimite către ${assistantSelectedIds.length} clienți`}
                                    </button>
                                </div>
                            </section>

                            <section className="admin-program-card">
                                <div className="admin-program-card__header">
                                    <div>
                                        <p className="section-eyebrow">
                                            OFERTĂ
                                        </p>
                                        <h2>Reducere</h2>
                                        <p>
                                            OWNER stabilește procentul și valabilitatea. Barberul o poate marca drept folosită la vizita clientului.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-time-off-form">
                                    <label>
                                        Reducere (%)
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={assistantDiscountPercent}
                                            onChange={(event) =>
                                                setAssistantDiscountPercent(event.target.value)
                                            }
                                        />
                                    </label>

                                    <label>
                                        Valabilitate (zile)
                                        <input
                                            type="number"
                                            min="1"
                                            value={assistantDiscountValidDays}
                                            onChange={(event) =>
                                                setAssistantDiscountValidDays(event.target.value)
                                            }
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        className="admin-service-form__submit"
                                        disabled={
                                            assistantDiscountSaving ||
                                            assistantSelectedIds.length === 0
                                        }
                                        onClick={handleAssistantCreateDiscount}
                                    >
                                        {assistantDiscountSaving
                                            ? "Se salvează..."
                                            : `Acordă reducerea (${assistantSelectedIds.length})`}
                                    </button>
                                </div>
                            </section>

                            {assistantSuccess && (
                                <p
                                    className="admin-message"
                                    style={{ margin: 0 }}
                                >
                                    {assistantSuccess}
                                </p>
                            )}
                        </aside>

                        <section
                            className="admin-program-card"
                            style={{ gridColumn: "1 / -1" }}
                        >
                            <div className="admin-program-card__header">
                                <div>
                                    <p className="section-eyebrow">
                                        ISTORIC
                                    </p>
                                    <h2>Campanii trimise</h2>
                                    <p>
                                        Vezi notificările și reducerile create de OWNER, în ordine cronologică.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="admin-tab"
                                    disabled={assistantHistoryLoading}
                                    onClick={loadAssistantHistory}
                                >
                                    {assistantHistoryLoading
                                        ? "Se încarcă..."
                                        : "Reîncarcă"}
                                </button>
                            </div>

                            {assistantHistoryLoading && assistantHistory.length === 0 ? (
                                <p className="admin-empty-state">
                                    Se încarcă istoricul...
                                </p>
                            ) : assistantHistory.length === 0 ? (
                                <p className="admin-empty-state">
                                    Nu există încă nicio campanie în istoric.
                                </p>
                            ) : (
                                <div
                                    style={{
                                        display: "grid",
                                        gap: "10px",
                                    }}
                                >
                                    {assistantHistory.map((campaign) => (
                                        <article
                                            key={campaign.id}
                                            className="admin-barber-service-card"
                                            style={{
                                                alignItems: "flex-start",
                                                cursor: "default",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: "6px",
                                                    minWidth: 0,
                                                }}
                                            >
                                                <strong>
                                                    {campaign.type === "NOTIFICATION"
                                                        ? campaign.title || "Notificare"
                                                        : `Reducere ${campaign.discountPercent ?? 0}%`}
                                                </strong>

                                                <span>
                                                    {campaign.type === "NOTIFICATION"
                                                        ? `${campaign.notifiedClients ?? 0} din ${campaign.selectedClients} clienți notificați · ${campaign.sentNotifications ?? 0} notificări trimise`
                                                        : `${campaign.createdOffers ?? 0} din ${campaign.selectedClients} oferte create · valabilitate ${campaign.validDays ?? 0} zile`}
                                                </span>

                                                {campaign.type === "NOTIFICATION" &&
                                                    campaign.message && (
                                                        <span
                                                            style={{
                                                                whiteSpace: "pre-wrap",
                                                                overflowWrap: "anywhere",
                                                            }}
                                                        >
                                                            {campaign.message}
                                                        </span>
                                                    )}
                                            </div>

                                            <span
                                                style={{
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {formatAssistantCampaignDate(
                                                    campaign.createdAt
                                                )}
                                            </span>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === "REVIEWS" && (
                    <div className="admin-reviews">
                        <div className="admin-reviews__summary">
                            <article className="admin-reviews__stat">
                                <span>
                                    Total recenzii
                                </span>

                                <strong>
                                    {reviews.length}
                                </strong>
                            </article>

                            <article className="admin-reviews__stat">
                                <span>
                                    Vizibile
                                </span>

                                <strong>
                                    {reviews.filter((review) => review.active).length}
                                </strong>
                            </article>

                            <article className="admin-reviews__stat">
                                <span>
                                    Ascunse
                                </span>

                                <strong>
                                    {reviews.filter((review) => !review.active).length}
                                </strong>
                            </article>
                        </div>

                        {reviewSuccess && (
                            <p className="admin-reviews__message admin-reviews__message--success">
                                {reviewSuccess}
                            </p>
                        )}

                        {reviewsLoading ? (
                            <p className="admin-reviews__message">
                                Se încarcă recenziile...
                            </p>
                        ) : reviews.length === 0 ? (
                            <div className="admin-reviews__empty">
                                <strong>
                                    Nu există recenzii.
                                </strong>

                                <p>
                                    Recenziile trimise de clienți vor apărea aici.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-reviews__list">
                                {reviews.map((review) => (
                                    <article
                                        key={review.id}
                                        className="admin-review-card"
                                    >
                                        <div className="admin-review-card__main">
                                            <div className="admin-review-card__top">
                                                <div className="admin-review-card__identity">
                                                    <strong>
                                                        {review.clientName}
                                                    </strong>

                                                    <span>
                                                        Client #{review.userId}
                                                    </span>
                                                </div>

                                                <div
                                                    className="admin-review-card__rating"
                                                    aria-label={`${review.rating} din 5 stele`}
                                                >
                                                    {"★".repeat(review.rating)}
                                                    {"☆".repeat(5 - review.rating)}
                                                </div>
                                            </div>

                                            <p className="admin-review-card__comment">
                                                {review.comment}
                                            </p>

                                            <div className="admin-review-card__meta">
                                                <span
                                                    className={
                                                        review.active
                                                            ? "admin-review-card__status admin-review-card__status--active"
                                                            : "admin-review-card__status admin-review-card__status--inactive"
                                                    }
                                                >
                                                    {review.active
                                                        ? "Vizibilă"
                                                        : "Ascunsă"}
                                                </span>

                                                <span>
                                                    Publicată {formatAccountDate(review.createdAt)}
                                                </span>

                                                {review.updatedAt !== review.createdAt && (
                                                    <span>
                                                        Actualizată {formatAccountDate(review.updatedAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="admin-review-card__actions">
                                            <button
                                                type="button"
                                                disabled={
                                                    reviewUpdatingId !== null ||
                                                    reviewDeletingId !== null
                                                }
                                                onClick={() =>
                                                    void handleReviewToggleActive(review)
                                                }
                                            >
                                                {reviewUpdatingId === review.id
                                                    ? "Se salvează..."
                                                    : review.active
                                                      ? "Ascunde"
                                                      : "Publică"}
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-review-card__delete"
                                                disabled={
                                                    reviewUpdatingId !== null ||
                                                    reviewDeletingId !== null
                                                }
                                                onClick={() =>
                                                    void handleReviewDelete(review)
                                                }
                                            >
                                                {reviewDeletingId === review.id
                                                    ? "Se șterge..."
                                                    : "Șterge definitiv"}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "GALLERY" && (
                    <div className="admin-gallery">
                        <section className="admin-gallery__upload">
                            <div className="admin-gallery__upload-info">
                                <p className="section-eyebrow">
                                    GALERIE
                                </p>

                                <h2>
                                    Imagini publice
                                </h2>

                                <p>
                                    Încarcă imagini noi, stabilește ordinea lor și controlează ce apare pe site.
                                </p>
                            </div>

                            <div className="admin-gallery__upload-actions">
                                <input
                                    id="admin-gallery-file"
                                    className="admin-gallery__file-input"
                                    type="file"
                                    accept="image/*"
                                    disabled={
                                        galleryUploading ||
                                        galleryReplacingId !== null
                                    }
                                    onChange={handleGalleryUpload}
                                />

                                <label
                                    htmlFor="admin-gallery-file"
                                    className={
                                        galleryUploading || galleryReplacingId !== null
                                            ? "admin-gallery__upload-button admin-gallery__upload-button--disabled"
                                            : "admin-gallery__upload-button"
                                    }
                                >
                                    {galleryUploading
                                        ? "Se încarcă..."
                                        : "Adaugă imagine"}
                                </label>
                            </div>
                        </section>

                        {gallerySuccess && (
                            <p className="admin-gallery__message admin-gallery__message--success">
                                {gallerySuccess}
                            </p>
                        )}

                        {galleryLoading ? (
                            <p className="admin-gallery__message">
                                Se încarcă galeria...
                            </p>
                        ) : galleryImages.length === 0 ? (
                            <div className="admin-gallery__empty">
                                <strong>
                                    Galeria este goală.
                                </strong>

                                <p>
                                    Adaugă prima imagine pentru a începe.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-gallery__grid">
                                {galleryImages.map((image) => (
                                    <article
                                        key={image.id}
                                        className={
                                            image.active
                                                ? "admin-gallery-card"
                                                : "admin-gallery-card admin-gallery-card--inactive"
                                        }
                                    >
                                        <div className="admin-gallery-card__image">
                                            <img
                                                src={image.imageUrl}
                                                alt={`Imagine galerie ${image.displayOrder}`}
                                                loading="lazy"
                                            />

                                            <span
                                                className={
                                                    image.active
                                                        ? "admin-gallery-card__status admin-gallery-card__status--active"
                                                        : "admin-gallery-card__status"
                                                }
                                            >
                                                {image.active
                                                    ? "Vizibilă"
                                                    : "Ascunsă"}
                                            </span>
                                        </div>

                                        <div className="admin-gallery-card__content">
                                            <div className="admin-gallery-card__meta">
                                                <strong>
                                                    Imagine #{image.id}
                                                </strong>

                                                <span>
                                                    {formatAccountDate(
                                                        image.createdAt
                                                    )}
                                                </span>
                                            </div>

                                            <div className="admin-gallery-card__order">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        galleryUpdatingId !== null ||
                                                        image.displayOrder <= 1
                                                    }
                                                    onClick={() =>
                                                        void handleGalleryChangeOrder(
                                                            image,
                                                            image.displayOrder - 1
                                                        )
                                                    }
                                                    aria-label="Mută imaginea mai sus"
                                                >
                                                    ↑
                                                </button>

                                                <span>
                                                    Poziția {image.displayOrder}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        galleryUpdatingId !== null ||
                                                        image.displayOrder >= galleryImages.length
                                                    }
                                                    onClick={() =>
                                                        void handleGalleryChangeOrder(
                                                            image,
                                                            image.displayOrder + 1
                                                        )
                                                    }
                                                    aria-label="Mută imaginea mai jos"
                                                >
                                                    ↓
                                                </button>
                                            </div>

                                            <div className="admin-gallery-card__actions">
                                                <input
                                                    id={`admin-gallery-replace-${image.id}`}
                                                    className="admin-gallery__file-input"
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={
                                                        galleryReplacingId !== null ||
                                                        galleryUpdatingId !== null ||
                                                        galleryDeletingId !== null
                                                    }
                                                    onChange={(event) =>
                                                        void handleGalleryReplace(
                                                            image,
                                                            event
                                                        )
                                                    }
                                                />

                                                <label
                                                    htmlFor={`admin-gallery-replace-${image.id}`}
                                                    className={
                                                        galleryReplacingId !== null ||
                                                        galleryUpdatingId !== null ||
                                                        galleryDeletingId !== null
                                                            ? "admin-gallery__upload-button admin-gallery__upload-button--disabled"
                                                            : "admin-gallery__upload-button"
                                                    }
                                                >
                                                    {galleryReplacingId === image.id
                                                        ? "Se schimbă..."
                                                        : "Schimbă poza"}
                                                </label>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        galleryUpdatingId !== null ||
                                                        galleryDeletingId !== null ||
                                                        galleryReplacingId !== null
                                                    }
                                                    onClick={() =>
                                                        void handleGalleryToggleActive(
                                                            image
                                                        )
                                                    }
                                                >
                                                    {galleryUpdatingId === image.id
                                                        ? "Se salvează..."
                                                        : image.active
                                                          ? "Ascunde"
                                                          : "Activează"}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        galleryDeletingId !== null ||
                                                        galleryUpdatingId !== null ||
                                                        galleryReplacingId !== null
                                                    }
                                                    onClick={() =>
                                                        void handleGalleryDelete(
                                                            image
                                                        )
                                                    }
                                                >
                                                    {galleryDeletingId === image.id
                                                        ? "Se șterge..."
                                                        : "Șterge"}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "CONTACT" && (
                    <>
                        {shopSettingsLoading ? (
                            <p className="admin-message">
                                Se încarcă datele de contact...
                            </p>
                        ) : (
                            <div className="admin-program-layout">
                                <section className="admin-program-card">
                                    <div className="admin-program-card__header">
                                        <div>
                                            <p className="section-eyebrow">
                                                FRIZERIE
                                            </p>

                                            <h2>
                                                Locație
                                            </h2>

                                            <p>
                                                Adresa și harta salvate aici vor fi afișate pe pagina publică de contact.
                                            </p>
                                        </div>
                                    </div>

                                    <form
                                        className="admin-time-off-form"
                                        onSubmit={
                                            handleSaveShopSettings
                                        }
                                    >
                                        <label>
                                            Adresa frizeriei

                                            <input
                                                type="text"
                                                value={
                                                    shopAddress
                                                }
                                                onChange={(event) =>
                                                    setShopAddress(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Strada, număr, oraș"
                                                required
                                            />
                                        </label>

                                        <label>
                                            Google Maps Embed URL

                                            <textarea
                                                rows={5}
                                                value={
                                                    shopMapEmbedUrl
                                                }
                                                onChange={(event) =>
                                                    setShopMapEmbedUrl(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="https://www.google.com/maps/embed?pb=..."
                                            />
                                        </label>

                                        <label>
                                            Google Maps URL

                                            <textarea
                                                rows={4}
                                                value={
                                                    shopMapsUrl
                                                }
                                                onChange={(event) =>
                                                    setShopMapsUrl(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="https://maps.google.com/..."
                                            />
                                        </label>

                                        <button
                                            type="submit"
                                            className="admin-service-form__submit"
                                            disabled={
                                                shopSettingsSaving
                                            }
                                        >
                                            {shopSettingsSaving
                                                ? "Se salvează..."
                                                : "Salvează locația"}
                                        </button>

                                        {shopSettings && (
                                            <p className="admin-appointment-panel__id">
                                                ID setări:{" "}
                                                {shopSettings.id}
                                            </p>
                                        )}
                                    </form>
                                </section>

                                <aside className="admin-program-card">
                                    <div className="admin-program-card__header">
                                        <div>
                                            <p className="section-eyebrow">
                                                PREVIZUALIZARE
                                            </p>

                                            <h2>
                                                Contact public
                                            </h2>

                                            <p>
                                                Verifică rapid datele care vor apărea pe pagina de contact.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="admin-appointment-panel__info">
                                        <div>
                                            <span>
                                                Adresă
                                            </span>

                                            <strong>
                                                {shopAddress.trim() ||
                                                    "Adresă neconfigurată"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Embed hartă
                                            </span>

                                            <strong>
                                                {shopMapEmbedUrl.trim()
                                                    ? "CONFIGURAT"
                                                    : "NECONFIGURAT"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Link Google Maps
                                            </span>

                                            <strong>
                                                {shopMapsUrl.trim()
                                                    ? "CONFIGURAT"
                                                    : "NECONFIGURAT"}
                                            </strong>
                                        </div>
                                    </div>

                                    {shopMapsUrl.trim() && (
                                        <a
                                            href={
                                                shopMapsUrl
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="admin-service-form__submit"
                                        >
                                            Deschide în Google Maps
                                        </a>
                                    )}
                                </aside>
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
        reward !== "NOTHING"
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
        case "POWDER":
            return "O pudră";
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

function formatAssistantCampaignDate(date: string) {
    return new Intl.DateTimeFormat("ro-RO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("ro-RO", {
        style: "currency",
        currency: "RON",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

function timeToMinutes(time: string) {
    const [hours, minutes] = time
        .split(":")
        .map(Number);

    return hours * 60 + minutes;
}

function getAppointmentPosition(
    appointment: AppointmentResponse,
    calendarStartHour: number
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
        calendarStartHour * 60;

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
