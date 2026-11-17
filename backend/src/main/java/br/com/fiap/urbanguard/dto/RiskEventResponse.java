package br.com.fiap.urbanguard.dto;

import br.com.fiap.urbanguard.domain.*;
import java.time.Instant;

public record RiskEventResponse(
    Long id, EventType eventType, String title, String description,
    String neighborhood, String city, SourceType sourceType, String origin,
    double confidence, int severity, int impactLevel,
    int priorityScore, String priorityLevel, String priorityExplanation,
    Instant createdAt, boolean active, Double latitude, Double longitude
) {
    public static RiskEventResponse from(RiskEvent e) {
        return new RiskEventResponse(e.getId(), e.getEventType(), e.getTitle(),
            e.getDescription(), e.getNeighborhood(), e.getCity(), e.getSourceType(),
            e.getOrigin(), e.getConfidence(), e.getSeverity(), e.getImpactLevel(),
            e.getPriorityScore(), e.getPriorityLevel(),
            "Análise de risco: gravidade (até 50), impacto (até 20), confiabilidade (até 20) e atualidade (até 10).",
            e.getCreatedAt(), e.isActive(), e.getLatitude(), e.getLongitude());
    }
}
