CREATE DATABASE IF NOT EXISTS medical_gallery;
USE medical_gallery;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unique_code VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255),
    user_type ENUM('PATIENT', 'HOSPITAL', 'ADMIN') NOT NULL,
    account_status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_unique_code (unique_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE otp_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    otp_code VARCHAR(10) NOT NULL,
    purpose ENUM('LOGIN', 'REGISTRATION', 'PASSWORD_RESET') NOT NULL,
    status ENUM('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED') DEFAULT 'PENDING',
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    INDEX idx_phone (phone_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE patient_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    record_uuid VARCHAR(36) UNIQUE NOT NULL,
    patient_phone VARCHAR(15) NOT NULL,
    patient_name VARCHAR(255),
    hospital_code VARCHAR(50) NOT NULL,
    record_type ENUM('XRAY', 'LAB_REPORT', 'PRESCRIPTION', 'SCAN', 'OTHER') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    encrypted BOOLEAN DEFAULT TRUE,
    checksum VARCHAR(64),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (hospital_code) REFERENCES users(unique_code) ON DELETE CASCADE,
    INDEX idx_patient_phone (patient_phone),
    INDEX idx_hospital_code (hospital_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unique_code VARCHAR(50) UNIQUE NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unique_code) REFERENCES users(unique_code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_description TEXT
) ENGINE=InnoDB;

CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (role_name, role_description) VALUES
('SUPER_ADMIN', 'Full system access'),
('HOSPITAL_ADMIN', 'Hospital management access'),
('DOCTOR', 'Doctor access'),
('NURSE', 'Nursing staff access'),
('RECEPTIONIST', 'Reception staff access'),
('PATIENT', 'Patient self-service access');
