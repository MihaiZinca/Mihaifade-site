package ro.mihaifade.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import ro.mihaifade.backend.security.CustomUserDetailsService;
import ro.mihaifade.backend.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService userDetailsService
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/services/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/barbers/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/availability/**").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/services/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/services/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.DELETE, "/api/services/**").hasRole("OWNER")

                        .requestMatchers(HttpMethod.POST, "/api/barbers/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/barbers/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.DELETE, "/api/barbers/**").hasRole("OWNER")

                        .requestMatchers(HttpMethod.PUT, "/api/barbers/*/working-hours/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/barbers/*/time-off/**").hasRole("OWNER")
                        .requestMatchers(HttpMethod.DELETE, "/api/barbers/*/time-off/**").hasRole("OWNER")

                        .requestMatchers("/api/users/**").hasRole("OWNER")

                        .requestMatchers(HttpMethod.GET, "/api/appointments").hasRole("OWNER")
                        .requestMatchers("/api/appointments/*/status").hasRole("OWNER")

                        .requestMatchers("/api/appointments/me").hasRole("CLIENT")
                        .requestMatchers("/api/appointments/*/cancel").hasRole("CLIENT")
                        .requestMatchers(HttpMethod.POST, "/api/appointments").hasRole("CLIENT")

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }
}