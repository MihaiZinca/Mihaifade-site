package ro.mihaifade.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(
        name = "working_hours",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_barber_day",
                        columnNames = {
                                "barber_id",
                                "day_of_week"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class WorkingHours {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "barber_id",
            nullable = false
    )
    private Barber barber;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "day_of_week",
            nullable = false
    )
    private DayOfWeek dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Boolean active = true;
}