package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);
}