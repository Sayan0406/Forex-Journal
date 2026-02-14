import { useState, useEffect } from 'react';
import { LayoutDashboard, Palette, Type, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';
import JournalTable from './components/JournalTable';
import InvestorDashboard from './components/InvestorDashboard';
import Watermark from './components/Watermark';
import { calculateTotals } from './utils/journalUtils';

const THEMES = [
  { id: 'default', label: 'Midnight', color: '#0f172a' },
  { id: 'theme-forest', label: 'Forest', color: '#064e3b' },
  { id: 'theme-sunset', label: 'Sunset', color: '#881337' },
  { id: 'theme-light', label: 'Light', color: '#f1f5f9' },
  { id: 'theme-pitch-black', label: 'Pitch Black', color: '#000000' },
  { id: 'theme-cyberpunk', label: 'Cyberpunk', color: '#1a002e' },
  { id: 'theme-coffee', label: 'Coffee', color: '#3f2f29' },
  { id: 'theme-nord', label: 'Nord', color: '#2e3440' },
  { id: 'theme-retro', label: 'Retro', color: '#1c1c1c' },
];

function App() {
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('theme') || 'default');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const [rows, setRows] = useState(() => {
    try {
      const saved = localStorage.getItem('journal_rows');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse journal_rows", e);
      return [];
    }
  });

  const [investors, setInvestors] = useState(() => {
    try {
      const saved = localStorage.getItem('investor_profiles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse investor_profiles", e);
      return [];
    }
  });

  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('zoom_level');
    if (saved) return Number(saved);
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches ? 125 : 100;
  });

  // Theme Effect
  useEffect(() => {
    localStorage.setItem('theme', currentTheme);
    document.body.className = currentTheme === 'default' ? '' : currentTheme;
  }, [currentTheme]);

  // Zoom Effect
  useEffect(() => {
    localStorage.setItem('zoom_level', zoomLevel);
    document.documentElement.style.fontSize = `${zoomLevel}%`;
  }, [zoomLevel]);

  // Sync Rows to LocalStorage
  useEffect(() => {
    localStorage.setItem('journal_rows', JSON.stringify(rows));
  }, [rows]);

  // Sync Investors to LocalStorage
  useEffect(() => {
    localStorage.setItem('investor_profiles', JSON.stringify(investors));
  }, [investors]);

  const [reserveFund, setReserveFund] = useState(() => Number(localStorage.getItem('reserve_fund')) || 0);

  // Sync Reserve Fund
  useEffect(() => {
    localStorage.setItem('reserve_fund', reserveFund);
  }, [reserveFund]);

  const { pnl: totalPnL } = calculateTotals(rows);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[color:var(--bg-primary)]">
      <div className="container mx-auto px-4 max-w-7xl">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[color:var(--accent-primary)]/20 rounded-lg border border-[color:var(--accent-primary)]/30">
              <LayoutDashboard className="text-[color:var(--accent-primary)] w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[color:var(--text-primary)] to-[color:var(--text-secondary)] bg-clip-text text-transparent">
                Forex Journal
              </h1>
              <p className="text-[color:var(--text-secondary)] text-sm">Professional Trade Tracker</p>
            </div>
          </div>

          <div className="flex gap-2 items-center">

            <input
              type="file"
              id="restore-file"
              className="hidden"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const data = JSON.parse(event.target.result);
                    if (data.rows && data.investors && data.columns) {
                      if (confirm('This will overwrite your current data. Are you sure?')) {
                        localStorage.setItem('journal_rows', JSON.stringify(data.rows));
                        localStorage.setItem('investor_profiles', JSON.stringify(data.investors));
                        localStorage.setItem('journal_columns', JSON.stringify(data.columns));
                        window.location.reload();
                      }
                    } else {
                      alert('Invalid backup file format.');
                    }
                  } catch (err) {
                    alert('Failed to read backup file.');
                  }
                };
                reader.readAsText(file);
                e.target.value = ''; // Reset
              }}
            />
            <button
              onClick={() => document.getElementById('restore-file').click()}
              className="btn btn-ghost !px-4 !py-2 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
              title="Restore Data"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                <span className="hidden sm:inline">Restore</span>
              </div>
            </button>

            <button
              onClick={() => {
                const data = {
                  rows: JSON.parse(localStorage.getItem('journal_rows') || '[]'),
                  investors: JSON.parse(localStorage.getItem('investor_profiles') || '[]'),
                  columns: JSON.parse(localStorage.getItem('journal_columns') || '[]') // Best effort current state
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `forex_journal_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="btn btn-ghost !px-4 !py-2 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
              title="Backup Data"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                <span className="hidden sm:inline">Backup</span>
              </div>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="btn btn-ghost !px-4 !py-2"
              >
                <Palette className="w-5 h-5" />
                <span className="hidden sm:inline ml-2">Theme</span>
              </button>

              <AnimatePresence>
                {isThemeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] rounded-lg shadow-xl z-50 overflow-hidden"
                  >
                    <div className="max-h-[300px] overflow-y-auto">
                      {THEMES.map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => {
                            setCurrentTheme(theme.id);
                            setIsThemeMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-[color:var(--bg-tertiary)] transition-colors ${currentTheme === theme.id ? 'text-[color:var(--accent-primary)] font-medium' : 'text-[color:var(--text-secondary)]'}`}
                        >
                          <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.color }} />
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Text Size Controls */}
            <div className="hidden md:flex items-center gap-1 bg-[color:var(--bg-secondary)]/40 p-1 rounded-lg border border-[color:var(--glass-border)]">
              <button
                onClick={() => setZoomLevel(prev => Math.max(70, prev - 5))}
                className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-tertiary)] rounded-md transition-colors"
                title="Decrease Text Size"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 px-1 min-w-[3ch] justify-center text-xs font-medium text-[color:var(--text-secondary)]">
                <Type className="w-3 h-3" />
                <span>{zoomLevel}%</span>
              </div>
              <button
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 5))}
                className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-tertiary)] rounded-md transition-colors"
                title="Increase Text Size"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="pb-12 space-y-6">
          <InvestorDashboard
            totalPnL={totalPnL}
            investors={investors}
            setInvestors={setInvestors}
            rows={rows}
            reserveFund={reserveFund}
            setReserveFund={setReserveFund}
          />
          <JournalTable
            rows={rows}
            setRows={setRows}
            investors={investors}
          />
        </main>
      </div>
      <Watermark />
    </div>
  )
}

export default App
