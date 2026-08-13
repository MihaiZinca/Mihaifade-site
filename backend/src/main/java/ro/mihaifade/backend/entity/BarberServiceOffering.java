package ro.mihaifade.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(
        name = "barber_service_offerings",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_barber_service_offering",
                        columnNames = {
                                "barber_id",
                                "service_id"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class BarberServiceOffering {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @NotNull
    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "barber_id",
            nullable = false
    )
    private Barber barber;

    @NotNull
    @ManyToOne(
            fetch = FetchType.EAGER,
            optional = false
    )
    @JoinColumn(
            name = "service_id",
            nullable = false
    )
    private Service service;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal price;

    @NotNull
    @Min(1)
    @Column(
            name = "duration_minutes",
            nullable = false
    )
    private Integer durationMinutes;

    @NotNull
    @Column(nullable = false)
    private Boolean active = true;

    public BarberServiceOffering(
            Barber barber,
            Service service,
            BigDecimal price,
            Integer durationMinutes,
            Boolean active
    ) {
        this.barber = barber;
        this.service = service;
        this.price = price;
        this.durationMinutes = durationMinutes;
        this.active = active;
    }
}