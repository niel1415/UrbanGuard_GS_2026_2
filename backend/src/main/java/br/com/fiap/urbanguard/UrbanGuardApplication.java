package br.com.fiap.urbanguard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class UrbanGuardApplication {
    public static void main(String[] args) {
        SpringApplication.run(UrbanGuardApplication.class, args);
    }
}
