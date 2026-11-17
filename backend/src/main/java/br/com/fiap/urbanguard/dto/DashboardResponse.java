package br.com.fiap.urbanguard.dto;
import java.time.Instant;
public record DashboardResponse(long totalEvents, long activeEvents, long criticalAlerts,
                                long highAlerts, double averageConfidence,
                                int maximumRiskScore, Instant lastUpdate) {}
