package br.com.fiap.urbanguard.service;

import java.time.Duration;
import java.time.Instant;

/** Análise heurística transparente, não é uma predição de inteligência artificial. */
public final class RiskScoring {
    private RiskScoring() {}

    public static int score(int severity, int impactLevel, double confidence, Instant createdAt, Instant now) {
        if (severity < 1 || severity > 5 || impactLevel < 1 || impactLevel > 5 ||
            !Double.isFinite(confidence) || confidence < 0 || confidence > 1) {
            throw new IllegalArgumentException("Parâmetros de risco fora dos limites");
        }
        long ageMinutes = Math.max(0, Duration.between(createdAt, now).toMinutes());
        int freshness = ageMinutes <= 120 ? 10 : ageMinutes <= 1440 ? 6 : 2;
        return severity * 10 + impactLevel * 4 + (int) Math.round(confidence * 20) + freshness;
    }

    public static String level(int score) {
        if (score >= 80) return "CRITICO";
        if (score >= 60) return "ALTO";
        if (score >= 40) return "MODERADO";
        return "BAIXO";
    }
}
