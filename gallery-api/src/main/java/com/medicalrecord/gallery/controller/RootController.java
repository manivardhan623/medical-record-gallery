package com.medicalrecord.gallery.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "online");
        response.put("message", "Medical Gallery API is running");
        response.put("version", "1.0");
        response.put("endpoints", Map.of(
            "health", "/api/auth/health",
            "documentation", "Contact developer for API documentation"
        ));
        return response;
    }
}
