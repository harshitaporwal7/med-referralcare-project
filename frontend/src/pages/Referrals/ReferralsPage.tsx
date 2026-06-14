import { useEffect, useState } from 'react';
import { referralsAPI, patientsAPI, doctorsAPI, departmentsAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Filter, Edit2, Trash2, FileText, Eye } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';

interface Referral { id: number; patient_id: number; patient_name?: string; referring_doctor_id: number; referring_doctor_name?: string; receiving_doctor_id?: number; receiving_doctor_name?: string; department_id?: number; department_name?: string; reason: string; notes?: string; status: string; priority: string; }
interface Patient { id: number; full_name: string; status?: string; }
interface Doctor { id: number; name: string; specialization?: string; status?: string; }
interface Department { id: number; name: string; }

const PAGE_SIZE = 8;

export default function ReferralsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Referral | null>(null);
  const [form, setForm] = useState({ patient_id: '', referring_doctor_id: '', receiving_doctor_id: '', department_id: '', status: 'pending', priority: 'normal', reason: '', notes: '' });

  const canEdit = profile?.role === 'admin' || profile?.role === 'doctor' || profile?.role === 'staff';

  useEffect(() => { loadReferrals(); loadOptions(); }, [statusFilter, priorityFilter, page]);

  const loadOptions = async () => {
    try {
      const [pRes, dRes, deptRes] = await Promise.all([
        patientsAPI.getAll({ limit: 100 }),
        doctorsAPI.getAll({ limit: 100 }),
        departmentsAPI.getAll(),
      ]);
      setPatients(pRes.data.patients?.filter((p: Patient) => p.status === 'active') || []);
      setDoctors(dRes.data.doctors?.filter((d: Doctor) => d.status === 'active') || []);
      setDepartments(deptRes.data.departments || []);
    } catch (err) { console.error('Failed to load options'); }
  };

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const { data } = await referralsAPI.getAll({ page, limit: PAGE_SIZE, status: statusFilter, priority: priorityFilter });
      setReferrals(data.referrals || []);
      setTotal(data.total || 0);
    } catch (err) { showToast('Failed to load referrals', 'error'); }
    setLoading(false);
  };

  const openCreate = () => {
    setSelected(null);
    setForm({ patient_id: '', referring_doctor_id: '', receiving_doctor_id: '', department_id: '', status: 'pending', priority: 'normal', reason: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (r: Referral) => {
    setSelected(r);
    setForm({
      patient_id: String(r.patient_id),
      referring_doctor_id: String(r.referring_doctor_id),
      receiving_doctor_id: r.receiving_doctor_id ? String(r.receiving_doctor_id) : '',
      department_id: r.department_id ? String(r.department_id) : '',
      status: r.status,
      priority: r.priority,
      reason: r.reason,
      notes: r.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.patient_id || !form.referring_doctor_id || !form.reason) {
      showToast('Patient, referring doctor, and reason are required', 'warning');
      return;
    }
    try {
      const payload = {
        patient_id: form.patient_id,
        referring_doctor_id: form.referring_doctor_id,
        receiving_doctor_id: form.receiving_doctor_id || null,
        department_id: form.department_id || null,
        status: form.status,
        priority: form.priority,
        reason: form.reason,
        notes: form.notes,
      };
      if (selected) {
        await referralsAPI.update(selected.id, payload);
        showToast('Referral updated', 'success');
      } else {
        await referralsAPI.create(payload);
        showToast('Referral created', 'success');
      }
      setModalOpen(false);
      loadReferrals();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await referralsAPI.delete(selected.id);
      showToast('Referral deleted', 'success');
      setDeleteDialog(false);
      loadReferrals();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Referrals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage patient referrals between departments</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> New Referral
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {loading ? <TableSkeleton rows={5} /> : referrals.length === 0 ? (
        <EmptyState icon={<FileText className="w-8 h-8" />} title="No referrals found" description="Create your first referral" action={canEdit ? <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">New Referral</button> : undefined} />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">From / To</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden lg:table-cell">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Priority</th>
                  {canEdit && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {referrals.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">{r.patient_name?.charAt(0) || 'P'}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{r.patient_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{r.reason}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      <p>{r.referring_doctor_name}</p>
                      <p className="text-xs text-slate-400">&rarr; {r.receiving_doctor_name || 'Unassigned'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden lg:table-cell">{r.department_name || '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4"><PriorityBadge priority={r.priority} /></td>
                    {canEdit && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelected(r); setDetailModal(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(r)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><Edit2 className="w-4 h-4" /></button>
                          {profile?.role === 'admin' && <button onClick={() => { setSelected(r); setDeleteDialog(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 className="w-4 h-4" /></button>}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Referral' : 'New Referral'} maxWidth="max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Patient *</label>
            <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none">
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referring Doctor *</label>
            <select value={form.referring_doctor_id} onChange={e => setForm({ ...form, referring_doctor_id: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none">
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.specialization}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Receiving Doctor</label>
            <select value={form.receiving_doctor_id} onChange={e => setForm({ ...form, receiving_doctor_id: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none">
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
            <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none">
              <option value="">Select Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none">
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason *</label>
            <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
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

      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Referral Details" maxWidth="max-w-lg">
        {selected && (
          <div className="space-y-3">
            <div><span className="text-xs text-slate-500">Patient</span><p className="text-sm font-medium text-slate-900 dark:text-white">{selected.patient_name}</p></div>
            <div><span className="text-xs text-slate-500">Reason</span><p className="text-sm text-slate-700 dark:text-slate-300">{selected.reason}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-slate-500">From</span><p className="text-sm text-slate-700 dark:text-slate-300">{selected.referring_doctor_name}</p></div>
              <div><span className="text-xs text-slate-500">To</span><p className="text-sm text-slate-700 dark:text-slate-300">{selected.receiving_doctor_name || 'Unassigned'}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-slate-500">Status</span><StatusBadge status={selected.status} /></div>
              <div><span className="text-xs text-slate-500">Priority</span><PriorityBadge priority={selected.priority} /></div>
            </div>
            {selected.notes && <div><span className="text-xs text-slate-500">Notes</span><p className="text-sm text-slate-700 dark:text-slate-300">{selected.notes}</p></div>}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={deleteDialog} title="Delete Referral" message="Are you sure you want to delete this referral?" onConfirm={handleDelete} onCancel={() => setDeleteDialog(false)} />
    </div>
  );
}
