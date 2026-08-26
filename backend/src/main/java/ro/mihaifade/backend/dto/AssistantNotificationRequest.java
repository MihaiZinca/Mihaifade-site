package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AssistantNotificationRequest(

        @NotEmpty
        List<Long> userIds,

        @NotBlank
        @Size(max = 80)
        String title,

        @NotBlank
        @Size(max = 300)
        String message
) {
}