package br.com.fiap.urbanguard.config;

import br.com.fiap.urbanguard.realtime.EventSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/** Abertura de CORS limitada ao projeto acadêmico em ambiente local. */
@Configuration
@EnableWebSocket
public class WebConfig implements WebSocketConfigurer, WebMvcConfigurer {
    private final EventSocketHandler socket;
    public WebConfig(EventSocketHandler socket) { this.socket = socket; }
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(socket, "/ws/events").setAllowedOriginPatterns("*");
    }
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "OPTIONS").allowedHeaders("*");
    }
}
