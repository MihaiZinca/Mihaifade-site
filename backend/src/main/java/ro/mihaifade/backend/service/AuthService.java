package ro.mihaifade.backend.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ro.mihaifade.backend.dto.AuthResponse;
import ro.mihaifade.backend.dto.LoginRequest;
import ro.mihaifade.backend.dto.RegisterRequest;
import ro.mihaifade.backend.entity.AuthProvider;
import ro.mihaifade.backend.entity.Role;
import ro.mihaifade.backend.entity.User;
import ro.mihaifade.backend.repository.UserRepository;
import ro.mihaifade.backend.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new RuntimeException("Email already exists");
        }

        if (request.phone() != null
                && !request.phone().isBlank()
                && userRepository.existsByPhone(request.phone())) {
            throw new RuntimeException("Phone already exists");
        }

        User user = new User();

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setRole(Role.CLIENT);
        user.setActive(true);

        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getEmail());

        return toResponse(saved, token);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(user.getEmail());

        return toResponse(user, token);
    }

    private AuthResponse toResponse(User user, String token) {
        return new AuthResponse(
                token,
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole()
        );
    }
}