package br.com.fiap.urbanguard.service;

import br.com.fiap.urbanguard.domain.*;
import br.com.fiap.urbanguard.dto.CreateEventRequest;
import br.com.fiap.urbanguard.repository.RiskEventRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class DemoData implements ApplicationRunner {
    private final EventService events;
    private final RiskEventRepository repository;
    private final AtomicInteger sequence = new AtomicInteger();
    @Value("${urban.demo.enabled:true}") private boolean demoEnabled;

    public DemoData(EventService events, RiskEventRepository repository) {
        this.events = events;
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!demoEnabled || repository.count() != 0) return;
        events.create(new CreateEventRequest(EventType.FLOOD,
            "Alagamento na Avenida dos Estados", "Nível de água elevado após chuva intensa; evite vias baixas.",
            "Utinga", "Santo André", SourceType.SENSOR,
            "Sensor pluviométrico UG-041 (simulado)", 0.94, 5, 5, -23.6448, -46.5254));
        events.create(new CreateEventRequest(EventType.HEAT,
            "Temperatura elevada no centro", "Sensação térmica alta durante a tarde; atenção à hidratação.",
            "Centro", "São Bernardo do Campo", SourceType.PUBLIC,
            "Boletim climático municipal (dado demonstrativo)", 0.88, 3, 3, -23.6927, -46.5645));
        events.create(new CreateEventRequest(EventType.SERVICE,
            "Oscilação no abastecimento de água", "Moradores relataram interrupções temporárias.",
            "Santa Paula", "São Caetano do Sul", SourceType.COMMUNITY,
            "Relato comunitário anônimo (simulado)", 0.64, 2, 2, -23.6248, -46.5688));
    }

    public CreateEventRequest nextSimulation() {
        int n = sequence.getAndIncrement() % 3;
        return switch (n) {
            case 0 -> new CreateEventRequest(EventType.FLOOD,
                "Novo alerta: elevação do nível da água", "Leitura simulada aponta risco de alagamento nas próximas horas.",
                "Rudge Ramos", "São Bernardo do Campo", SourceType.SENSOR,
                "Sensor hídrico UG-022 (simulado)", 0.96, 5, 5, -23.6548, -46.5753);
            case 1 -> new CreateEventRequest(EventType.HEAT,
                "Novo alerta: ilha de calor", "Temperaturas elevadas detectadas no corredor urbano.",
                "Centro", "Santo André", SourceType.PUBLIC,
                "Base pública climática (simulada)", 0.89, 4, 4, -23.6589, -46.5333);
            default -> new CreateEventRequest(EventType.SERVICE,
                "Novo alerta: falha no fornecimento de energia", "Interrupções informadas por moradores da região.",
                "Campestre", "Santo André", SourceType.COMMUNITY,
                "Relato comunitário anônimo (simulado)", 0.72, 4, 4, -23.6344, -46.5456);
        };
    }
}
