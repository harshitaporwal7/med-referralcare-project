import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, FileText } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Medical reports and documentation</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Reports Module</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            The reports functionality requires additional implementation. Reports can be generated from referral data and patient records.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Reports</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">0</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">This Month</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">0</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pending Review</p>
            </div>
          </div>
        </div>
      </motion.div>

      <EmptyState
        icon={<BarChart3 className="w-8 h-8" />}
        title="Reports coming soon"
        description="This feature is under development. Check back later for medical reports and analytics."
      />
    </div>
  );
}
