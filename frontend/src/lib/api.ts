import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ' https://med-referralcare-project.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Extract server error message so it propagates as a real Error
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  register: async (email: string, password: string, full_name: string, phone: string, role: string) => {
    const { data } = await api.post('/auth/register', { email, password, full_name, phone, role });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
  updateProfile: async (profile: { full_name: string; phone: string }) => {
    const { data } = await api.put('/auth/profile', profile);
    return data;
  },
};

export const patientsAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const { data } = await api.get('/patients', { params });
    return { data };
  },
  getById: async (id: number) => {
    const { data } = await api.get(`/patients/${id}`);
    return { data };
  },
  create: async (patientData: any) => {
    const { data } = await api.post('/patients', patientData);
    return { data };
  },
  update: async (id: number, patientData: any) => {
    const { data } = await api.put(`/patients/${id}`, patientData);
    return { data };
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/patients/${id}`);
    return { data };
  },
};

export const doctorsAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string; department_id?: number }) => {
    const { data } = await api.get('/doctors', { params });
    return { data };
  },
  getById: async (id: number) => {
    const { data } = await api.get(`/doctors/${id}`);
    return { data };
  },
  create: async (doctorData: any) => {
    const { data } = await api.post('/doctors', doctorData);
    return { data };
  },
  update: async (id: number, doctorData: any) => {
    const { data } = await api.put(`/doctors/${id}`, doctorData);
    return { data };
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/doctors/${id}`);
    return { data };
  },
};

export const departmentsAPI = {
  getAll: async () => {
    const { data } = await api.get('/departments');
    return { data };
  },
  create: async (departmentData: any) => {
    const { data } = await api.post('/departments', departmentData);
    return { data };
  },
  update: async (id: number, departmentData: any) => {
    const { data } = await api.put(`/departments/${id}`, departmentData);
    return { data };
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/departments/${id}`);
    return { data };
  },
};

export const referralsAPI = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; priority?: string }) => {
    const { data } = await api.get('/referrals', { params });
    return { data };
  },
  getById: async (id: number) => {
    const { data } = await api.get(`/referrals/${id}`);
    return { data };
  },
  create: async (referralData: any) => {
    const { data } = await api.post('/referrals', referralData);
    return { data };
  },
  update: async (id: number, referralData: any) => {
    const { data } = await api.put(`/referrals/${id}`, referralData);
    return { data };
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/referrals/${id}`);
    return { data };
  },
};

export const appointmentsAPI = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await api.get('/appointments', { params });
    return { data };
  },
  getById: async (id: number) => {
    const { data } = await api.get(`/appointments/${id}`);
    return { data };
  },
  create: async (appointmentData: any) => {
    const { data } = await api.post('/appointments', appointmentData);
    return { data };
  },
  update: async (id: number, appointmentData: any) => {
    const { data } = await api.put(`/appointments/${id}`, appointmentData);
    return { data };
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/appointments/${id}`);
    return { data };
  },
};

export const notificationsAPI = {
  getAll: async () => {
    const { data } = await api.get('/notifications');
    return { data };
  },
  markAsRead: async (id: number) => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return { data };
  },
  markAllAsRead: async () => {
    const { data } = await api.put('/notifications/read-all');
    return { data };
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/notifications/${id}`);
    return { data };
  },
};

export default api;
