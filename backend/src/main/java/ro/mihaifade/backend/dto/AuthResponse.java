package ro.mihaifade.backend.dto;

import ro.mihaifade.backend.entity.Role;

public record AuthResponse(
        String token,
        Long userId,
        String firstName,
        String lastName,
        String email,
        Role role,
        boolean requiresProfileCompletion
) {
}