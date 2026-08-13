package ro.mihaifade.backend.controller;

import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.entity.ShopSettings;
import ro.mihaifade.backend.service.ShopSettingsService;

@RestController
@RequestMapping("/api/shop-settings")
public class ShopSettingsController {

    private final ShopSettingsService shopSettingsService;

    public ShopSettingsController(
            ShopSettingsService shopSettingsService
    ) {
        this.shopSettingsService =
                shopSettingsService;
    }

    @GetMapping
    public ShopSettings getSettings() {
        return shopSettingsService
                .getSettings();
    }

    @PutMapping
    public ShopSettings updateSettings(
            @RequestBody ShopSettings shopSettings
    ) {
        return shopSettingsService
                .updateSettings(
                        shopSettings
                );
    }
}