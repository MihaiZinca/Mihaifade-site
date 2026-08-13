package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.entity.ShopSettings;
import ro.mihaifade.backend.repository.ShopSettingsRepository;

@Service
public class ShopSettingsService {

    private final ShopSettingsRepository shopSettingsRepository;

    public ShopSettingsService(
            ShopSettingsRepository shopSettingsRepository
    ) {
        this.shopSettingsRepository =
                shopSettingsRepository;
    }

    public ShopSettings getSettings() {
        return shopSettingsRepository
                .findFirstByOrderByIdAsc()
                .orElseGet(() -> {
                    ShopSettings settings =
                            new ShopSettings();

                    settings.setAddress(
                            "Adresa frizeriei nu este configurată."
                    );

                    settings.setMapEmbedUrl(
                            null
                    );

                    settings.setMapsUrl(
                            null
                    );

                    return shopSettingsRepository.save(
                            settings
                    );
                });
    }

    @Transactional
    public ShopSettings updateSettings(
            ShopSettings updatedSettings
    ) {
        ShopSettings settings =
                shopSettingsRepository
                        .findFirstByOrderByIdAsc()
                        .orElseGet(
                                ShopSettings::new
                        );

        settings.setAddress(
                normalizeRequiredText(
                        updatedSettings.getAddress()
                )
        );

        settings.setMapEmbedUrl(
                normalizeOptionalText(
                        updatedSettings.getMapEmbedUrl()
                )
        );

        settings.setMapsUrl(
                normalizeOptionalText(
                        updatedSettings.getMapsUrl()
                )
        );

        return shopSettingsRepository.save(
                settings
        );
    }

    private String normalizeRequiredText(
            String value
    ) {
        if (
                value == null
                        || value.isBlank()
        ) {
            throw new RuntimeException(
                    "Address is required"
            );
        }

        return value.trim();
    }

    private String normalizeOptionalText(
            String value
    ) {
        if (
                value == null
                        || value.isBlank()
        ) {
            return null;
        }

        return value.trim();
    }
}