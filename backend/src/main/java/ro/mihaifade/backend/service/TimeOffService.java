package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.TimeOffRequest;
import ro.mihaifade.backend.dto.TimeOffResponse;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.entity.TimeOff;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.TimeOffRepository;

import java.util.List;

@Service
public class TimeOffService {

    private final TimeOffRepository timeOffRepository;
    private final BarberRepository barberRepository;

    public TimeOffService(
            TimeOffRepository timeOffRepository,
            BarberRepository barberRepository
    ) {
        this.timeOffRepository = timeOffRepository;
        this.barberRepository = barberRepository;
    }

    public List<TimeOffResponse> getTimeOffForBarber(
            Long barberId
    ) {

        if (!barberRepository.existsById(barberId)) {
            throw new RuntimeException(
                    "Barber not found with id: " + barberId
            );
        }

        return timeOffRepository
                .findByBarberIdOrderByDateAsc(barberId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TimeOffResponse setTimeOff(
            Long barberId,
            TimeOffRequest request
    ) {

        Barber barber = barberRepository
                .findById(barberId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Barber not found with id: "
                                        + barberId
                        )
                );

        if (!request.fullDay()) {

            if (request.startTime() == null
                    || request.endTime() == null) {

                throw new RuntimeException(
                        "Start time and end time are required"
                );
            }

            if (!request.startTime()
                    .isBefore(request.endTime())) {

                throw new RuntimeException(
                        "Start time must be before end time"
                );
            }
        }

        TimeOff timeOff = timeOffRepository
                .findByBarberIdAndDate(
                        barberId,
                        request.date()
                )
                .orElseGet(TimeOff::new);

        timeOff.setBarber(barber);
        timeOff.setDate(request.date());
        timeOff.setFullDay(request.fullDay());
        timeOff.setReason(request.reason());

        if (request.fullDay()) {
            timeOff.setStartTime(null);
            timeOff.setEndTime(null);
        } else {
            timeOff.setStartTime(request.startTime());
            timeOff.setEndTime(request.endTime());
        }

        TimeOff saved =
                timeOffRepository.save(timeOff);

        return toResponse(saved);
    }

    public void deleteTimeOff(
            Long barberId,
            Long id
    ) {

        if (!barberRepository.existsById(barberId)) {
            throw new RuntimeException(
                    "Barber not found with id: " + barberId
            );
        }

        TimeOff timeOff = timeOffRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Time off not found"
                        )
                );

        if (!timeOff.getBarber()
                .getId()
                .equals(barberId)) {

            throw new RuntimeException(
                    "Time off does not belong to this barber"
            );
        }

        timeOffRepository.delete(timeOff);
    }

    private TimeOffResponse toResponse(
            TimeOff timeOff
    ) {

        return new TimeOffResponse(
                timeOff.getId(),
                timeOff.getDate(),
                timeOff.getStartTime(),
                timeOff.getEndTime(),
                timeOff.getFullDay(),
                timeOff.getReason()
        );
    }
}