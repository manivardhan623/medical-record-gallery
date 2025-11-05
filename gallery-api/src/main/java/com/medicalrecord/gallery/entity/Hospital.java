package com.medicalrecord.gallery.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "hospitals")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Hospital {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long hospitalId;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String hospitalName;
    
    @Column
    private String address;
    
    @Column
    private String licenseNumber;
    
    @Column
    private String city;
    
    @Column
    private String state;
}
