package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateBarberAccountRequest(

        @NotBlank
        String firstName,

        @NotBlank
        String lastName,

        @NotBlank
        @Email
        String email,

        String phone,

        @NotBlank
        String password,

        @NotBlank
        String displayName,

        String bio
) {
}