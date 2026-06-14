-- ===========================================
-- MED REFERRAL SYSTEM - MySQL Schema
-- Run this file once to set up the database
-- ===========================================

CREATE DATABASE IF NOT EXISTS med_referral CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE med_referral;

-- -----------------------------------------------
-- USERS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role ENUM('admin', 'doctor', 'staff', 'patient') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- DEPARTMENTS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- DOCTORS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  department_id INT,
  status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- -----------------------------------------------
-- PATIENTS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  full_name VARCHAR(255) NOT NULL,
  gender ENUM('male', 'female', 'other'),
  date_of_birth DATE,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  medical_history TEXT,
  blood_group VARCHAR(10),
  status ENUM('active', 'inactive', 'discharged') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------
-- REFERRALS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  referring_doctor_id INT NOT NULL,
  receiving_doctor_id INT,
  department_id INT,
  status ENUM('pending','accepted','in_progress','completed','rejected','cancelled') DEFAULT 'pending',
  priority ENUM('low','normal','high','urgent') DEFAULT 'normal',
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (referring_doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (receiving_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- -----------------------------------------------
-- APPOINTMENTS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  referral_id INT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INT DEFAULT 30,
  status ENUM('scheduled','confirmed','in_progress','completed','cancelled','no_show') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL
);

-- -----------------------------------------------
-- NOTIFICATIONS TABLE
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','error') DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================================
-- SEED DATA
-- ===========================================

-- Default admin user (password: admin123)
INSERT IGNORE INTO users (email, password_hash, full_name, role) VALUES
('admin@referralcare.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin');

-- Departments
INSERT IGNORE INTO departments (name, description) VALUES
('Cardiology', 'Heart and cardiovascular system'),
('Neurology', 'Brain and nervous system'),
('Orthopedics', 'Bones, joints, and muscles'),
('Oncology', 'Cancer diagnosis and treatment'),
('Emergency Medicine', 'Emergency and critical care'),
('Pediatrics', 'Children healthcare'),
('Dermatology', 'Skin, hair, and nails'),
('General Medicine', 'General health care');

-- Sample Doctors
INSERT IGNORE INTO doctors (name, specialization, email, phone, department_id, status) VALUES
('Dr. Sarah Johnson', 'Cardiologist', 'sarah.johnson@hospital.com', '+1-555-0101', 1, 'active'),
('Dr. Michael Chen', 'Neurologist', 'michael.chen@hospital.com', '+1-555-0102', 2, 'active'),
('Dr. Emily Rodriguez', 'Orthopedic Surgeon', 'emily.rodriguez@hospital.com', '+1-555-0103', 3, 'active'),
('Dr. James Wilson', 'Oncologist', 'james.wilson@hospital.com', '+1-555-0104', 4, 'active'),
('Dr. Priya Patel', 'Emergency Physician', 'priya.patel@hospital.com', '+1-555-0105', 5, 'active'),
('Dr. David Kim', 'Pediatrician', 'david.kim@hospital.com', '+1-555-0106', 6, 'active');

-- Sample Patients
INSERT IGNORE INTO patients (full_name, gender, date_of_birth, phone, email, blood_group, status) VALUES
('John Smith', 'male', '1985-03-15', '+1-555-1001', 'john.smith@email.com', 'O+', 'active'),
('Mary Johnson', 'female', '1990-07-22', '+1-555-1002', 'mary.j@email.com', 'A+', 'active'),
('Robert Davis', 'male', '1975-11-08', '+1-555-1003', 'r.davis@email.com', 'B-', 'active'),
('Linda Williams', 'female', '1965-04-30', '+1-555-1004', 'linda.w@email.com', 'AB+', 'active'),
('Michael Brown', 'male', '1992-09-14', '+1-555-1005', 'm.brown@email.com', 'O-', 'active');
