package com.tauche.tauche.model;

import java.time.LocalDate;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "certifications")
public class Certification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diver_id", nullable = false)
    private Diver diver;
    
    @NotBlank
    @Column(nullable = false)
    private String certificationName;
    
    @NotBlank
    @Column(nullable = false)
    private String agency;
    
    private Integer maxDepth;

    @NotNull
    @Column(nullable = false)
    private LocalDate dateIssued;
    
    private LocalDate expiryDate;
    
    @Column(length = 100)
    private String certificationNumber;

    @Column(length = 200)
    private String instructor;

    @Column(length = 200)
    private String diveShop;

    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false, updatable = false)
    private LocalDate createdAt = LocalDate.now();
    
    private LocalDate updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();
    }
}
