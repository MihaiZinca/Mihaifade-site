package ro.mihaifade.backend.service;

import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.UserRequest;
import ro.mihaifade.backend.dto.UserResponse;
import ro.mihaifade.backend.entity.Role;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.UserRepository;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "User not found with id: " + id
                ));

        return toResponse(user);
    }

    public UserResponse createUser(UserRequest request) {
        if (request.email() != null
                && userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new RuntimeException("Email already exists");
        }

        if (request.phone() != null
                && userRepository.existsByPhone(request.phone())) {
            throw new RuntimeException("Phone already exists");
        }

        User user = new User();

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setRole(Role.CLIENT);
        user.setActive(true);

        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getActive(),
                user.getCreatedAt()
        );
    }
}