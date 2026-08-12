package ro.mihaifade.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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

    @NotBlank
    @Column(nullable = false)
    private String displayName;

    @Column(length = 1500)
    private String bio;

    private String imageUrl;

    @Column(nullable = false)
    private Boolean active = true;

    @OneToOne
    @JoinColumn(
            name = "user_id",
            unique = true
    )
    private User user;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "barber_services",
            joinColumns = @JoinColumn(name = "barber_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    private Set<Service> services = new HashSet<>();

    public Barber(
            String displayName,
            String bio,
            String imageUrl,
            Boolean active
    ) {
        this.displayName = displayName;
        this.bio = bio;
        this.imageUrl = imageUrl;
        this.active = active;
    }
}