package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PushSubscriptionRequest(

        @NotBlank
        @Size(max = 2048)
        String token,

        @Size(max = 500)
        String userAgent

) {
}