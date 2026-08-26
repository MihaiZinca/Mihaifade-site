package ro.mihaifade.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "assistant_campaigns")
@Getter
@Setter
@NoArgsConstructor
public class AssistantCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssistantCampaignType type;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private Integer selectedClients;

    private Integer notifiedClients;

    private Integer sentNotifications;

    private Integer createdOffers;

    private Integer discountPercent;

    private Integer validDays;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}