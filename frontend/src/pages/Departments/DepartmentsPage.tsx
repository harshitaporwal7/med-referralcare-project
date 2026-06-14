import { useEffect, useState } from 'react';
import { departmentsAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';

interface Department { id: number; name: string; description?: string; }

export default function DepartmentsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { loadDepartments(); }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await departmentsAPI.getAll();
      setDepartments(data.departments || []);
    } catch (err) { showToast('Failed to load departments', 'error'); }
    setLoading(false);
  };

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (d: Department) => {
    setSelected(d);
    setForm({ name: d.name, description: d.description || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { showToast('Name is required', 'warning'); return; }
    try {
      if (selected) {
        await departmentsAPI.update(selected.id, form);
        showToast('Department updated', 'success');
      } else {
        await departmentsAPI.create(form);
        showToast('Department created', 'success');
      }
      setModalOpen(false);
      loadDepartments();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await departmentsAPI.delete(selected.id);
      showToast('Department deleted', 'success');
      setDeleteDialog(false);
      loadDepartments();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage hospital departments</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        )}
      </div>

      {loading ? <TableSkeleton rows={5} /> : departments.length === 0 ? (
        <EmptyState icon={<Building2 className="w-8 h-8" />} title="No departments found" description="Add your first department" action={isAdmin ? <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">Add Department</button> : undefined} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments.map(d => (
            <div key={d.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(d)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setSelected(d); setDeleteDialog(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{d.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{d.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Department' : 'New Department'} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all">{selected ? 'Update' : 'Create'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={deleteDialog} title="Delete Department" message="Are you sure you want to delete this department?" onConfirm={handleDelete} onCancel={() => setDeleteDialog(false)} />
    </div>
  );
}
