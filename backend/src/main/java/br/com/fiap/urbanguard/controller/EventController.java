package br.com.fiap.urbanguard.controller;

import br.com.fiap.urbanguard.dto.*;
import br.com.fiap.urbanguard.service.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api")
public class EventController {
    private final EventService service;
    private final DemoData demo;
    @Value("${urban.demo.enabled:true}") private boolean demoEnabled;

    public EventController(EventService service, DemoData demo) {
        this.service = service;
        this.demo = demo;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "service", "UrbanGuard API", "timestamp", Instant.now());
    }

    @GetMapping("/events")
    public List<RiskEventResponse> events() { return service.list(); }

    @GetMapping("/events/{id}")
    public RiskEventResponse event(@PathVariable long id) { return service.get(id); }

    @GetMapping("/alerts")
    public List<RiskEventResponse> alerts() { return service.alerts(); }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() { return service.dashboard(); }

    @PostMapping("/events")
    public ResponseEntity<RiskEventResponse> create(@Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PostMapping("/demo/simulate")
    public ResponseEntity<RiskEventResponse> simulate() {
        if (!demoEnabled) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(demo.nextSimulation()));
    }
}
