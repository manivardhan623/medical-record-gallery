package com.medicalrecord.gallery.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "patients")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Patient {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long patientId;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column
    private LocalDate dateOfBirth;
    
    @Column
    private String gender;
    
    @Column
    private String bloodGroup;
    
    @Column
    private String address;
    
    @Column
    private String emergencyContact;
}
