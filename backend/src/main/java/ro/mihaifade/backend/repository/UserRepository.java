package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.AuthProvider;
import ro.mihaifade.backend.entity.Role;
import ro.mihaifade.backend.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    List<User> findByRoleAndAuthProviderAndActiveTrueAndEmailVerifiedFalseAndCreatedAtBefore(
            Role role,
            AuthProvider authProvider,
            LocalDateTime createdAt
    );
}