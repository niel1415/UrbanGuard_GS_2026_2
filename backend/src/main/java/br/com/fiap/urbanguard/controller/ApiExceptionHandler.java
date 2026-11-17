package br.com.fiap.urbanguard.controller;

import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import java.util.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> invalid(MethodArgumentNotValidException e) {
        String reason = e.getBindingResult().getFieldErrors().stream()
            .findFirst().map(error -> error.getField() + ": " + error.getDefaultMessage())
            .orElse("Dados inválidos");
        return ResponseEntity.badRequest().body(Map.of("error", reason));
    }
    @ExceptionHandler({HttpMessageNotReadableException.class, IllegalArgumentException.class})
    public ResponseEntity<Map<String, Object>> malformed(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", "JSON inválido ou campo fora do formato esperado"));
    }
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> missing(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }
}
