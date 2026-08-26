package ro.mihaifade.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.mihaifade.backend.entity.AssistantCampaign;

import java.util.List;

public interface AssistantCampaignRepository
        extends JpaRepository<AssistantCampaign, Long> {

    List<AssistantCampaign> findAllByOrderByCreatedAtDesc();
}