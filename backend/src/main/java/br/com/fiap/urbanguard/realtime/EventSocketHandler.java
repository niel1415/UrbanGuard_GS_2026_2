package br.com.fiap.urbanguard.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class EventSocketHandler extends TextWebSocketHandler {
    private final Set<WebSocketSession> clients = ConcurrentHashMap.newKeySet();
    private final ObjectMapper mapper;

    public EventSocketHandler(ObjectMapper mapper) { this.mapper = mapper; }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        clients.add(session);
        safeSend(session, mapper.writeValueAsString(Map.of("type", "CONNECTED", "at", Instant.now().toString())));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        clients.remove(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable error) {
        clients.remove(session);
        try { session.close(); } catch (IOException ignored) { }
    }

    public void broadcast(Object payload) {
        try {
            String content = mapper.writeValueAsString(payload);
            for (WebSocketSession session : clients) safeSend(session, content);
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new IllegalStateException("Falha ao serializar evento", ex);
        }
    }

    @Scheduled(fixedRate = 12000)
    public void heartbeat() {
        if (!clients.isEmpty()) broadcast(Map.of("type", "HEARTBEAT", "at", Instant.now().toString()));
    }

    private void safeSend(WebSocketSession session, String message) {
        if (!session.isOpen()) { clients.remove(session); return; }
        try {
            synchronized (session) { if (session.isOpen()) session.sendMessage(new TextMessage(message)); }
        } catch (Exception e) {
            clients.remove(session);
            try { session.close(); } catch (IOException ignored) { }
        }
    }
}
