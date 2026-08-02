package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email String email,
        String phone
) {
}