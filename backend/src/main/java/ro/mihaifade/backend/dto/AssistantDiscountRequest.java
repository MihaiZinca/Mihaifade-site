package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.*;

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