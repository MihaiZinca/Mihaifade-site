package ro.mihaifade.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "barbers")
@Getter
@Setter
@NoArgsConstructor
public class Barber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String displayName;

    @Column(length = 1000)
    private String bio;

    private String imageUrl;

    @Column(nullable = false)
    private Boolean active = true;

    @ManyToMany
    @JoinTable(
            name = "barber_services",
            joinColumns = @JoinColumn(name = "barber_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    private Set<Service> services = new HashSet<>();
}