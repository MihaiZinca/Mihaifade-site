package ro.mihaifade.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() throws IOException {

        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        try (
                FileInputStream serviceAccount =
                        new FileInputStream(
                                "firebase-service-account.json"
                        )
        ) {
            FirebaseOptions options =
                    FirebaseOptions.builder()
                            .setCredentials(
                                    GoogleCredentials.fromStream(
                                            serviceAccount
                                    )
                            )
                            .build();

            return FirebaseApp.initializeApp(options);
        }
    }
}