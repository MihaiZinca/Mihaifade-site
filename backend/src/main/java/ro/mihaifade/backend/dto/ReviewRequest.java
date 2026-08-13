package ro.mihaifade.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReviewRequest {

    @Min(
            value = 1,
            message = "Rating must be at least 1"
    )
    @Max(
            value = 5,
            message = "Rating must be at most 5"
    )
    private Integer rating;

    @NotBlank(
            message = "Comment is required"
    )
    @Size(
            max = 1500,
            message = "Comment must not exceed 1500 characters"
    )
    private String comment;
}