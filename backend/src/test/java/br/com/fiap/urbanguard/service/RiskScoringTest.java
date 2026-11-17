package br.com.fiap.urbanguard.service;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import static org.junit.jupiter.api.Assertions.*;

class RiskScoringTest {
    private final Instant now = Instant.parse("2026-11-16T19:00:00Z");
    @Test void maximalRiskIsCritical() {
        assertEquals(100, RiskScoring.score(5, 5, 1.0, now, now));
        assertEquals("CRITICO", RiskScoring.level(100));
    }
    @Test void lowSeverityCommunityInputIsLowerPriority() {
        assertEquals(37, RiskScoring.score(1, 1, 0.65, now, now));
        assertEquals("BAIXO", RiskScoring.level(37));
    }
    @Test void oldReportLosesFreshnessWeight() {
        int recent = RiskScoring.score(4, 4, 0.8, now, now);
        int old = RiskScoring.score(4, 4, 0.8, now.minus(48, ChronoUnit.HOURS), now);
        assertEquals(8, recent - old);
    }
    @Test void invalidInputIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> RiskScoring.score(6, 3, 0.9, now, now));
    }
}
