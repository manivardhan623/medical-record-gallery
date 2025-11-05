package com.medicalrecord.gallery.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("✅ Medical Gallery API is running perfectly!");
    }

    @GetMapping("/status")
    public ResponseEntity<HealthStatus> getStatus() {
        HealthStatus status = new HealthStatus(
                "HEALTHY",
                "All systems operational",
                System.currentTimeMillis()
        );
        return ResponseEntity.ok(status);
    }
}

class HealthStatus {
    private String status;
    private String message;
    private long timestamp;

    public HealthStatus(String status, String message, long timestamp) {
        this.status = status;
        this.message = message;
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public long getTimestamp() {
        return timestamp;
    }
}
