package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record AssistantDiscountRequest(

        @NotEmpty
        List<Long> userIds,

        @NotNull
        @Min(1)
        @Max(50)
        Integer discountPercent,

        @NotNull
        @Positive
        Integer validDays
) {
}