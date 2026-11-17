package br.com.fiap.urbanguard.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "risk_events", indexes = {
    @Index(name = "idx_events_score", columnList = "priority_score"),
    @Index(name = "idx_events_created", columnList = "created_at")
})
public class RiskEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING) @Column(name = "event_type", nullable = false, length = 20)
    private EventType eventType;
    @Column(nullable = false, length = 100)
    private String title;
    @Column(nullable = false, length = 500)
    private String description;
    @Column(nullable = false, length = 80)
    private String neighborhood;
    @Column(nullable = false, length = 80)
    private String city;
    @Enumerated(EnumType.STRING) @Column(name = "source_type", nullable = false, length = 20)
    private SourceType sourceType;
    @Column(nullable = false, length = 120)
    private String origin;
    @Column(nullable = false)
    private double confidence;
    @Column(nullable = false)
    private int severity;
    @Column(name = "impact_level", nullable = false)
    private int impactLevel;
    @Column(name = "priority_score", nullable = false)
    private int priorityScore;
    @Column(name = "priority_level", nullable = false, length = 20)
    private String priorityLevel;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private boolean active = true;
    private Double latitude;
    private Double longitude;

    public Long getId() { return id; }
    public void setId(Long value) { id = value; }
    public EventType getEventType() { return eventType; }
    public void setEventType(EventType value) { eventType = value; }
    public String getTitle() { return title; }
    public void setTitle(String value) { title = value; }
    public String getDescription() { return description; }
    public void setDescription(String value) { description = value; }
    public String getNeighborhood() { return neighborhood; }
    public void setNeighborhood(String value) { neighborhood = value; }
    public String getCity() { return city; }
    public void setCity(String value) { city = value; }
    public SourceType getSourceType() { return sourceType; }
    public void setSourceType(SourceType value) { sourceType = value; }
    public String getOrigin() { return origin; }
    public void setOrigin(String value) { origin = value; }
    public double getConfidence() { return confidence; }
    public void setConfidence(double value) { confidence = value; }
    public int getSeverity() { return severity; }
    public void setSeverity(int value) { severity = value; }
    public int getImpactLevel() { return impactLevel; }
    public void setImpactLevel(int value) { impactLevel = value; }
    public int getPriorityScore() { return priorityScore; }
    public void setPriorityScore(int value) { priorityScore = value; }
    public String getPriorityLevel() { return priorityLevel; }
    public void setPriorityLevel(String value) { priorityLevel = value; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant value) { createdAt = value; }
    public boolean isActive() { return active; }
    public void setActive(boolean value) { active = value; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double value) { latitude = value; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double value) { longitude = value; }
}
