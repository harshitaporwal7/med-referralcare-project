import { useTheme } from '../../context/ThemeContext';
import { Settings, Sun, Moon, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">System configuration</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Dark Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Toggle dark/light theme</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full transition-all ${darkMode ? 'bg-blue-600' : 'bg-slate-300'} relative`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${darkMode ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">System Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Application', value: 'ReferralCare v1.0' },
            { label: 'Database', value: 'MySQL' },
            { label: 'Auth Provider', value: 'JWT' },
            { label: 'Backend', value: 'Express.js' },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
