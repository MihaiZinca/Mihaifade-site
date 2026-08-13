package ro.mihaifade.backend.dto;

import java.math.BigDecimal;

public record BarberServiceOfferingResponse(

        Long id,

        Long barberId,
        String barberName,

        Long serviceId,
        String serviceName,
        String serviceDescription,

        BigDecimal price,
        Integer durationMinutes,
        Boolean active

) {
}