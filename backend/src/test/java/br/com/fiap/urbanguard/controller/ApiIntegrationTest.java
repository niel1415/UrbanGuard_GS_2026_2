package br.com.fiap.urbanguard.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={
    "spring.datasource.url=jdbc:h2:mem:urbanguard-test;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "urban.demo.enabled=false"
})
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired MockMvc mvc;

    @Test void healthAndDashboardWork() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
        mvc.perform(get("/api/dashboard")).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalEvents").isNumber());
    }

    @Test void createIsPersistedAndVisible() throws Exception {
        String body = """
            {"eventType":"FLOOD","title":"Alerta de teste","description":"Chuva intensa",
            "neighborhood":"Centro","city":"Santo Andre","sourceType":"SENSOR",
            "origin":"Sensor de teste","confidence":0.9,"severity":5,"impactLevel":4}
            """;
        mvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.priorityLevel").value("CRITICO"));
        mvc.perform(get("/api/events")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].title").value("Alerta de teste"));
    }

    @Test void rejectsMissingTitle() throws Exception {
        String invalid = """
            {"eventType":"HEAT","title":"","description":"Desc","neighborhood":"Centro",
            "city":"Santo Andre","sourceType":"PUBLIC","origin":"Boletim",
            "confidence":0.8,"severity":2,"impactLevel":2}
            """;
        mvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(invalid))
            .andExpect(status().isBadRequest());
    }
}
