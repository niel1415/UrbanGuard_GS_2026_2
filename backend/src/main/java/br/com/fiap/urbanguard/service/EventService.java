package br.com.fiap.urbanguard.service;

import br.com.fiap.urbanguard.domain.RiskEvent;
import br.com.fiap.urbanguard.dto.*;
import br.com.fiap.urbanguard.repository.RiskEventRepository;
import br.com.fiap.urbanguard.realtime.EventSocketHandler;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;

@Service
public class EventService {
    private final RiskEventRepository repository;
    private final EventSocketHandler sockets;

    public EventService(RiskEventRepository repository, EventSocketHandler sockets) {
        this.repository = repository;
        this.sockets = sockets;
    }

    @Transactional(readOnly = true)
    public List<RiskEventResponse> list() {
        return repository.findAllByOrderByPriorityScoreDescCreatedAtDesc()
            .stream().map(RiskEventResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RiskEventResponse> alerts() {
        return list().stream().filter(item -> item.active() && item.priorityScore() >= 60).toList();
    }

    @Transactional(readOnly = true)
    public RiskEventResponse get(long id) {
        return repository.findById(id).map(RiskEventResponse::from)
            .orElseThrow(() -> new NoSuchElementException("Evento não encontrado"));
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        List<RiskEvent> all = repository.findAll();
        long active = all.stream().filter(RiskEvent::isActive).count();
        long critical = all.stream().filter(e -> e.isActive() && e.getPriorityScore() >= 80).count();
        long high = all.stream().filter(e -> e.isActive() && e.getPriorityScore() >= 60 && e.getPriorityScore() < 80).count();
        double average = all.stream().mapToDouble(RiskEvent::getConfidence).average().orElse(0);
        int maximum = all.stream().filter(RiskEvent::isActive).mapToInt(RiskEvent::getPriorityScore).max().orElse(0);
        Instant last = all.stream().map(RiskEvent::getCreatedAt).max(Comparator.naturalOrder()).orElse(null);
        return new DashboardResponse(all.size(), active, critical, high,
            Math.round(average * 1000) / 1000.0, maximum, last);
    }

    @Transactional
    public RiskEventResponse create(CreateEventRequest input) {
        RiskEvent e = new RiskEvent();
        e.setEventType(input.eventType());
        e.setTitle(input.title().trim());
        e.setDescription(input.description().trim());
        e.setNeighborhood(input.neighborhood().trim());
        e.setCity(input.city().trim());
        e.setSourceType(input.sourceType());
        e.setOrigin(input.origin().trim());
        e.setConfidence(input.confidence());
        e.setSeverity(input.severity());
        e.setImpactLevel(input.impactLevel());
        e.setLatitude(input.latitude());
        e.setLongitude(input.longitude());
        Instant now = Instant.now();
        e.setCreatedAt(now);
        e.setPriorityScore(RiskScoring.score(e.getSeverity(), e.getImpactLevel(), e.getConfidence(), now, now));
        e.setPriorityLevel(RiskScoring.level(e.getPriorityScore()));
        RiskEventResponse result = RiskEventResponse.from(repository.saveAndFlush(e));
        sockets.broadcast(Map.of("type", "EVENT_CREATED", "event", result));
        return result;
    }
    /** Reavalia o fator atualidade dos dados a cada minuto. */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void refreshAgingScores() {
        Instant now = Instant.now();
        for (RiskEvent e : repository.findAll()) {
            int updated = RiskScoring.score(e.getSeverity(), e.getImpactLevel(),
                e.getConfidence(), e.getCreatedAt(), now);
            if (updated != e.getPriorityScore()) {
                e.setPriorityScore(updated);
                e.setPriorityLevel(RiskScoring.level(updated));
            }
        }
    }

}
