package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.NotNull;

public record MarketingConsentRequest(
        @NotNull Boolean marketingConsent
) {
}