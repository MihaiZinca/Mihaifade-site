package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CompleteProfileRequest(

        @NotBlank
        @Pattern(
                regexp = "^07\\d{8}$",
                message = "Phone must be a valid Romanian mobile number"
        )
        String phone

) {
}