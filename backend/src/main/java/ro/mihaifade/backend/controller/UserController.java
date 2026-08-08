package ro.mihaifade.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ro.mihaifade.backend.dto.CompleteProfileRequest;
import ro.mihaifade.backend.dto.UserRequest;
import ro.mihaifade.backend.dto.UserResponse;
import ro.mihaifade.backend.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(
            @Valid @RequestBody UserRequest request
    ) {
        return userService.createUser(request);
    }

    @PutMapping("/me/profile")
    public UserResponse completeMyProfile(
            @Valid @RequestBody CompleteProfileRequest request,
            Authentication authentication
    ) {
        return userService.completeMyProfile(
                authentication.getName(),
                request
        );
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateMyAccount(Authentication authentication) {
        userService.deactivateMyAccount(
                authentication.getName()
        );
    }
}