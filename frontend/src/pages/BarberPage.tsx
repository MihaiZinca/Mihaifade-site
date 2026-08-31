import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getRole } from "../services/auth";
import "./BarberPage.css";

import type {
    AppointmentResponse,
    AppointmentStatus,
    BarbershopService,
} from "../types";

interface BarberResponse {
    id: number;
    displayName: string;
    bio: string | null;
    imageUrl: string | null;
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

type DayOfWeek =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

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

interface BarberServiceDraft {
    price: string;
    durationMinutes: string;
}

type WelcomeRewardType =
    | "NOTHING"
    | "POWDER"
    | "DISCOUNT_10"
    | "DISCOUNT_25"
    | "DISCOUNT_50"
    | "CASH_50"
    | "CASH_100"
    | "FREE_HAIRCUT";

interface WelcomeRewardStatusResponse {
    canSpin: boolean;
    reward: WelcomeRewardType | null;
    rewardLabel: string | null;
    rewardUsed: boolean;
}

interface ClientOfferResponse {
    id: number;
    discountPercent: number;
    createdAt: string;
    expiresAt: string;
    used: boolean;
    usedAt: string | null;
}

type BarberTab = "DASHBOARD" | "CALENDAR" | "PROGRAM" | "SERVICES";

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

function BarberPage() {
    const [barber, setBarber] =
        useState<BarberResponse | null>(null);

    const [stats, setStats] =
        useState<BarberStatsResponse | null>(null);

    const [appointments, setAppointments] =
        useState<AppointmentResponse[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [updatingId, setUpdatingId] =
        useState<number | null>(null);

    const [activeTab, setActiveTab] =
        useState<BarberTab>("DASHBOARD");

    const [weekOffset, setWeekOffset] =
        useState(0);

    const [selectedAppointment, setSelectedAppointment] =
        useState<AppointmentResponse | null>(null);

    const [welcomeReward, setWelcomeReward] =
        useState<WelcomeRewardStatusResponse | null>(null);

    const [welcomeRewardLoading, setWelcomeRewardLoading] =
        useState(false);

    const [welcomeRewardUsing, setWelcomeRewardUsing] =
        useState(false);

    const [welcomeRewardError, setWelcomeRewardError] =
        useState("");

    const [clientOffers, setClientOffers] =
        useState<ClientOfferResponse[]>([]);

    const [clientOffersLoading, setClientOffersLoading] =
        useState(false);

    const [clientOfferUsingId, setClientOfferUsingId] =
        useState<number | null>(null);

    const [clientOffersError, setClientOffersError] =
        useState("");

    const [workingHours, setWorkingHours] =
        useState<WorkingHoursResponse[]>([]);

    const [timeOff, setTimeOff] =
        useState<TimeOffResponse[]>([]);

    const [programLoading, setProgramLoading] =
        useState(false);

    const [savingProgramDay, setSavingProgramDay] =
        useState<DayOfWeek | null>(null);

    const [timeOffSaving, setTimeOffSaving] =
        useState(false);

    const [timeOffDeletingId, setTimeOffDeletingId] =
        useState<number | null>(null);

    const [timeOffDate, setTimeOffDate] =
        useState("");

    const [timeOffFullDay, setTimeOffFullDay] =
        useState(true);

    const [timeOffStart, setTimeOffStart] =
        useState("12:00");

    const [timeOffEnd, setTimeOffEnd] =
        useState("13:00");

    const [timeOffReason, setTimeOffReason] =
        useState("");

    const [services, setServices] =
        useState<BarbershopService[]>([]);

    const [servicesLoading, setServicesLoading] =
        useState(false);

    const [servicesSaving, setServicesSaving] =
        useState(false);

    const [selectedServiceIds, setSelectedServiceIds] =
        useState<number[]>([]);

    const [serviceDrafts, setServiceDrafts] =
        useState<Record<number, BarberServiceDraft>>({});

    const loadDashboard = async () => {
        setLoading(true);
        setError("");

        try {
            const [
                barberResponse,
                statsResponse,
                appointmentsResponse,
            ] = await Promise.all([
                api.get<BarberResponse>(
                    "/barbers/me"
                ),
                api.get<BarberStatsResponse>(
                    "/barbers/me/stats"
                ),
                api.get<AppointmentResponse[]>(
                    "/appointments/barber/me"
                ),
            ]);

            setBarber(
                barberResponse.data
            );

            setStats(
                statsResponse.data
            );

            setAppointments(
                appointmentsResponse.data
            );
        } catch {
            setError(
                "Dashboard-ul barberului nu a putut fi încărcat."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadProgram = async () => {
        setProgramLoading(true);
        setError("");

        try {
            const [
                workingHoursResponse,
                timeOffResponse,
            ] = await Promise.all([
                api.get<WorkingHoursResponse[]>(
                    "/barbers/me/working-hours"
                ),
                api.get<TimeOffResponse[]>(
                    "/barbers/me/time-off"
                ),
            ]);

            setWorkingHours(
                workingHoursResponse.data.map((item) => ({
                    ...item,
                    startTime:
                        item.startTime.slice(
                            0,
                            5
                        ),
                    endTime:
                        item.endTime.slice(
                            0,
                            5
                        ),
                }))
            );

            setTimeOff(
                [...timeOffResponse.data].sort(
                    (a, b) =>
                        a.date.localeCompare(
                            b.date
                        )
                )
            );
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

    const loadServices = async () => {
        setServicesLoading(true);
        setError("");

        try {
            const [
                servicesResponse,
                offeringsResponse,
            ] = await Promise.all([
                api.get<BarbershopService[]>(
                    "/services"
                ),
                api.get<BarberServiceOfferingResponse[]>(
                    "/barber-service-offerings/me"
                ),
            ]);

            setServices(
                servicesResponse.data
            );

            const offeringByServiceId =
                new Map(
                    offeringsResponse.data.map(
                        (offering) => [
                            offering.serviceId,
                            offering,
                        ]
                    )
                );

            const nextDrafts:
                Record<number, BarberServiceDraft> =
                    {};

            servicesResponse.data.forEach(
                (service) => {
                    const offering =
                        offeringByServiceId.get(
                            service.id
                        );

                    nextDrafts[service.id] = {
                        price: String(
                            offering?.price ??
                                service.price
                        ),
                        durationMinutes: String(
                            offering?.durationMinutes ??
                                service.durationMinutes
                        ),
                    };
                }
            );

            setServiceDrafts(
                nextDrafts
            );
        } catch {
            setServices([]);
            setServiceDrafts({});
            setError(
                "Serviciile nu au putut fi încărcate."
            );
        } finally {
            setServicesLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
        loadServices();
    }, []);

    useEffect(() => {
        if (!barber) {
            return;
        }

        loadProgram();
    }, [barber?.id]);

    useEffect(() => {
        if (!barber) {
            setSelectedServiceIds([]);
            return;
        }

        setSelectedServiceIds(
            (barber.services ?? []).map(
                (service) =>
                    service.id
            )
        );
    }, [barber]);

    useEffect(() => {
        if (!selectedAppointment) {
            setWelcomeReward(null);
            setWelcomeRewardLoading(false);
            setWelcomeRewardUsing(false);
            setWelcomeRewardError("");
            return;
        }

        let cancelled = false;

        const loadWelcomeReward = async () => {
            setWelcomeReward(null);
            setWelcomeRewardLoading(true);
            setWelcomeRewardUsing(false);
            setWelcomeRewardError("");

            try {
                const response =
                    await api.get<WelcomeRewardStatusResponse>(
                        `/rewards/barber/appointments/${selectedAppointment.id}`
                    );

                if (!cancelled) {
                    setWelcomeReward(
                        response.data
                    );
                }
            } catch {
                if (!cancelled) {
                    setWelcomeReward(null);
                    setWelcomeRewardError(
                        "Premiul clientului nu a putut fi încărcat."
                    );
                }
            } finally {
                if (!cancelled) {
                    setWelcomeRewardLoading(false);
                }
            }
        };

        loadWelcomeReward();

        return () => {
            cancelled = true;
        };
    }, [selectedAppointment?.id]);

    useEffect(() => {
        if (!selectedAppointment) {
            setClientOffers([]);
            setClientOffersLoading(false);
            setClientOfferUsingId(null);
            setClientOffersError("");
            return;
        }

        let cancelled = false;

        const loadClientOffers = async () => {
            setClientOffers([]);
            setClientOffersLoading(true);
            setClientOfferUsingId(null);
            setClientOffersError("");

            try {
                const response =
                    await api.get<ClientOfferResponse[]>(
                        `/client-offers/barber/appointments/${selectedAppointment.id}`
                    );

                if (!cancelled) {
                    setClientOffers(
                        response.data
                    );
                }
            } catch {
                if (!cancelled) {
                    setClientOffers([]);
                    setClientOffersError(
                        "Reducerile clientului nu au putut fi încărcate."
                    );
                }
            } finally {
                if (!cancelled) {
                    setClientOffersLoading(false);
                }
            }
        };

        loadClientOffers();

        return () => {
            cancelled = true;
        };
    }, [selectedAppointment?.id]);

    const upcomingAppointments =
        useMemo(() => {
            const today =
                new Date()
                    .toISOString()
                    .slice(0, 10);

            return appointments
                .filter(
                    (appointment) =>
                        appointment.date >= today &&
                        appointment.status !==
                            "CANCELLED" &&
                        appointment.status !==
                            "COMPLETED" &&
                        appointment.status !==
                            "NO_SHOW"
                )
                .sort((a, b) => {
                    const first =
                        `${a.date} ${a.startTime}`;

                    const second =
                        `${b.date} ${b.startTime}`;

                    return first.localeCompare(
                        second
                    );
                });
        }, [appointments]);

    const recentAppointments =
        useMemo(() => {
            return [...appointments]
                .sort((a, b) => {
                    const first =
                        `${a.date} ${a.startTime}`;

                    const second =
                        `${b.date} ${b.startTime}`;

                    return second.localeCompare(
                        first
                    );
                })
                .slice(0, 20);
        }, [appointments]);

    const programDays = useMemo(
        () =>
            DAY_OF_WEEK_VALUES.map(
                (dayOfWeek) => {
                    const existing =
                        workingHours.find(
                            (item) =>
                                item.dayOfWeek ===
                                dayOfWeek
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
                }
            ),
        [workingHours]
    );

    const updateWorkingDay = (
        dayOfWeek: DayOfWeek,
        patch: Partial<WorkingHoursResponse>
    ) => {
        setWorkingHours((current) => {
            const existing =
                current.find(
                    (item) =>
                        item.dayOfWeek ===
                        dayOfWeek
                );

            if (existing) {
                return current.map((item) =>
                    item.dayOfWeek ===
                    dayOfWeek
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

        setSavingProgramDay(
            day.dayOfWeek
        );
        setError("");

        try {
            const response =
                await api.put<WorkingHoursResponse>(
                    "/barbers/me/working-hours",
                    {
                        dayOfWeek:
                            day.dayOfWeek,
                        startTime:
                            day.startTime,
                        endTime:
                            day.endTime,
                        active:
                            day.active,
                    }
                );

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

            setWorkingHours((current) => {
                const exists =
                    current.some(
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

                return current.map(
                    (item) =>
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
            setSavingProgramDay(
                null
            );
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
            setError(
                "Selectează data."
            );
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
                    "/barbers/me/time-off",
                    {
                        date:
                            timeOffDate,
                        startTime:
                            timeOffFullDay
                                ? null
                                : timeOffStart,
                        endTime:
                            timeOffFullDay
                                ? null
                                : timeOffEnd,
                        fullDay:
                            timeOffFullDay,
                        reason:
                            timeOffReason.trim() ===
                            ""
                                ? null
                                : timeOffReason.trim(),
                    }
                );

            setTimeOff((current) => {
                const exists =
                    current.some(
                        (item) =>
                            item.date ===
                            response.data.date
                    );

                const next =
                    exists
                        ? current.map(
                              (item) =>
                                  item.date ===
                                  response.data.date
                                      ? response.data
                                      : item
                          )
                        : [
                              ...current,
                              response.data,
                          ];

                return [
                    ...next,
                ].sort(
                    (a, b) =>
                        a.date.localeCompare(
                            b.date
                        )
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

        setTimeOffDeletingId(
            item.id
        );
        setError("");

        try {
            await api.delete(
                `/barbers/me/time-off/${item.id}`
            );

            setTimeOff((current) =>
                current.filter(
                    (entry) =>
                        entry.id !==
                        item.id
                )
            );
        } catch {
            setError(
                "Indisponibilitatea nu a putut fi ștearsă."
            );
        } finally {
            setTimeOffDeletingId(
                null
            );
        }
    };

    const activeServices =
        useMemo(
            () =>
                services
                    .filter(
                        (service) =>
                            service.active
                    )
                    .sort((a, b) =>
                        a.name.localeCompare(
                            b.name,
                            "ro-RO"
                        )
                    ),
            [services]
        );

    const handleToggleService = (
        serviceId: number
    ) => {
        setSelectedServiceIds(
            (current) =>
                current.includes(
                    serviceId
                )
                    ? current.filter(
                          (id) =>
                              id !==
                              serviceId
                      )
                    : [
                          ...current,
                          serviceId,
                      ]
        );
    };

    const updateServiceDraft = (
        serviceId: number,
        patch: Partial<BarberServiceDraft>
    ) => {
        setServiceDrafts(
            (current) => ({
                ...current,
                [serviceId]: {
                    price:
                        current[serviceId]?.price ??
                        "",
                    durationMinutes:
                        current[serviceId]
                            ?.durationMinutes ??
                        "",
                    ...patch,
                },
            })
        );
    };

    const handleSaveServices = async () => {
        if (!barber) {
            return;
        }

        for (
            const serviceId
            of selectedServiceIds
        ) {
            const service =
                services.find(
                    (item) =>
                        item.id === serviceId
                );

            if (!service) {
                continue;
            }

            const draft =
                serviceDrafts[serviceId] ?? {
                    price: String(
                        service.price
                    ),
                    durationMinutes: String(
                        service.durationMinutes
                    ),
                };

            const price =
                Number(
                    draft.price
                );

            const durationMinutes =
                Number(
                    draft.durationMinutes
                );

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {
                setError(
                    `Prețul pentru „${service.name}” nu este valid.`
                );
                return;
            }

            if (
                !Number.isInteger(
                    durationMinutes
                ) ||
                durationMinutes < 1
            ) {
                setError(
                    `Durata pentru „${service.name}” trebuie să fie de cel puțin 1 minut.`
                );
                return;
            }
        }

        setServicesSaving(true);
        setError("");

        try {
            const barberResponse =
                await api.put<BarberResponse>(
                    "/barbers/me/services",
                    selectedServiceIds
                );

            await Promise.all(
                selectedServiceIds.map(
                    async (serviceId) => {
                        const service =
                            services.find(
                                (item) =>
                                    item.id ===
                                    serviceId
                            );

                        if (!service) {
                            return;
                        }

                        const draft =
                            serviceDrafts[
                                serviceId
                            ] ?? {
                                price: String(
                                    service.price
                                ),
                                durationMinutes:
                                    String(
                                        service.durationMinutes
                                    ),
                            };

                        await api.put<BarberServiceOfferingResponse>(
                            "/barber-service-offerings/me",
                            {
                                serviceId,
                                price: Number(
                                    draft.price
                                ),
                                durationMinutes:
                                    Number(
                                        draft.durationMinutes
                                    ),
                                active: true,
                            }
                        );
                    }
                )
            );

            const offeringsResponse =
                await api.get<
                    BarberServiceOfferingResponse[]
                >(
                    "/barber-service-offerings/me"
                );

            setBarber(
                barberResponse.data
            );

            setSelectedServiceIds(
                (
                    barberResponse.data.services ??
                    []
                ).map(
                    (service) =>
                        service.id
                )
            );

            const offeringByServiceId =
                new Map(
                    offeringsResponse.data.map(
                        (offering) => [
                            offering.serviceId,
                            offering,
                        ]
                    )
                );

            setServiceDrafts(
                (current) => {
                    const next = {
                        ...current,
                    };

                    services.forEach(
                        (service) => {
                            const offering =
                                offeringByServiceId.get(
                                    service.id
                                );

                            if (offering) {
                                next[service.id] = {
                                    price: String(
                                        offering.price
                                    ),
                                    durationMinutes:
                                        String(
                                            offering.durationMinutes
                                        ),
                                };
                            }
                        }
                    );

                    return next;
                }
            );
        } catch {
            setError(
                "Serviciile, prețurile sau duratele tale nu au putut fi salvate."
            );
        } finally {
            setServicesSaving(false);
        }
    };

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
        let startHour = START_HOUR;
        let endHour = END_HOUR;

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

        startHour = Math.max(
            0,
            startHour
        );

        endHour = Math.min(
            23,
            endHour
        );

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
    }, [calendarAppointments]);

    const weekLabel = `${formatShortDate(
        weekDays[0]
    )} - ${formatShortDate(
        weekDays[6]
    )}`;

    const handleMarkWelcomeRewardAsUsed = async () => {
        if (
            !selectedAppointment ||
            !welcomeReward?.reward ||
            welcomeReward.reward === "NOTHING" ||
            welcomeReward.rewardUsed
        ) {
            return;
        }

        setWelcomeRewardUsing(true);
        setWelcomeRewardError("");

        try {
            const response =
                await api.put<WelcomeRewardStatusResponse>(
                    `/rewards/barber/appointments/${selectedAppointment.id}/use`
                );

            setWelcomeReward(
                response.data
            );
        } catch {
            setWelcomeRewardError(
                "Premiul nu a putut fi marcat ca folosit."
            );
        } finally {
            setWelcomeRewardUsing(false);
        }
    };

    const handleMarkClientOfferAsUsed = async (
        offerId: number
    ) => {
        if (
            !selectedAppointment ||
            clientOfferUsingId !== null
        ) {
            return;
        }

        setClientOfferUsingId(offerId);
        setClientOffersError("");

        try {
            await api.put<ClientOfferResponse>(
                `/client-offers/barber/appointments/${selectedAppointment.id}/offers/${offerId}/use`
            );

            setClientOffers((current) =>
                current.filter(
                    (offer) =>
                        offer.id !== offerId
                )
            );
        } catch {
            setClientOffersError(
                "Reducerea nu a putut fi marcată ca folosită."
            );
        } finally {
            setClientOfferUsingId(null);
        }
    };

    const handleStatusChange = async (
        appointmentId: number,
        status: AppointmentStatus
    ) => {
        setUpdatingId(
            appointmentId
        );

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
                current.map(
                    (appointment) =>
                        appointment.id ===
                        appointmentId
                            ? response.data
                            : appointment
                )
            );

            setSelectedAppointment((current) =>
                current?.id === appointmentId
                    ? response.data
                    : current
            );

            const statsResponse =
                await api.get<BarberStatsResponse>(
                    "/barbers/me/stats"
                );

            setStats(
                statsResponse.data
            );
        } catch {
            setError(
                "Statusul programării nu a putut fi actualizat."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <main className="barber-page">
                <p className="barber-message">
                    Se încarcă dashboard-ul...
                </p>
            </main>
        );
    }

    return (
        <main className="barber-page">
            <header className="barber-header">
                <div className="barber-header__identity">
                    <Link
                        to="/"
                        className="barber-header__brand"
                    >
                        MIHAIFADE
                    </Link>

                    <span>
                        BARBER
                    </span>
                </div>

                <div className="barber-header__right">
                    <strong>
                        {barber?.displayName ??
                            "Barber"}
                    </strong>

                    {getRole() === "OWNER" && (
                        <Link to="/admin">
                            Admin
                        </Link>
                    )}

                    <Link to="/">
                        Vezi site-ul
                    </Link>
                </div>
            </header>

            <section className="barber-content">
                <div className="barber-intro">
                    <p className="section-eyebrow">
                        DASHBOARD
                    </p>

                    <h1>
                        Salut,{" "}
                        {barber?.displayName ??
                            "Barber"}.
                    </h1>

                    <p>
                        Vezi programările tale,
                        statisticile și activitatea
                        personală.
                    </p>
                </div>

                {error && (
                    <p className="barber-error">
                        {error}
                    </p>
                )}

                <div className="barber-tabs">
                    <button
                        type="button"
                        className={
                            activeTab === "DASHBOARD"
                                ? "barber-tab barber-tab--active"
                                : "barber-tab"
                        }
                        onClick={() => {
                            setActiveTab(
                                "DASHBOARD"
                            );
                            setSelectedAppointment(
                                null
                            );
                        }}
                    >
                        Dashboard
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "CALENDAR"
                                ? "barber-tab barber-tab--active"
                                : "barber-tab"
                        }
                        onClick={() =>
                            setActiveTab(
                                "CALENDAR"
                            )
                        }
                    >
                        Calendar
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "PROGRAM"
                                ? "barber-tab barber-tab--active"
                                : "barber-tab"
                        }
                        onClick={() => {
                            setActiveTab(
                                "PROGRAM"
                            );
                            setSelectedAppointment(
                                null
                            );
                        }}
                    >
                        Program
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "SERVICES"
                                ? "barber-tab barber-tab--active"
                                : "barber-tab"
                        }
                        onClick={() => {
                            setActiveTab(
                                "SERVICES"
                            );
                            setSelectedAppointment(
                                null
                            );
                        }}
                    >
                        Servicii
                    </button>
                </div>

                {activeTab === "DASHBOARD" && (
                    <>
                {stats && (
                    <div className="barber-stats">
                        <article className="barber-stat-card">
                            <span>
                                Programări azi
                            </span>

                            <strong>
                                {
                                    stats.appointmentsToday
                                }
                            </strong>

                            <small>
                                Programări active azi
                            </small>
                        </article>

                        <article className="barber-stat-card">
                            <span>
                                Următoare
                            </span>

                            <strong>
                                {
                                    stats.upcomingAppointments
                                }
                            </strong>

                            <small>
                                Programări viitoare
                            </small>
                        </article>

                        <article className="barber-stat-card">
                            <span>
                                Finalizate
                            </span>

                            <strong>
                                {
                                    stats.completedAppointments
                                }
                            </strong>

                            <small>
                                Total programări
                            </small>
                        </article>

                        <article className="barber-stat-card">
                            <span>
                                Clienți
                            </span>

                            <strong>
                                {
                                    stats.uniqueClients
                                }
                            </strong>

                            <small>
                                Clienți unici
                            </small>
                        </article>

                        <article className="barber-stat-card">
                            <span>
                                Venit azi
                            </span>

                            <strong>
                                {formatCurrency(
                                    stats.revenueToday
                                )}
                            </strong>

                            <small>
                                Programări finalizate
                            </small>
                        </article>

                        <article className="barber-stat-card barber-stat-card--revenue">
                            <span>
                                Venit luna asta
                            </span>

                            <strong>
                                {formatCurrency(
                                    stats.revenueThisMonth
                                )}
                            </strong>

                            <small>
                                Luna curentă
                            </small>
                        </article>
                    </div>
                )}

                <div className="barber-dashboard-grid">
                    <section className="barber-panel">
                        <div className="barber-panel__header">
                            <div>
                                <p className="section-eyebrow">
                                    URMĂTOARELE PROGRAMĂRI
                                </p>

                                <h2>
                                    Program
                                </h2>
                            </div>

                            <span>
                                {
                                    upcomingAppointments.length
                                }
                            </span>
                        </div>

                        {upcomingAppointments.length ===
                        0 ? (
                            <p className="barber-message">
                                Nu ai programări viitoare.
                            </p>
                        ) : (
                            <div className="barber-appointments">
                                {upcomingAppointments.map(
                                    (
                                        appointment
                                    ) => (
                                        <article
                                            key={
                                                appointment.id
                                            }
                                            className="barber-appointment-card"
                                        >
                                            <div className="barber-appointment-card__time">
                                                <strong>
                                                    {appointment.startTime.slice(
                                                        0,
                                                        5
                                                    )}
                                                </strong>

                                                <span>
                                                    {formatDate(
                                                        appointment.date
                                                    )}
                                                </span>
                                            </div>

                                            <div className="barber-appointment-card__client">
                                                <strong>
                                                    {
                                                        appointment.clientName
                                                    }
                                                </strong>

                                                <span>
                                                    {appointment.clientPhone ??
                                                        "Fără telefon"}
                                                </span>

                                                <span>
                                                    {
                                                        appointment.serviceName
                                                    }
                                                </span>
                                            </div>

                                            <div className="barber-appointment-card__meta">
                                                <strong>
                                                    {formatCurrency(
                                                        Number(
                                                            appointment.servicePrice
                                                        )
                                                    )}
                                                </strong>

                                                <span>
                                                    {
                                                        appointment.status
                                                    }
                                                </span>
                                            </div>

                                            <div className="barber-appointment-card__actions">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        updatingId ===
                                                        appointment.id
                                                    }
                                                    onClick={() =>
                                                        handleStatusChange(
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
                                                        updatingId ===
                                                        appointment.id
                                                    }
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            appointment.id,
                                                            "CANCELLED"
                                                        )
                                                    }
                                                >
                                                    Anulează
                                                </button>
                                            </div>
                                        </article>
                                    )
                                )}
                            </div>
                        )}
                    </section>

                    <aside className="barber-panel">
                        <div className="barber-panel__header">
                            <div>
                                <p className="section-eyebrow">
                                    PROFIL
                                </p>

                                <h2>
                                    {
                                        barber?.displayName
                                    }
                                </h2>
                            </div>

                            <span
                                className={
                                    barber?.active
                                        ? "barber-status barber-status--active"
                                        : "barber-status barber-status--inactive"
                                }
                            >
                                {barber?.active
                                    ? "ACTIV"
                                    : "INACTIV"}
                            </span>
                        </div>

                        <div className="barber-profile">
                            <div>
                                <span>
                                    Email
                                </span>

                                <strong>
                                    {barber?.user?.email ??
                                        "-"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Telefon
                                </span>

                                <strong>
                                    {barber?.user?.phone ??
                                        "-"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Bio
                                </span>

                                <strong>
                                    {barber?.bio ||
                                        "Fără descriere"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Servicii
                                </span>

                                <strong>
                                    {
                                        (
                                            barber?.services ??
                                            []
                                        ).length
                                    }
                                </strong>
                            </div>
                        </div>
                    </aside>
                </div>

                <section className="barber-panel barber-panel--history">
                    <div className="barber-panel__header">
                        <div>
                            <p className="section-eyebrow">
                                ISTORIC
                            </p>

                            <h2>
                                Programări recente
                            </h2>
                        </div>
                    </div>

                    {recentAppointments.length ===
                    0 ? (
                        <p className="barber-message">
                            Nu există programări.
                        </p>
                    ) : (
                        <div className="barber-history">
                            {recentAppointments.map(
                                (appointment) => (
                                    <article
                                        key={
                                            appointment.id
                                        }
                                        className="barber-history-row"
                                    >
                                        <div>
                                            <strong>
                                                {
                                                    appointment.clientName
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    appointment.serviceName
                                                }
                                            </span>
                                        </div>

                                        <div>
                                            <strong>
                                                {formatDate(
                                                    appointment.date
                                                )}
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

                                        <div>
                                            <strong>
                                                {formatCurrency(
                                                    Number(
                                                        appointment.servicePrice
                                                    )
                                                )}
                                            </strong>

                                            <span>
                                                {
                                                    appointment.status
                                                }
                                            </span>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </section>
                    </>
                )}

                {activeTab === "CALENDAR" && (
                    <>
                        <div className="barber-calendar-toolbar">
                            <div className="barber-calendar-toolbar__navigation">
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

                        <div
                            className={
                                selectedAppointment
                                    ? "barber-calendar-layout barber-calendar-layout--details"
                                    : "barber-calendar-layout"
                            }
                        >
                            <div className="barber-calendar-scroll">
                                <div className="barber-calendar">
                                    <div className="barber-calendar__corner" />

                                    {weekDays.map(
                                        (date, index) => (
                                            <div
                                                key={date.toISOString()}
                                                className="barber-calendar__day-header"
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

                                    <div className="barber-calendar__hours">
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
                                                        className="barber-calendar__hour"
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
                                                className="barber-calendar__day"
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
                                                            className="barber-calendar__grid-line"
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
                                                                className={`barber-calendar-event barber-calendar-event--${appointment.status.toLowerCase()}`}
                                                                style={{
                                                                    top: position.top,
                                                                    height: position.height,
                                                                }}
                                                                onClick={() =>
                                                                    setSelectedAppointment(
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
                                <aside className="barber-calendar-panel">
                                    <div className="barber-calendar-panel__top">
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
                                            className="barber-calendar-panel__close"
                                            onClick={() =>
                                                setSelectedAppointment(
                                                    null
                                                )
                                            }
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="barber-calendar-panel__status">
                                        {
                                            selectedAppointment.status
                                        }
                                    </div>

                                    <div className="barber-calendar-panel__time">
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

                                    <div className="barber-calendar-panel__info">
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
                                                Preț
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    Number(
                                                        selectedAppointment.servicePrice
                                                    )
                                                )}
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

                                        <div>
                                            <span>
                                                Premiu roată
                                            </span>

                                            <strong>
                                                {welcomeRewardLoading
                                                    ? "Se încarcă..."
                                                    : welcomeRewardError
                                                      ? welcomeRewardError
                                                      : welcomeReward?.reward
                                                        ? `${welcomeReward.rewardLabel ?? welcomeReward.reward} · ${welcomeReward.rewardUsed ? "FOLOSIT" : welcomeReward.reward === "NOTHING" ? "FĂRĂ PREMIU" : "DISPONIBIL"}`
                                                        : "Fără premiu"}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>
                                                Reduceri active
                                            </span>

                                            <strong>
                                                {clientOffersLoading
                                                    ? "Se încarcă..."
                                                    : clientOffersError
                                                      ? clientOffersError
                                                      : clientOffers.length > 0
                                                        ? clientOffers
                                                              .map(
                                                                  (offer) =>
                                                                      `${offer.discountPercent}% până la ${formatDateTime(offer.expiresAt)}`
                                                              )
                                                              .join(" · ")
                                                        : "Fără reduceri active"}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="barber-calendar-panel__actions">
                                        {clientOffers.map(
                                            (offer) => (
                                                <button
                                                    key={offer.id}
                                                    type="button"
                                                    className="barber-calendar-panel__complete"
                                                    disabled={
                                                        clientOfferUsingId !==
                                                            null ||
                                                        clientOffersLoading
                                                    }
                                                    onClick={() =>
                                                        handleMarkClientOfferAsUsed(
                                                            offer.id
                                                        )
                                                    }
                                                >
                                                    {clientOfferUsingId ===
                                                    offer.id
                                                        ? "Se marchează..."
                                                        : `Marchează reducerea de ${offer.discountPercent}% ca folosită`}
                                                </button>
                                            )
                                        )}

                                        {welcomeReward?.reward &&
                                            welcomeReward.reward !==
                                                "NOTHING" &&
                                            !welcomeReward.rewardUsed && (
                                                <button
                                                    type="button"
                                                    className="barber-calendar-panel__complete"
                                                    disabled={
                                                        welcomeRewardUsing ||
                                                        welcomeRewardLoading
                                                    }
                                                    onClick={
                                                        handleMarkWelcomeRewardAsUsed
                                                    }
                                                >
                                                    {welcomeRewardUsing
                                                        ? "Se marchează..."
                                                        : "Marchează premiul ca folosit"}
                                                </button>
                                            )}

                                        <button
                                            type="button"
                                            className="barber-calendar-panel__complete"
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
                                            className="barber-calendar-panel__cancel"
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
                                            Anulează
                                        </button>
                                    </div>

                                    <p className="barber-calendar-panel__id">
                                        ID programare:{" "}
                                        {
                                            selectedAppointment.id
                                        }
                                    </p>
                                </aside>
                            )}
                        </div>
                    </>
                )}

                {activeTab === "PROGRAM" && (
                    <>
                        {programLoading ? (
                            <p className="barber-message">
                                Se încarcă programul...
                            </p>
                        ) : !barber ? (
                            <p className="barber-message">
                                Profilul barberului nu este disponibil.
                            </p>
                        ) : (
                            <div className="barber-program">
                                <section className="barber-program-card">
                                    <div className="barber-program-card__header">
                                        <div>
                                            <p className="section-eyebrow">
                                                PROGRAM SĂPTĂMÂNAL
                                            </p>

                                            <h2>
                                                {barber.displayName}
                                            </h2>

                                            <p>
                                                Modifică orele tale de lucru. Disponibilitatea din pagina de programări se actualizează în funcție de programul salvat.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="barber-program-days">
                                        {programDays.map(
                                            (
                                                day,
                                                index
                                            ) => (
                                                <article
                                                    key={
                                                        day.dayOfWeek
                                                    }
                                                    className={
                                                        day.active
                                                            ? "barber-program-day barber-program-day--active"
                                                            : "barber-program-day barber-program-day--closed"
                                                    }
                                                >
                                                    <div className="barber-program-day__identity">
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

                                                    <label className="barber-program-day__toggle">
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
                                                                        active:
                                                                            event
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
                                                        className="barber-program-day__save"
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
                                </section>

                                <section className="barber-program-card barber-time-off">
                                    <div className="barber-program-card__header">
                                        <div>
                                            <p className="section-eyebrow">
                                                ZILE LIBERE / PAUZE
                                            </p>

                                            <h2>
                                                Indisponibilitate
                                            </h2>

                                            <p>
                                                Blochează o zi întreagă sau doar un interval în care nu poți primi programări.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="barber-time-off__layout">
                                        <form
                                            className="barber-time-off-form"
                                            onSubmit={
                                                handleSaveTimeOff
                                            }
                                        >
                                            <label>
                                                Data

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
                                            </label>

                                            <label className="barber-time-off-form__toggle">
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
                                                <div className="barber-time-off-form__row">
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
                                                className="barber-time-off-form__submit"
                                                disabled={
                                                    timeOffSaving
                                                }
                                            >
                                                {timeOffSaving
                                                    ? "Se salvează..."
                                                    : "Adaugă indisponibilitate"}
                                            </button>
                                        </form>

                                        <div className="barber-time-off-list">
                                            {timeOff.length ===
                                            0 ? (
                                                <p className="barber-message">
                                                    Nu ai zile libere sau pauze configurate.
                                                </p>
                                            ) : (
                                                timeOff.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <article
                                                            key={
                                                                item.id
                                                            }
                                                            className="barber-time-off-item"
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
                                </section>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "SERVICES" && (
                    <>
                        {servicesLoading ? (
                            <p className="barber-message">
                                Se încarcă serviciile...
                            </p>
                        ) : !barber ? (
                            <p className="barber-message">
                                Profilul barberului nu este disponibil.
                            </p>
                        ) : (
                            <section className="barber-services">
                                <div className="barber-services__header">
                                    <div>
                                        <p className="section-eyebrow">
                                            SERVICII
                                        </p>

                                        <h2>
                                            Serviciile mele
                                        </h2>

                                        <p>
                                            Selectează serviciile pe care le oferi și stabilește propriul preț și propria durată pentru fiecare serviciu.
                                        </p>
                                    </div>

                                    <div className="barber-services__summary">
                                        <span>
                                            SELECTATE
                                        </span>

                                        <strong>
                                            {
                                                selectedServiceIds.length
                                            }
                                            /
                                            {
                                                activeServices.length
                                            }
                                        </strong>
                                    </div>
                                </div>

                                {activeServices.length ===
                                0 ? (
                                    <p className="barber-message">
                                        Nu există servicii active disponibile momentan.
                                    </p>
                                ) : (
                                    <div className="barber-services__table">
                                        <div className="barber-services__table-head">
                                            <span>
                                                SERVICIU
                                            </span>

                                            <span>
                                                PREȚ
                                            </span>

                                            <span>
                                                DURATĂ
                                            </span>

                                            <span>
                                                STATUS
                                            </span>
                                        </div>

                                        <div className="barber-services__list">
                                            {activeServices.map(
                                                (service) => {
                                                    const isSelected =
                                                        selectedServiceIds.includes(
                                                            service.id
                                                        );

                                                    const draft =
                                                        serviceDrafts[
                                                            service.id
                                                        ] ?? {
                                                            price: String(
                                                                service.price
                                                            ),
                                                            durationMinutes:
                                                                String(
                                                                    service.durationMinutes
                                                                ),
                                                        };

                                                    return (
                                                        <article
                                                            key={
                                                                service.id
                                                            }
                                                            className={
                                                                isSelected
                                                                    ? "barber-service-row barber-service-row--selected"
                                                                    : "barber-service-row"
                                                            }
                                                        >
                                                            <div className="barber-service-row__service">
                                                                <span className="barber-service-row__indicator" />

                                                                <div>
                                                                    <strong>
                                                                        {
                                                                            service.name
                                                                        }
                                                                    </strong>

                                                                    <p>
                                                                        {service.description ||
                                                                            "Fără descriere"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <label className="barber-service-row__field">
                                                                <span>
                                                                    PREȚ
                                                                </span>

                                                                <div className="barber-service-row__input-wrap">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={
                                                                            draft.price
                                                                        }
                                                                        disabled={
                                                                            !isSelected ||
                                                                            servicesSaving
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            updateServiceDraft(
                                                                                service.id,
                                                                                {
                                                                                    price:
                                                                                        event
                                                                                            .target
                                                                                            .value,
                                                                                }
                                                                            )
                                                                        }
                                                                    />

                                                                    <small>
                                                                        RON
                                                                    </small>
                                                                </div>
                                                            </label>

                                                            <label className="barber-service-row__field">
                                                                <span>
                                                                    DURATĂ
                                                                </span>

                                                                <div className="barber-service-row__input-wrap">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        step="1"
                                                                        value={
                                                                            draft.durationMinutes
                                                                        }
                                                                        disabled={
                                                                            !isSelected ||
                                                                            servicesSaving
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            updateServiceDraft(
                                                                                service.id,
                                                                                {
                                                                                    durationMinutes:
                                                                                        event
                                                                                            .target
                                                                                            .value,
                                                                                }
                                                                            )
                                                                        }
                                                                    />

                                                                    <small>
                                                                        MIN
                                                                    </small>
                                                                </div>
                                                            </label>

                                                            <div className="barber-service-row__status">
                                                                <span
                                                                    className={
                                                                        isSelected
                                                                            ? "barber-service-row__status-text barber-service-row__status-text--active"
                                                                            : "barber-service-row__status-text"
                                                                    }
                                                                >
                                                                    {isSelected
                                                                        ? "ACTIV"
                                                                        : "INACTIV"}
                                                                </span>

                                                                <label className="barber-service-row__toggle">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            isSelected
                                                                        }
                                                                        disabled={
                                                                            servicesSaving
                                                                        }
                                                                        onChange={() =>
                                                                            handleToggleService(
                                                                                service.id
                                                                            )
                                                                        }
                                                                    />

                                                                    <span className="barber-service-row__checkbox" />
                                                                </label>
                                                            </div>
                                                        </article>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="barber-services__footer">
                                    <p>
                                        Prețurile și duratele sunt personale pentru contul tău. Modificările se aplică programărilor viitoare după salvare.
                                    </p>

                                    <button
                                        type="button"
                                        className="barber-services__save"
                                        disabled={
                                            servicesSaving
                                        }
                                        onClick={
                                            handleSaveServices
                                        }
                                    >
                                        {servicesSaving
                                            ? "SE SALVEAZĂ..."
                                            : "SALVEAZĂ SERVICIILE"}
                                    </button>
                                </div>
                            </section>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

function formatDateForApi(
    date: Date
) {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}

function formatShortDate(
    date: Date
) {
    return new Intl.DateTimeFormat(
        "ro-RO",
        {
            day: "2-digit",
            month: "short",
        }
    ).format(date);
}

function formatLongDate(
    date: string
) {
    return new Intl.DateTimeFormat(
        "ro-RO",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    ).format(
        new Date(
            `${date}T12:00:00`
        )
    );
}

function timeToMinutes(
    time: string
) {
    const [
        hours,
        minutes,
    ] = time
        .split(":")
        .map(Number);

    return (
        hours * 60 +
        minutes
    );
}

function getAppointmentPosition(
    appointment: AppointmentResponse,
    calendarStartHour: number
) {
    const [
        startHour,
        startMinute,
    ] =
        appointment.startTime
            .split(":")
            .map(Number);

    const [
        endHour,
        endMinute,
    ] =
        appointment.endTime
            .split(":")
            .map(Number);

    const startMinutes =
        startHour * 60 +
        startMinute;

    const endMinutes =
        endHour * 60 +
        endMinute;

    const calendarStart =
        calendarStartHour * 60;

    const top =
        (
            (
                startMinutes -
                calendarStart
            ) /
            60
        ) *
        SLOT_HEIGHT;

    const height =
        (
            (
                endMinutes -
                startMinutes
            ) /
            60
        ) *
        SLOT_HEIGHT;

    return {
        top: Math.max(
            0,
            top
        ),
        height: Math.max(
            38,
            height
        ),
    };
}

function formatCurrency(
    value: number
) {
    return new Intl.NumberFormat(
        "ro-RO",
        {
            style: "currency",
            currency: "RON",
        }
    ).format(value);
}

function formatDate(
    value: string
) {
    return new Intl.DateTimeFormat(
        "ro-RO",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    ).format(
        new Date(
            `${value}T00:00:00`
        )
    );
}

function formatDateTime(
    value: string
) {
    return new Intl.DateTimeFormat(
        "ro-RO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    ).format(
        new Date(value)
    );
}

export default BarberPage;
