import { useEffect, useState } from 'react';
import { appointmentsAPI, patientsAPI, doctorsAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Filter, Edit2, Trash2, CalendarDays } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { StatusBadge } from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';

interface Appointment {
  id: number;
  patient_id: number;
  patient_name?: string;
  doctor_id: number;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  notes?: string;
}

interface Patient { id: number; full_name: string; status?: string; }
interface Doctor { id: number; name: string; status?: string; }

const PAGE_SIZE = 8;

export default function AppointmentsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '09:00', duration_minutes: 30, status: 'scheduled', notes: '' });

  const canEdit = profile?.role === 'admin' || profile?.role === 'doctor' || profile?.role === 'staff';

  useEffect(() => { loadAppointments(); loadOptions(); }, [statusFilter, page]);

  const loadOptions = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        patientsAPI.getAll({ limit: 100 }),
        doctorsAPI.getAll({ limit: 100 }),
      ]);
      setPatients(pRes.data.patients?.filter((p: Patient) => p.status === 'active') || []);
      setDoctors(dRes.data.doctors?.filter((d: Doctor) => d.status === 'active') || []);
    } catch (err) { console.error('Failed to load options'); }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsAPI.getAll({ page, limit: PAGE_SIZE, status: statusFilter });
      setAppointments(data.appointments || []);
      setTotal(data.total || 0);
    } catch (err) { showToast('Failed to load appointments', 'error'); }
    setLoading(false);
  };

  const openCreate = () => {
    setSelected(null);
    setForm({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '09:00', duration_minutes: 30, status: 'scheduled', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setSelected(a);
    setForm({
      patient_id: String(a.patient_id),
      doctor_id: String(a.doctor_id),
      appointment_date: a.appointment_date,
      appointment_time: a.appointment_time,
      duration_minutes: a.duration_minutes,
      status: a.status,
      notes: a.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.patient_id || !form.doctor_id || !form.appointment_date || !form.appointment_time) {
      showToast('Patient, doctor, date, and time are required', 'warning');
      return;
    }
    try {
      const payload = {
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        duration_minutes: form.duration_minutes,
        status: form.status,
        notes: form.notes,
      };
      if (selected) {
        await appointmentsAPI.update(selected.id, payload);
        showToast('Appointment updated', 'success');
      } else {
        await appointmentsAPI.create(payload);
        showToast('Appointment created', 'success');
      }
      setModalOpen(false);
      loadAppointments();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await appointmentsAPI.delete(selected.id);
      showToast('Appointment deleted', 'success');
      setDeleteDialog(false);
      loadAppointments();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appointments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Schedule and manage appointments</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      {loading ? <TableSkeleton rows={5} /> : appointments.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-8 h-8" />} title="No appointments found" description="Schedule your first appointment" action={canEdit ? <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">New Appointment</button> : undefined} />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Patient / Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  {canEdit && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {appointments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{a.patient_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{a.doctor_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(a.appointment_date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{a.appointment_time?.slice(0, 5)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{a.duration_minutes} min</td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                    {canEdit && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><Edit2 className="w-4 h-4" /></button>
                          {profile?.role === 'admin' && <button onClick={() => { setSelected(a); setDeleteDialog(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Appointment' : 'New Appointment'} maxWidth="max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Patient *</label>
            <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none">
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Doctor *</label>
            <select value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none">
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
            <input type="date" value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time *</label>
            <input type="time" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (min)</label>
            <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 30 })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none">
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all">{selected ? 'Update' : 'Create'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={deleteDialog} title="Delete Appointment" message="Are you sure you want to delete this appointment?" onConfirm={handleDelete} onCancel={() => setDeleteDialog(false)} />
    </div>
  );
}
