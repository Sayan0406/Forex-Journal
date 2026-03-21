import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Palette, Type, Minus, Plus, LogOut, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';
import JournalTable from './components/JournalTable';
import InvestorDashboard from './components/InvestorDashboard';
import Watermark from './components/Watermark';
import { calculateTotals } from './utils/journalUtils';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Portal from './components/Portal';
import WorkspacesDashboard from './components/WorkspacesDashboard';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const THEMES = [
  { id: 'theme-midnight', label: 'Midnight', color: '#0f172a' },
  { id: 'theme-forest', label: 'Forest', color: '#064e3b' },
  { id: 'theme-sunset', label: 'Sunset', color: '#881337' },
  { id: 'theme-light', label: 'Light', color: '#f1f5f9' },
  { id: 'theme-pitch-black', label: 'Pitch Black', color: '#000000' },
  { id: 'theme-cyberpunk', label: 'Cyberpunk', color: '#1a002e' },
  { id: 'theme-coffee', label: 'Coffee', color: '#3f2f29' },
  { id: 'theme-nord', label: 'Nord', color: '#2e3440' },
  { id: 'theme-retro', label: 'Retro', color: '#1c1c1c' },
];

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function RootRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Navigate to="/workspaces" replace />;
}

function AdminLayout() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [currentTheme, setCurrentTheme] = useState('theme-midnight');
  const [workspaceName, setWorkspaceName] = useState('Forex Journal');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('investor');

  // Core Data States
  const [rows, setRows] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [reserveFund, setReserveFund] = useState(0);
  
  // App Loader
  const [loadingData, setLoadingData] = useState(true);

  // Zoom Level Management
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('zoom_level');
    if (saved) return Number(saved);
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches ? 125 : 100;
  });

  // Pull Data From Firestore
  useEffect(() => {
    async function loadFirebaseData() {
      if (!currentUser || !workspaceId) {
        setLoadingData(false);
        return;
      }
      try {
        const docRef = doc(db, 'workspaces', workspaceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          let role = 'investor';
          if (currentUser.uid === data.ownerId) {
            role = 'master';
          } else {
            const me = data.investors?.find(inv => inv.email?.toLowerCase() === currentUser.email?.toLowerCase());
            if (me && me.isAdmin) {
              role = 'subadmin';
            } else if (me) {
              navigate(`/portal/${workspaceId}`);
              return;
            } else {
              navigate('/login');
              return;
            }
          }
          setUserRole(role);

          if (data.rows) setRows(data.rows);
          if (data.investors) setInvestors(data.investors);
          if (data.reserveFund !== undefined) setReserveFund(data.reserveFund);
          if (data.theme) setCurrentTheme(data.theme);
          if (data.name) setWorkspaceName(data.name);
        } else {
          // Navigate to lobby if workspace id is broken or absent
          navigate('/workspaces');
        }
      } catch (err) {
        console.error("Failed pulling from Firestore:", err);
      } finally {
        setLoadingData(false);
      }
    }
    
    loadFirebaseData();
  }, [currentUser, workspaceId]);

  // Sync Data back to Firestore Reactively
  useEffect(() => {
    if (loadingData || !currentUser || !workspaceId) return; // Prevent overwriting cloud data immediately on mount
    
    // Sub-admins and masters can write data to the workspace
    if (userRole !== 'master' && userRole !== 'subadmin') return;

    const timeout = setTimeout(async () => {
      try {
        const docRef = doc(db, 'workspaces', workspaceId);
        
        const subAdminsArray = investors
            .filter(i => i.isAdmin && i.email)
            .map(i => i.email.toLowerCase());

        await setDoc(docRef, {
          rows,
          investors,
          reserveFund,
          subAdmins: subAdminsArray
        }, { merge: true });
      } catch (err) {
        console.error("Failed saving to Firestore:", err);
      }
    }, 1000); // Debounce saves by 1 second to avoid massive write spikes
    
    return () => clearTimeout(timeout);
  }, [rows, investors, reserveFund, currentUser, loadingData]);

  // Theme & Zoom Effects
  useEffect(() => {
    document.body.className = currentTheme;
    if (workspaceName !== 'Forex Journal') {
      document.title = `${workspaceName} - Admin Dashboard`;
    }
  }, [currentTheme, workspaceName]);

  const handleThemeChange = async (themeId) => {
    setCurrentTheme(themeId);
    if (userRole === 'master') {
      try {
        const docRef = doc(db, 'workspaces', workspaceId);
        await setDoc(docRef, { theme: themeId }, { merge: true });
      } catch (err) {
        console.error("Failed saving theme to cloud:", err);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('zoom_level', zoomLevel);
    document.documentElement.style.fontSize = `${zoomLevel}%`;
  }, [zoomLevel]);

  const { pnl: totalPnL } = calculateTotals(rows);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[color:var(--bg-primary)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1800px]">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/workspaces')}
              className="p-2 bg-[color:var(--bg-tertiary)] hover:bg-[color:var(--bg-secondary)] rounded-lg border border-[color:var(--glass-border)] text-[color:var(--text-secondary)] hover:text-[color:var(--accent-primary)] transition-all"
              title="Back to Journals"
            >
              <Home className="w-5 h-5" />
            </button>
            <div className="p-2 bg-[color:var(--accent-primary)]/20 rounded-lg border border-[color:var(--accent-primary)]/30">
              <LayoutDashboard className="text-[color:var(--accent-primary)] w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[color:var(--text-primary)] to-[color:var(--text-secondary)] bg-clip-text text-transparent">
                {workspaceName}
              </h1>
              <p className="text-[color:var(--text-secondary)] text-sm">Professional Trading Journal</p>
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

                    // Validate: strict check removed, check for essential data
                    if (Array.isArray(data.rows) || Array.isArray(data.investors)) {
                      if (confirm('This will overwrite your current data. Are you sure?')) {
                        if (data.rows) localStorage.setItem('journal_rows', JSON.stringify(data.rows));
                        if (data.investors) localStorage.setItem('investor_profiles', JSON.stringify(data.investors));
                        if (data.columns) localStorage.setItem('journal_columns', JSON.stringify(data.columns));
                        if (data.reserveFund !== undefined) localStorage.setItem('reserve_fund', JSON.stringify(data.reserveFund));

                        window.location.reload();
                      }
                    } else {
                      alert('Invalid backup file format. Missing rows or investors data.');
                    }
                  } catch (err) {
                    alert('Failed to read backup file. Invalid JSON.');
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

            <button
              onClick={logout}
              className="btn btn-ghost !px-4 !py-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
              title="Sign Out"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
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
                            handleThemeChange(theme.id);
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

        <main className="pb-12 space-y-6 relative">
          {loadingData && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[color:var(--bg-primary)]/50 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[color:var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[color:var(--text-secondary)] font-medium tracking-wide animate-pulse">Syncing with Cloud Database...</span>
              </div>
            </div>
          )}
          
          <InvestorDashboard
            userRole={userRole}
            workspaceId={workspaceId}
            totalPnL={totalPnL}
            investors={investors}
            setInvestors={setInvestors}
            rows={rows}
            reserveFund={reserveFund}
            setReserveFund={setReserveFund}
          />
          <JournalTable
            userRole={userRole}
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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/workspaces" element={<PrivateRoute><WorkspacesDashboard /></PrivateRoute>} />
          <Route 
            path="/workspace/:workspaceId" 
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            } 
          />
          <Route path="/portal/:traderId" element={<PrivateRoute><Portal /></PrivateRoute>} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
