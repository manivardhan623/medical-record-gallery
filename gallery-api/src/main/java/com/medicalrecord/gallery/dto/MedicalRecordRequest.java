package com.medicalrecord.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordRequest {
    private String recordType;
    private String fileName;
    private String filePath;
    private String description;
}
