package ro.mihaifade.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "time_off",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_barber_time_off_date",
                        columnNames = {
                                "barber_id",
                                "date"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class TimeOff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(
            name = "barber_id",
            nullable = false
    )
    private Barber barber;

    @Column(nullable = false)
    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    @Column(nullable = false)
    private Boolean fullDay = true;

    private String reason;
}