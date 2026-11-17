package br.com.fiap.urbanguard.dto;

import br.com.fiap.urbanguard.domain.EventType;
import br.com.fiap.urbanguard.domain.SourceType;
import jakarta.validation.constraints.*;

public record CreateEventRequest(
    @NotNull EventType eventType,
    @NotBlank @Size(max = 100) String title,
    @NotBlank @Size(max = 500) String description,
    @NotBlank @Size(max = 80) String neighborhood,
    @NotBlank @Size(max = 80) String city,
    @NotNull SourceType sourceType,
    @NotBlank @Size(max = 120) String origin,
    @DecimalMin("0.0") @DecimalMax("1.0") double confidence,
    @Min(1) @Max(5) int severity,
    @Min(1) @Max(5) int impactLevel,
    @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
    @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude
) {}
