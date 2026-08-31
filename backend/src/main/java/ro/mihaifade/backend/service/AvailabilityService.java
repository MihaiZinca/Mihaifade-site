package ro.mihaifade.backend.service;

import ro.mihaifade.backend.dto.AvailabilityResponse;
import ro.mihaifade.backend.entity.*;
import ro.mihaifade.backend.repository.*;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@org.springframework.stereotype.Service
public class AvailabilityService {

    private static final LocalTime COLORING_SLOT_TIME =
            LocalTime.of(
                    8,
                    0
            );

    private static final Set<String> COLORING_SERVICE_NAMES =
            Set.of(
                    "vopsit suvite",
                    "vopsit total",
                    "vopsit suvite+tuns",
                    "vopsit total+tuns",
                    "vopsit suvite+tuns+barba",
                    "vopsit total+tuns+barba"
            );

    private final BarberRepository barberRepository;
    private final ServiceRepository serviceRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final TimeOffRepository timeOffRepository;
    private final AppointmentRepository appointmentRepository;
    private final BarberServiceOfferingRepository barberServiceOfferingRepository;

    public AvailabilityService(
            BarberRepository barberRepository,
            ServiceRepository serviceRepository,
            WorkingHoursRepository workingHoursRepository,
            TimeOffRepository timeOffRepository,
            AppointmentRepository appointmentRepository,
            BarberServiceOfferingRepository barberServiceOfferingRepository
    ) {
        this.barberRepository =
                barberRepository;

        this.serviceRepository =
                serviceRepository;

        this.workingHoursRepository =
                workingHoursRepository;

        this.timeOffRepository =
                timeOffRepository;

        this.appointmentRepository =
                appointmentRepository;

        this.barberServiceOfferingRepository =
                barberServiceOfferingRepository;
    }

    public AvailabilityResponse getAvailability(
            Long barberId,
            Long serviceId,
            LocalDate date,
            Long excludeAppointmentId
    ) {
        Barber barber =
                barberRepository
                        .findById(
                                barberId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Barber not found with id: "
                                                + barberId
                                )
                        );

        if (
                !Boolean.TRUE.equals(
                        barber.getActive()
                )
        ) {
            throw new RuntimeException(
                    "Barber is not active"
            );
        }

        ro.mihaifade.backend.entity.Service service =
                serviceRepository
                        .findById(
                                serviceId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Service not found with id: "
                                                + serviceId
                                )
                        );

        if (
                !Boolean.TRUE.equals(
                        service.getActive()
                )
        ) {
            throw new RuntimeException(
                    "Service is not active"
            );
        }

        boolean barberOffersService =
                barber.getServices()
                        .stream()
                        .anyMatch(barberService ->
                                barberService
                                        .getId()
                                        .equals(
                                                serviceId
                                        )
                        );

        if (!barberOffersService) {
            throw new RuntimeException(
                    "Selected barber does not offer this service"
            );
        }

        BarberServiceOffering offering =
                barberServiceOfferingRepository
                        .findByBarberIdAndServiceId(
                                barberId,
                                serviceId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Selected barber does not have pricing configured for this service"
                                )
                        );

        if (
                !Boolean.TRUE.equals(
                        offering.getActive()
                )
        ) {
            throw new RuntimeException(
                    "Selected service is not active for this barber"
            );
        }

        Integer durationMinutes =
                offering.getDurationMinutes();

        Optional<WorkingHours> workingHoursOptional =
                workingHoursRepository
                        .findByBarberIdAndDayOfWeek(
                                barberId,
                                date.getDayOfWeek()
                        );

        if (
                workingHoursOptional.isEmpty()
                        || !Boolean.TRUE.equals(
                        workingHoursOptional
                                .get()
                                .getActive()
                )
        ) {
            return emptyAvailability(
                    date,
                    barberId,
                    serviceId,
                    durationMinutes
            );
        }

        WorkingHours workingHours =
                workingHoursOptional.get();

        Optional<TimeOff> timeOffOptional =
                timeOffRepository
                        .findByBarberIdAndDate(
                                barberId,
                                date
                        );

        if (
                timeOffOptional.isPresent()
                        && Boolean.TRUE.equals(
                        timeOffOptional
                                .get()
                                .getFullDay()
                )
        ) {
            return emptyAvailability(
                    date,
                    barberId,
                    serviceId,
                    durationMinutes
            );
        }

        List<Appointment> appointments =
                appointmentRepository
                        .findByBarberIdAndDateAndStatusNot(
                                barberId,
                                date,
                                AppointmentStatus.CANCELLED
                        );

        if (excludeAppointmentId != null) {
            appointments =
                    appointments
                            .stream()
                            .filter(appointment ->
                                    !appointment
                                            .getId()
                                            .equals(
                                                    excludeAppointmentId
                                            )
                            )
                            .toList();
        }

        if (
                isColoringService(
                        service.getName()
                )
        ) {
            return getColoringAvailability(
                    date,
                    barberId,
                    serviceId,
                    durationMinutes,
                    workingHours,
                    timeOffOptional,
                    appointments
            );
        }

        List<LocalTime> availableSlots =
                generateDynamicSlots(
                        date,
                        durationMinutes,
                        workingHours,
                        timeOffOptional,
                        appointments
                );

        return new AvailabilityResponse(
                date,
                barberId,
                serviceId,
                durationMinutes,
                availableSlots
        );
    }

    private List<LocalTime> generateDynamicSlots(
            LocalDate date,
            Integer durationMinutes,
            WorkingHours workingHours,
            Optional<TimeOff> timeOffOptional,
            List<Appointment> appointments
    ) {
        List<TimeInterval> blockedIntervals =
                new ArrayList<>();

        for (Appointment appointment : appointments) {
            blockedIntervals.add(
                    new TimeInterval(
                            appointment.getStartTime(),
                            appointment.getEndTime()
                    )
            );
        }

        if (timeOffOptional.isPresent()) {
            TimeOff timeOff =
                    timeOffOptional.get();

            if (
                    timeOff.getStartTime() != null
                            && timeOff.getEndTime() != null
            ) {
                blockedIntervals.add(
                        new TimeInterval(
                                timeOff.getStartTime(),
                                timeOff.getEndTime()
                        )
                );
            }
        }

        List<TimeInterval> mergedBlockedIntervals =
                mergeBlockedIntervals(
                        blockedIntervals,
                        workingHours.getStartTime(),
                        workingHours.getEndTime()
                );

        List<LocalTime> availableSlots =
                new ArrayList<>();

        LocalTime freeIntervalStart =
                workingHours.getStartTime();

        for (TimeInterval blockedInterval : mergedBlockedIntervals) {
            if (
                    freeIntervalStart.isBefore(
                            blockedInterval.start()
                    )
            ) {
                addSlotsFromFreeInterval(
                        availableSlots,
                        date,
                        freeIntervalStart,
                        blockedInterval.start(),
                        durationMinutes
                );
            }

            if (
                    blockedInterval.end().isAfter(
                            freeIntervalStart
                    )
            ) {
                freeIntervalStart =
                        blockedInterval.end();
            }
        }

        if (
                freeIntervalStart.isBefore(
                        workingHours.getEndTime()
                )
        ) {
            addSlotsFromFreeInterval(
                    availableSlots,
                    date,
                    freeIntervalStart,
                    workingHours.getEndTime(),
                    durationMinutes
            );
        }

        return availableSlots;
    }

    private List<TimeInterval> mergeBlockedIntervals(
            List<TimeInterval> blockedIntervals,
            LocalTime workingStart,
            LocalTime workingEnd
    ) {
        List<TimeInterval> normalizedIntervals =
                blockedIntervals
                        .stream()
                        .filter(interval ->
                                interval.start() != null
                                        && interval.end() != null
                        )
                        .filter(interval ->
                                interval.start().isBefore(
                                        workingEnd
                                )
                                        && interval.end().isAfter(
                                        workingStart
                                )
                        )
                        .map(interval ->
                                new TimeInterval(
                                        interval.start().isBefore(
                                                workingStart
                                        )
                                                ? workingStart
                                                : interval.start(),
                                        interval.end().isAfter(
                                                workingEnd
                                        )
                                                ? workingEnd
                                                : interval.end()
                                )
                        )
                        .sorted(
                                Comparator.comparing(
                                        TimeInterval::start
                                )
                        )
                        .toList();

        List<TimeInterval> mergedIntervals =
                new ArrayList<>();

        for (TimeInterval interval : normalizedIntervals) {
            if (mergedIntervals.isEmpty()) {
                mergedIntervals.add(
                        interval
                );
                continue;
            }

            TimeInterval lastInterval =
                    mergedIntervals.get(
                            mergedIntervals.size() - 1
                    );

            if (
                    !interval.start().isAfter(
                            lastInterval.end()
                    )
            ) {
                LocalTime mergedEnd =
                        interval.end().isAfter(
                                lastInterval.end()
                        )
                                ? interval.end()
                                : lastInterval.end();

                mergedIntervals.set(
                        mergedIntervals.size() - 1,
                        new TimeInterval(
                                lastInterval.start(),
                                mergedEnd
                        )
                );
            } else {
                mergedIntervals.add(
                        interval
                );
            }
        }

        return mergedIntervals;
    }

    private void addSlotsFromFreeInterval(
            List<LocalTime> availableSlots,
            LocalDate date,
            LocalTime freeStart,
            LocalTime freeEnd,
            Integer durationMinutes
    ) {
        LocalTime current =
                freeStart;

        while (
                !current
                        .plusMinutes(
                                durationMinutes
                        )
                        .isAfter(
                                freeEnd
                        )
        ) {
            if (
                    !isSlotInPast(
                            date,
                            current
                    )
            ) {
                availableSlots.add(
                        current
                );
            }

            current =
                    current.plusMinutes(
                            durationMinutes
                    );
        }
    }

    private AvailabilityResponse getColoringAvailability(
            LocalDate date,
            Long barberId,
            Long serviceId,
            Integer durationMinutes,
            WorkingHours workingHours,
            Optional<TimeOff> timeOffOptional,
            List<Appointment> appointments
    ) {
        LocalTime slotStart =
                COLORING_SLOT_TIME;

        LocalTime slotEnd =
                slotStart.plusMinutes(
                        durationMinutes
                );

        if (
                slotStart.isBefore(
                        workingHours.getStartTime()
                )
        ) {
            return emptyAvailability(
                    date,
                    barberId,
                    serviceId,
                    durationMinutes
            );
        }

        if (
                slotEnd.isAfter(
                        workingHours.getEndTime()
                )
        ) {
            return emptyAvailability(
                    date,
                    barberId,
                    serviceId,
                    durationMinutes
            );
        }

        if (
                isSlotInPast(
                        date,
                        slotStart
                )
        ) {
            return emptyAvailability(
                    date,
                    barberId,
                    serviceId,
                    durationMinutes
            );
        }

        boolean overlapsAppointment =
                overlapsAppointment(
                        slotStart,
                        slotEnd,
                        appointments
                );

        boolean overlapsTimeOff =
                overlapsTimeOff(
                        slotStart,
                        slotEnd,
                        timeOffOptional
                );

        if (
                overlapsAppointment
                        || overlapsTimeOff
        ) {
            return emptyAvailability(
                    date,
                    barberId,
                    serviceId,
                    durationMinutes
            );
        }

        return new AvailabilityResponse(
                date,
                barberId,
                serviceId,
                durationMinutes,
                List.of(
                        COLORING_SLOT_TIME
                )
        );
    }

    private boolean isSlotInPast(
            LocalDate date,
            LocalTime slotStart
    ) {
        LocalDateTime slotDateTime =
                LocalDateTime.of(
                        date,
                        slotStart
                );

        return !slotDateTime.isAfter(
                LocalDateTime.now()
        );
    }

    private boolean overlapsAppointment(
            LocalTime slotStart,
            LocalTime slotEnd,
            List<Appointment> appointments
    ) {
        return appointments
                .stream()
                .anyMatch(appointment ->
                        slotStart.isBefore(
                                appointment.getEndTime()
                        )
                                &&
                                slotEnd.isAfter(
                                        appointment.getStartTime()
                                )
                );
    }

    private boolean overlapsTimeOff(
            LocalTime slotStart,
            LocalTime slotEnd,
            Optional<TimeOff> timeOffOptional
    ) {
        if (timeOffOptional.isEmpty()) {
            return false;
        }

        TimeOff timeOff =
                timeOffOptional.get();

        if (
                Boolean.TRUE.equals(
                        timeOff.getFullDay()
                )
        ) {
            return true;
        }

        if (
                timeOff.getStartTime() == null
                        || timeOff.getEndTime() == null
        ) {
            return false;
        }

        return slotStart.isBefore(
                timeOff.getEndTime()
        )
                &&
                slotEnd.isAfter(
                        timeOff.getStartTime()
                );
    }

    private boolean isColoringService(
            String serviceName
    ) {
        if (
                serviceName == null
                        || serviceName.isBlank()
        ) {
            return false;
        }

        String normalizedName =
                Normalizer
                        .normalize(
                                serviceName,
                                Normalizer.Form.NFD
                        )
                        .replaceAll(
                                "\\p{M}",
                                ""
                        )
                        .toLowerCase()
                        .trim()
                        .replaceAll(
                                "\\s*\\+\\s*",
                                "+"
                        )
                        .replaceAll(
                                "\\s+",
                                " "
                        );

        return COLORING_SERVICE_NAMES
                .contains(
                        normalizedName
                );
    }

    private AvailabilityResponse emptyAvailability(
            LocalDate date,
            Long barberId,
            Long serviceId,
            Integer durationMinutes
    ) {
        return new AvailabilityResponse(
                date,
                barberId,
                serviceId,
                durationMinutes,
                List.of()
        );
    }

    private record TimeInterval(
            LocalTime start,
            LocalTime end
    ) {
    }
}
