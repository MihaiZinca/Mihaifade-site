export interface BarbershopService {
    id: number;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
    active: boolean;
}

export interface AvailabilityResponse {
    date: string;
    barberId: number;
    serviceId: number;
    durationMinutes: number;
    availableSlots: string[];
}

export type AppointmentStatus =
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";

export interface AppointmentResponse {
    id: number;
    userId: number;
    clientName: string;
    clientPhone: string | null;
    barberId: number;
    barberName: string;
    serviceId: number;
    serviceName: string;
    servicePrice: number;
    date: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    notes: string | null;
}