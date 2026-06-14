import { useEffect, useState } from 'react';
import { patientsAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Edit2, Trash2, Users, Filter } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { StatusBadge } from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';

interface Patient { id: number; full_name: string; gender?: string; date_of_birth?: string; phone?: string; email?: string; address?: string; medical_history?: string; status: string; }
const PAGE_SIZE = 8;

export default function PatientsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [form, setForm] = useState({ full_name: '', gender: 'male', date_of_birth: '', phone: '', email: '', address: '', medical_history: '', status: 'active' });

  const isAdmin = profile?.role === 'admin';
  const canEdit = isAdmin || profile?.role === 'staff' || profile?.role === 'doctor';

  useEffect(() => { loadPatients(); }, [search, statusFilter, page]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const { data } = await patientsAPI.getAll({ page, limit: PAGE_SIZE, search, status: statusFilter });
      setPatients(data.patients || []);
      setTotal(data.total || 0);
    } catch (err) { showToast('Failed to load patients', 'error'); }
    setLoading(false);
  };

  const openCreate = () => { setSelected(null); setForm({ full_name: '', gender: 'male', date_of_birth: '', phone: '', email: '', address: '', medical_history: '', status: 'active' }); setModalOpen(true); };
  //const openEdit = (p: Patient) => { setSelected(p); setForm({ full_name: p.full_name, gender: p.gender || 'male', date_of_birth: p.date_of_birth ? p.date_of_birth.split('T')[0] || '', phone: p.phone || '', email: p.email || '', address: p.address || '', medical_history: p.medical_history || '', status: p.status }); setModalOpen(true); };
  const openEdit = (p: Patient) => {
  setSelected(p);
  setForm({
    full_name: p.full_name,
    gender: p.gender || 'male',
    date_of_birth: p.date_of_birth
      ? p.date_of_birth.split('T')[0]
      : '',
    phone: p.phone || '',
    email: p.email || '',
    address: p.address || '',
    medical_history: p.medical_history || '',
    status: p.status
  });
  setModalOpen(true);
};

  const handleSave = async () => {
    if (!form.full_name) { showToast('Name is required', 'warning'); return; }
    try {
      if (selected) { await patientsAPI.update(selected.id, form); showToast('Patient updated', 'success'); }
      else { await patientsAPI.create(form); showToast('Patient created', 'success'); }
      setModalOpen(false); loadPatients();
    } catch (err: any) { showToast(err.message || 'Operation failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try { await patientsAPI.delete(selected.id); showToast('Patient deleted', 'success'); setDeleteDialog(false); loadPatients(); }
    catch (err: any) { showToast(err.message || 'Delete failed', 'error'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patients</h1><p className="text-sm text-slate-500 dark:text-slate-400">Manage patient records and information</p></div>
        {canEdit && (<button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm"><Plus className="w-4 h-4" /> Add Patient</button>)}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search patients..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" /></div>
        <div className="relative"><Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="discharged">Discharged</option></select></div>
      </div>
      {loading ? <TableSkeleton rows={5} /> : patients.length === 0 ? (<EmptyState icon={<Users className="w-8 h-8" />} title="No patients found" description="Add your first patient or adjust your search filters" action={canEdit ? <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">Add Patient</button> : undefined} />) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gender</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Phone</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>{canEdit && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">{patients.map(p => (<tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">{p.full_name.charAt(0)}</div><div><p className="text-sm font-medium text-slate-900 dark:text-white">{p.full_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{p.email}</p></div></div></td><td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 capitalize">{p.gender || '-'}</td><td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{p.phone || '-'}</td><td className="px-6 py-4"><StatusBadge status={p.status} /></td>{canEdit && (<td className="px-6 py-4"><div className="flex items-center justify-end gap-1"><button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><Edit2 className="w-4 h-4" /></button>{isAdmin && <button onClick={() => { setSelected(p); setDeleteDialog(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 className="w-4 h-4" /></button>}</div></td>)}</tr>))}</tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Patient' : 'New Patient'} maxWidth="max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label><select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"><option value="active">Active</option><option value="inactive">Inactive</option><option value="discharged">Discharged</option></select></div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Medical History</label><textarea value={form.medical_history} onChange={e => setForm({ ...form, medical_history: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" /></div>
        </div>
        <div className="flex gap-3 justify-end mt-6"><button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Cancel</button><button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all">{selected ? 'Update' : 'Create'}</button></div>
      </Modal>
      <ConfirmDialog open={deleteDialog} title="Delete Patient" message="Are you sure you want to delete this patient?" onConfirm={handleDelete} onCancel={() => setDeleteDialog(false)} />
    </div>
  );
}
