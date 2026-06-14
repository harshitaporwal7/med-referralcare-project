export type UserRole = 'admin' | 'doctor' | 'staff' | 'patient';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string | null;
  name: string;
  specialization: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface Patient {
  id: string;
  user_id: string | null;
  full_name: string;
  gender: 'male' | 'female' | 'other' | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  medical_history: string | null;
  blood_group: string | null;
  status: 'active' | 'inactive' | 'discharged';
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  patient_id: string;
  referring_doctor_id: string;
  receiving_doctor_id: string | null;
  department_id: string | null;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reason: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  referring_doctor?: Doctor;
  receiving_doctor?: Doctor;
  department?: Department;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  referral_id: string | null;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
  referral?: Referral;
}

export interface Report {
  id: string;
  patient_id: string;
  doctor_id: string;
  referral_id: string | null;
  report_type: string;
  description: string | null;
  findings: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  upcomingAppointments: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}
