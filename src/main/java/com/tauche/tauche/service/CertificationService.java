package com.tauche.tauche.service;

import com.tauche.tauche.dto.CertificationDTO;
import com.tauche.tauche.model.Certification;
import com.tauche.tauche.model.Diver;
import com.tauche.tauche.repository.CertificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CertificationService {
    
    @Autowired
    private CertificationRepository certificationRepository;
    
    public CertificationDTO createCertification(Diver diver, CertificationDTO dto) {
        Certification cert = Certification.builder()
            .diver(diver)
            .certificationName(dto.getCertificationName())
            .agency(dto.getAgency())
            .maxDepth(dto.getMaxDepth() != null ? dto.getMaxDepth() : 0)
            .dateIssued(dto.getDateIssued())
            .expiryDate(dto.getExpiryDate())
            .certificationNumber(dto.getCertificationNumber())
            .instructor(dto.getInstructor())
            .diveShop(dto.getDiveShop())
            .isActive(true)
            .build();
        
        return mapToDTO(certificationRepository.save(cert));
    }
    
    public List<CertificationDTO> getUserCertifications(Diver diver) {
        return certificationRepository.findByDiverAndIsActiveTrue(diver)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    public List<CertificationDTO> getActiveCertifications(Diver diver) {
        return certificationRepository.findActiveCertifications(diver)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    public List<CertificationDTO> getExpiringCertifications(Diver diver, int daysUntilExpiry) {
        LocalDate expiryDate = LocalDate.now().plusDays(daysUntilExpiry);
        return certificationRepository.findExpiringCertifications(diver, expiryDate)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    public CertificationDTO updateCertification(Long certId, Diver diver, CertificationDTO dto) {
        Certification cert = certificationRepository.findById(certId)
            .orElseThrow(() -> new RuntimeException("Certification not found"));
        
        if (!cert.getDiver().getId().equals(diver.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        cert.setCertificationName(dto.getCertificationName());
        cert.setAgency(dto.getAgency());
        cert.setMaxDepth(dto.getMaxDepth() != null ? dto.getMaxDepth() : cert.getMaxDepth() != null ? cert.getMaxDepth() : 0);
        cert.setDateIssued(dto.getDateIssued());
        cert.setExpiryDate(dto.getExpiryDate());
        cert.setCertificationNumber(dto.getCertificationNumber());
        cert.setInstructor(dto.getInstructor());
        cert.setDiveShop(dto.getDiveShop());

        return mapToDTO(certificationRepository.save(cert));
    }
    
    public void deleteCertification(Long certId, Diver diver) {
        Certification cert = certificationRepository.findById(certId)
            .orElseThrow(() -> new RuntimeException("Certification not found"));
        
        if (!cert.getDiver().getId().equals(diver.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        certificationRepository.delete(cert);
    }
    
    private CertificationDTO mapToDTO(Certification cert) {
        boolean isExpired = cert.getExpiryDate() != null && 
                           cert.getExpiryDate().isBefore(LocalDate.now());
        
        Integer daysUntilExpiry = null;
        if (cert.getExpiryDate() != null && !isExpired) {
            daysUntilExpiry = (int) ChronoUnit.DAYS.between(LocalDate.now(), cert.getExpiryDate());
        }
        
        return CertificationDTO.builder()
            .id(cert.getId())
            .certificationName(cert.getCertificationName())
            .agency(cert.getAgency())
            .maxDepth(cert.getMaxDepth())
            .dateIssued(cert.getDateIssued())
            .expiryDate(cert.getExpiryDate())
            .certificationNumber(cert.getCertificationNumber())
            .instructor(cert.getInstructor())
            .diveShop(cert.getDiveShop())
            .isActive(cert.getIsActive())
            .isExpired(isExpired)
            .daysUntilExpiry(daysUntilExpiry)
            .build();
    }
}
