package com.medicalrecord.gallery.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "access_logs")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AccessLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;
    
    @Column(nullable = false)
    private String accessCode;
    
    @Column(nullable = false)
    private LocalDateTime accessTime = LocalDateTime.now();
    
    @Column
    private LocalDateTime expiresAt;
}
