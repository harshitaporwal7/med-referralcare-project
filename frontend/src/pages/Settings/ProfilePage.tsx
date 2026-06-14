import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authAPI } from '../../lib/api';
import { User, Mail, Phone, Shield, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!name) { showToast('Name is required', 'warning'); return; }
    setSaving(true);
    try {
      await authAPI.updateProfile({ full_name: name, phone });
      await refreshProfile();
      showToast('Profile updated', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.new || passwordForm.new.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }
    if (passwordForm.new !== passwordForm.confirm) { showToast('Passwords do not match', 'error'); return; }
    showToast('Password update functionality requires backend implementation', 'info');
    setPasswordForm({ new: '', confirm: '' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal information</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-cyan-500" />
        <div className="px-6 pb-6 -mt-10">
          <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-2xl border-4 border-white dark:border-slate-800 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400 shadow-lg">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{profile?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                  <Shield className="w-3 h-3" /> {profile?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={profile?.email || ''} disabled className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>
          <div className="pt-2">
            <button onClick={handleUpdateProfile} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
            <input type="password" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} placeholder="Min. 6 characters" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} placeholder="Re-enter new password" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div className="pt-2">
            <button onClick={handleChangePassword} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-sm font-medium rounded-xl hover:bg-slate-700 dark:hover:bg-slate-300 transition-all">
              <Save className="w-4 h-4" /> Update Password
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
