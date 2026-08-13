package ro.mihaifade.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "shop_settings")
@Getter
@Setter
@NoArgsConstructor
public class ShopSettings {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            nullable = false,
            length = 500
    )
    private String address;

    @Column(
            name = "map_embed_url",
            length = 2000
    )
    private String mapEmbedUrl;

    @Column(
            name = "maps_url",
            length = 2000
    )
    private String mapsUrl;

    public ShopSettings(
            String address,
            String mapEmbedUrl,
            String mapsUrl
    ) {
        this.address =
                address;

        this.mapEmbedUrl =
                mapEmbedUrl;

        this.mapsUrl =
                mapsUrl;
    }
}