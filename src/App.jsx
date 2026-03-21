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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const THEMES = [
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
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
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
          if (data.ownerName) setOwnerName(data.ownerName);
          if (data.ownerEmail) setOwnerEmail(data.ownerEmail);

          // Backfill owner metadata if missing and user is master
          if (role === 'master' && !data.ownerName) {
            const name = currentUser.displayName || currentUser.email.split('@')[0];
            const email = currentUser.email;
            updateDoc(docRef, { ownerName: name, ownerEmail: email });
            setOwnerName(name);
            setOwnerEmail(email);
          }
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
          subAdmins: subAdminsArray,
          updatedAt: new Date().toISOString()
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
            <div className="p-2 bg-[color:var(--accent-primary)]/10 rounded-lg border border-[color:var(--accent-primary)]/20">
              <LayoutDashboard className="w-8 h-8 text-[color:var(--accent-primary)]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black bg-gradient-to-r from-[color:var(--text-primary)] via-[color:var(--text-secondary)] to-[color:var(--text-primary)] bg-clip-text text-transparent tracking-tight">
                  {workspaceName}
                </h1>
                {userRole === 'master' && (
                  <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/20 tracking-widest uppercase shadow-sm shadow-amber-500/5">Master Trader</span>
                )}
                {userRole === 'subadmin' && (
                  <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded border border-indigo-500/20 tracking-widest uppercase shadow-sm shadow-indigo-500/5">Sub-Admin</span>
                )}
              </div>
              {ownerName && userRole === 'subadmin' && (
                <p className="text-[10px] text-[color:var(--text-secondary)] opacity-70 font-medium">Trader: {ownerName}</p>
              )}
              <p className="text-[color:var(--text-secondary)] text-sm">Professional Trading Journal</p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
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
            reserveFund={reserveFund} 
            setReserveFund={setReserveFund} 
            ownerName={ownerName}
            ownerEmail={ownerEmail}
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
