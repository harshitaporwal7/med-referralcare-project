import { useEffect, useState } from 'react';
import { doctorsAPI, departmentsAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Edit2, Trash2, Stethoscope, Filter } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { StatusBadge } from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';

interface Doctor { id: number; name: string; specialization: string; email?: string; phone?: string; department_id?: number; department_name?: string; status: string; }
interface Department { id: number; name: string; }

const PAGE_SIZE = 8;

export default function DoctorsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ name: '', specialization: '', email: '', phone: '', department_id: '', status: 'active' });

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { loadDoctors(); loadDepartments(); }, [search, statusFilter, page]);

  const loadDepartments = async () => {
    try {
      const { data } = await departmentsAPI.getAll();
      setDepartments(data.departments || []);
    } catch (err) { console.error('Failed to load departments'); }
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await doctorsAPI.getAll({ page, limit: PAGE_SIZE, search, status: statusFilter });
      setDoctors(data.doctors || []);
      setTotal(data.total || 0);
    } catch (err) { showToast('Failed to load doctors', 'error'); }
    setLoading(false);
  };

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', specialization: '', email: '', phone: '', department_id: '', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setSelected(d);
    setForm({
      name: d.name,
      specialization: d.specialization,
      email: d.email || '',
      phone: d.phone || '',
      department_id: d.department_id ? String(d.department_id) : '',
      status: d.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.specialization || !form.email) {
      showToast('Name, specialization, and email are required', 'warning');
      return;
    }
    try {
      const payload = {
        ...form,
        department_id: form.department_id || null,
      };
      if (selected) {
        await doctorsAPI.update(selected.id, payload);
        showToast('Doctor updated', 'success');
      } else {
        await doctorsAPI.create(payload);
        showToast('Doctor created', 'success');
      }
      setModalOpen(false);
      loadDoctors();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await doctorsAPI.delete(selected.id);
      showToast('Doctor deleted', 'success');
      setDeleteDialog(false);
      loadDoctors();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Doctors</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage doctor profiles and assignments</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search doctors..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      {loading ? <TableSkeleton rows={5} /> : doctors.length === 0 ? (
        <EmptyState icon={<Stethoscope className="w-8 h-8" />} title="No doctors found" description="Add your first doctor" action={isAdmin ? <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">Add Doctor</button> : undefined} />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden lg:table-cell">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  {isAdmin && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {doctors.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-sm font-bold">{d.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{d.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{d.specialization}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden lg:table-cell">{d.department_name || '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(d)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => { setSelected(d); setDeleteDialog(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 className="w-4 h-4" /></button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Doctor' : 'New Doctor'} maxWidth="max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specialization *</label>
            <input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all">{selected ? 'Update' : 'Create'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={deleteDialog} title="Delete Doctor" message="Are you sure you want to delete this doctor?" onConfirm={handleDelete} onCancel={() => setDeleteDialog(false)} />
    </div>
  );
}
