import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { patientsAPI, doctorsAPI, referralsAPI, appointmentsAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Stethoscope, FileText, CalendarDays, TrendingUp, Clock, Activity, ArrowRight, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { CardSkeleton, ChartSkeleton } from '../../components/common/Skeleton';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
type CardDetailType = 'totalPatients' | 'totalDoctors' | 'activeReferrals' | 'pendingReferrals' | 'completedReferrals' | 'upcomingAppointments' | null;

const statCards = [
  { key: 'totalPatients' as const, label: 'Total Patients', icon: Users, color: 'from-blue-500 to-blue-600', route: '/dashboard/patients' },
  { key: 'totalDoctors' as const, label: 'Total Doctors', icon: Stethoscope, color: 'from-cyan-500 to-cyan-600', route: '/dashboard/doctors' },
  { key: 'activeReferrals' as const, label: 'Active Referrals', icon: Activity, color: 'from-emerald-500 to-emerald-600', route: '/dashboard/referrals' },
  { key: 'pendingReferrals' as const, label: 'Pending Referrals', icon: Clock, color: 'from-amber-500 to-amber-600', route: '/dashboard/referrals' },
  { key: 'completedReferrals' as const, label: 'Completed', icon: FileText, color: 'from-teal-500 to-teal-600', route: '/dashboard/referrals' },
  { key: 'upcomingAppointments' as const, label: 'Upcoming Appointments', icon: CalendarDays, color: 'from-indigo-500 to-indigo-600', route: '/dashboard/appointments' },
];

interface Referral { id: number; patient_name?: string; referring_doctor_name?: string; receiving_doctor_name?: string; department_name?: string; reason: string; status: string; priority: string; }
interface Appointment { id: number; patient_name?: string; doctor_name?: string; appointment_date: string; appointment_time: string; duration_minutes: number; status: string; }
interface Patient { id: number; full_name: string; email?: string; phone?: string; status: string; }
interface Doctor { id: number; name: string; specialization: string; department_name?: string; status: string; }

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ totalPatients: number; totalDoctors: number; activeReferrals: number; pendingReferrals: number; completedReferrals: number; upcomingAppointments: number } | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<CardDetailType>(null);
  const [cardDetails, setCardDetails] = useState<{ patients: Patient[]; doctors: Doctor[] }>({ patients: [], doctors: [] });

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [pRes, dRes, rRes, aRes] = await Promise.all([
        patientsAPI.getAll({ limit: 1 }), doctorsAPI.getAll({ limit: 1 }), referralsAPI.getAll({ limit: 100 }), appointmentsAPI.getAll({ limit: 100 })
      ]);
      const allReferrals = rRes.data.referrals || [];
      const upcomingAppts = (aRes.data.appointments || []).filter((a: Appointment) => ['scheduled', 'confirmed'].includes(a.status));
      setStats({
        totalPatients: pRes.data.total || 0, totalDoctors: dRes.data.total || 0,
        activeReferrals: allReferrals.filter((r: Referral) => r.status === 'in_progress').length,
        pendingReferrals: allReferrals.filter((r: Referral) => r.status === 'pending').length,
        completedReferrals: allReferrals.filter((r: Referral) => r.status === 'completed').length,
        upcomingAppointments: upcomingAppts.length,
      });
      setReferrals(allReferrals);
      setAppointments(upcomingAppts.slice(0, 5));
    } catch (err) { console.error('Dashboard load error:', err); } finally { setLoading(false); }
  };

  const handleCardClick = async (key: CardDetailType) => {
    setActiveCard(key);
    if (key === 'totalPatients') { const { data } = await patientsAPI.getAll({ limit: 10 }); setCardDetails(prev => ({ ...prev, patients: data.patients || [] })); }
    else if (key === 'totalDoctors') { const { data } = await doctorsAPI.getAll({ limit: 10 }); setCardDetails(prev => ({ ...prev, doctors: data.doctors || [] })); }
  };

  const referralStatusData = [
    { name: 'Pending', value: referrals.filter(r => r.status === 'pending').length },
    { name: 'Accepted', value: referrals.filter(r => r.status === 'accepted').length },
    { name: 'In Progress', value: referrals.filter(r => r.status === 'in_progress').length },
    { name: 'Completed', value: referrals.filter(r => r.status === 'completed').length },
  ].filter(d => d.value > 0);

  const departmentData = ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Emergency Medicine', 'Pediatrics', 'Dermatology', 'General Medicine'].map(name => ({
    name: name.replace(' Medicine', ''), referrals: referrals.filter(r => r.department_name === name).length
  })).filter(d => d.referrals > 0);

  const monthlyTrend = [{ month: 'Jan', referrals: 12, completed: 8 }, { month: 'Feb', referrals: 19, completed: 14 }, { month: 'Mar', referrals: 15, completed: 12 }, { month: 'Apr', referrals: 22, completed: 18 }, { month: 'May', referrals: 28, completed: 20 }, { month: 'Jun', referrals: referrals.length, completed: referrals.filter(r => r.status === 'completed').length }];

  const getFilteredReferrals = () => {
    if (activeCard === 'activeReferrals') return referrals.filter(r => r.status === 'in_progress');
    if (activeCard === 'pendingReferrals') return referrals.filter(r => r.status === 'pending');
    if (activeCard === 'completedReferrals') return referrals.filter(r => r.status === 'completed');
    return [];
  };

  if (loading) return (<div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ChartSkeleton /><ChartSkeleton /></div></div>);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {profile?.full_name || 'User'}</h1><p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here&apos;s what&apos;s happening in your referral system today</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const value = stats?.[card.key] ?? 0;
          const Icon = card.icon;
          return (
            <motion.div key={card.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} onClick={() => handleCardClick(card.key)} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.color} text-white shadow-sm`}><Icon className="w-5 h-5" /></div><div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium"><TrendingUp className="w-3 h-3" /><span>+12%</span></div></div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              <div className="flex items-center justify-between mt-1"><p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p><ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" /></div>
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>
        {activeCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black" onClick={() => setActiveCard(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{activeCard === 'totalPatients' && 'Patients Overview'}{activeCard === 'totalDoctors' && 'Doctors Overview'}{activeCard === 'activeReferrals' && 'Active Referrals'}{activeCard === 'pendingReferrals' && 'Pending Referrals'}{activeCard === 'completedReferrals' && 'Completed Referrals'}{activeCard === 'upcomingAppointments' && 'Upcoming Appointments'}</h2>
                <div className="flex items-center gap-2"><button onClick={() => { const card = statCards.find(c => c.key === activeCard); if (card) navigate(card.route); setActiveCard(null); }} className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all">View All <ArrowRight className="w-3 h-3 inline" /></button><button onClick={() => setActiveCard(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"><X className="w-5 h-5" /></button></div>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-64px)]">
                {activeCard === 'totalPatients' && (<div className="divide-y divide-slate-100 dark:divide-slate-700/50">{cardDetails.patients.map(p => (<div key={p.id} className="px-6 py-3 flex items-center gap-3"><div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">{p.full_name.charAt(0)}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-white">{p.full_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{p.email || p.phone || 'No contact'}</p></div><StatusBadge status={p.status} /></div>))}{cardDetails.patients.length === 0 && <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No patients found</div>}</div>)}
                {activeCard === 'totalDoctors' && (<div className="divide-y divide-slate-100 dark:divide-slate-700/50">{cardDetails.doctors.map(d => (<div key={d.id} className="px-6 py-3 flex items-center gap-3"><div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-sm font-bold">{d.name.charAt(0)}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-white">{d.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{d.specialization} {d.department_name ? `- ${d.department_name}` : ''}</p></div><StatusBadge status={d.status} /></div>))}{cardDetails.doctors.length === 0 && <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No doctors found</div>}</div>)}
                {(activeCard === 'activeReferrals' || activeCard === 'pendingReferrals' || activeCard === 'completedReferrals') && (<div className="divide-y divide-slate-100 dark:divide-slate-700/50">{getFilteredReferrals().map(r => (<div key={r.id} className="px-6 py-3 flex items-center gap-3"><div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">{r.patient_name?.charAt(0) || 'P'}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-white">{r.patient_name}</p><p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.reason}</p><p className="text-[10px] text-slate-400 mt-0.5">{r.referring_doctor_name} &rarr; {r.receiving_doctor_name || 'Unassigned'} | {r.department_name || 'No dept'}</p></div><div className="flex flex-col items-end gap-1"><StatusBadge status={r.status} /><PriorityBadge priority={r.priority} /></div></div>))}{getFilteredReferrals().length === 0 && <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No referrals in this category</div>}</div>)}
                {activeCard === 'upcomingAppointments' && (<div className="divide-y divide-slate-100 dark:divide-slate-700/50">{appointments.map(apt => (<div key={apt.id} className="px-6 py-3 flex items-center gap-3"><div className="w-10 h-10 bg-indigo-101 dark:bg-indigo-900/30 rounded-lg flex flex-col items-center justify-center"><span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">{apt.appointment_date?.slice(8)}</span><span className="text-[9px] text-indigo-500 uppercase">{new Date(apt.appointment_date + 'T00:00:00').toLocaleString('en', { month: 'short' })}</span></div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-white">{apt.patient_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{apt.doctor_name} - {apt.appointment_time?.slice(0, 5)} ({apt.duration_minutes} min)</p></div><StatusBadge status={apt.status} /></div>))}{appointments.length === 0 && <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No upcoming appointments</div>}</div>)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Monthly Referral Trend</h3>
          <ResponsiveContainer width="100%" height={260}><AreaChart data={monthlyTrend}><defs><linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient><linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" /><YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" /><Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} /><Area type="monotone" dataKey="referrals" stroke="#3b82f6" fill="url(#refGrad)" strokeWidth={2} name="Referrals" /><Area type="monotone" dataKey="completed" stroke="#10b981" fill="url(#compGrad)" strokeWidth={2} name="Completed" /></AreaChart></ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Referral Status Overview</h3>
          <div className="flex items-center gap-6"><ResponsiveContainer width="50%" height={220}><PieChart><Pie data={referralStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">{referralStatusData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} /></PieChart></ResponsiveContainer><div className="flex-1 space-y-2">{referralStatusData.map((entry, index) => (<div key={entry.name} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="text-sm text-slate-600 dark:text-slate-300 flex-1">{entry.name}</span><span className="text-sm font-semibold text-slate-900 dark:text-white">{entry.value}</span></div>))}</div></div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Referrals by Department</h3>
        <ResponsiveContainer width="100%" height={280}><BarChart data={departmentData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" /><YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" /><Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} /><Bar dataKey="referrals" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Referrals" /></BarChart></ResponsiveContainer>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Referrals</h3><button onClick={() => navigate('/dashboard/referrals')} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button></div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">{referrals.slice(0, 5).map(ref => (<div key={ref.id} className="px-6 py-3 flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">{ref.patient_name?.charAt(0) || 'P'}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-white truncate">{ref.patient_name}</p><p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ref.reason}</p></div><StatusBadge status={ref.status} /></div>))}{referrals.length === 0 && <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No referrals yet</div>}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"><h3 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming Appointments</h3><button onClick={() => navigate('/dashboard/appointments')} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button></div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">{appointments.map(apt => (<div key={apt.id} className="px-6 py-3 flex items-center gap-3"><div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex flex-col items-center justify-center"><span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">{apt.appointment_date?.slice(8)}</span><span className="text-[9px] text-indigo-500 dark:text-indigo-500 uppercase">{new Date(apt.appointment_date + 'T00:00:00').toLocaleString('en', { month: 'short' })}</span></div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-white truncate">{apt.patient_name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{apt.doctor_name} - {apt.appointment_time?.slice(0, 5)}</p></div><StatusBadge status={apt.status} /></div>))}{appointments.length === 0 && <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No upcoming appointments</div>}</div>
        </motion.div>
      </div>
    </div>
  );
}
