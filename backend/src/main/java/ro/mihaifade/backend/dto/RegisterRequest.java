package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,

        @NotBlank
        @Pattern(
                regexp = "^07\\d{8}$",
                message = "Phone must be a valid Romanian mobile number"
        )
        String phone,

        @NotBlank
        @Size(min = 8)
        String password
) {
}