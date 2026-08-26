package ro.mihaifade.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import ro.mihaifade.backend.security.CustomUserDetailsService;
import ro.mihaifade.backend.security.JwtAuthenticationFilter;

import java.util.List;

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
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .cors(Customizer.withDefaults())

                .csrf(csrf ->
                        csrf.disable()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        )
                        .permitAll()

                        .requestMatchers(
                                "/error"
                        )
                        .permitAll()

                        .requestMatchers(
                                "/api/auth/**"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/shop-settings"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/shop-settings"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reviews"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reviews/me"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reviews/me"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reviews/me"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/reviews/me"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reviews/admin"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reviews/*/active"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/reviews/*/permanent"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/barbers/me"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/barbers/me"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/barbers/me/services"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/barbers/me/working-hours/**"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/barbers/me/working-hours/**"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/barbers/me/time-off/**"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/barbers/me/time-off/**"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/barbers/me/time-off/**"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/barbers/me/stats"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/barbers/*/stats"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/appointments/barber/me"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/appointments/barber/me/*/status"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/barber-service-offerings/me"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/barber-service-offerings/me"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/barber-service-offerings/me/services/*/deactivate"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/barber-service-offerings/barber/*/active"
                        )
                        .permitAll()

                        .requestMatchers(
                                "/api/barber-service-offerings/barber/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/services/**"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/barbers/**"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/availability/**"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/services/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/services/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/services/*/permanent"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/services/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/barbers/account"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/barbers/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/barbers/*/working-hours/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/barbers/*/time-off/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/barbers/*/time-off/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/barbers/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/barbers/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/me/profile"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/users/me"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                "/api/users/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/appointments"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/appointments/*/status"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/appointments/me"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/appointments/*/cancel"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/appointments"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/rewards/me"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/rewards/spin"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/rewards/barber/appointments/*"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/rewards/barber/appointments/*/use"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/rewards/users/*/use"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/admin/stats"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/push-subscriptions/me"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/push-subscriptions/me",
                                "/api/push-subscriptions/me/all"
                        )
                        .hasRole("CLIENT")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/client-offers/barber/appointments/*"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/client-offers/barber/appointments/*/offers/*/use"
                        )
                        .hasAnyRole(
                                "BARBER",
                                "OWNER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/owner/assistant/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/owner/assistant/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/owner/assistant/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/owner/assistant/**"
                        )
                        .hasRole("OWNER")

                        .anyRequest()
                        .authenticated()
                )

                .authenticationProvider(
                        authenticationProvider()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173",
                        "http://192.168.1.158:5173"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type"
                )
        );

        configuration.setExposedHeaders(
                List.of(
                        "Authorization"
                )
        );

        configuration.setAllowCredentials(
                true
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/api/**",
                configuration
        );

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(
                        userDetailsService
                );

        provider.setPasswordEncoder(
                passwordEncoder()
        );

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration
                .getAuthenticationManager();
    }
}