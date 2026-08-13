package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BarberServiceOfferingRequest(

        @NotNull
        Long serviceId,

        @NotNull
        @DecimalMin(value = "0.0")
        BigDecimal price,

        @NotNull
        @Min(1)
        Integer durationMinutes,

        @NotNull
        Boolean active

) {
}