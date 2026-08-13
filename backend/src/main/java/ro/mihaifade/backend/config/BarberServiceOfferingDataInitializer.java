package ro.mihaifade.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ro.mihaifade.backend.entity.Barber;
import ro.mihaifade.backend.entity.BarberServiceOffering;
import ro.mihaifade.backend.repository.BarberRepository;
import ro.mihaifade.backend.repository.BarberServiceOfferingRepository;

import java.util.List;

@Component
public class BarberServiceOfferingDataInitializer
        implements CommandLineRunner {

    private final BarberRepository barberRepository;
    private final BarberServiceOfferingRepository barberServiceOfferingRepository;

    public BarberServiceOfferingDataInitializer(
            BarberRepository barberRepository,
            BarberServiceOfferingRepository barberServiceOfferingRepository
    ) {
        this.barberRepository =
                barberRepository;

        this.barberServiceOfferingRepository =
                barberServiceOfferingRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<Barber> barbers =
                barberRepository.findAll();

        int createdOfferings = 0;

        for (Barber barber : barbers) {

            if (barber.getServices() == null) {
                continue;
            }

            for (
                    ro.mihaifade.backend.entity.Service service
                    : barber.getServices()
            ) {
                boolean alreadyExists =
                        barberServiceOfferingRepository
                                .existsByBarberIdAndServiceId(
                                        barber.getId(),
                                        service.getId()
                                );

                if (alreadyExists) {
                    continue;
                }

                BarberServiceOffering offering =
                        new BarberServiceOffering(
                                barber,
                                service,
                                service.getPrice(),
                                service.getDurationMinutes(),
                                Boolean.TRUE.equals(
                                        service.getActive()
                                )
                        );

                barberServiceOfferingRepository.save(
                        offering
                );

                createdOfferings++;
            }
        }

        if (createdOfferings > 0) {
            System.out.println(
                    "Created "
                            + createdOfferings
                            + " barber service offerings from existing barber_services."
            );
        }
    }
}