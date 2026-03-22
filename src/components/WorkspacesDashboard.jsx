import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Plus, LayoutDashboard, Trash2, ArrowRight, Pencil, Palette, X, GripVertical, Clock, ArrowUpDown } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/journalUtils';

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

export default function WorkspacesDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('theme-midnight');
  
  // Lobby-wide Theme
  const [lobbyTheme, setLobbyTheme] = useState(() => localStorage.getItem('lobby_theme') || 'theme-midnight');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  
  // Apply theme to lobby body
  useEffect(() => {
    localStorage.setItem('lobby_theme', lobbyTheme);
    document.body.className = lobbyTheme;
  }, [lobbyTheme]);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTheme, setEditTheme] = useState('theme-midnight');

  // Sorting state
  const [sortMethod, setSortMethod] = useState(() => localStorage.getItem('ws_sort_method') || 'position');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const sortWorkspaces = (list, method) => {
    const sorted = [...list];
    if (method === 'createdAt' || method === 'updatedAt') {
      return sorted.sort((a, b) => new Date(b[method] || 0) - new Date(a[method] || 0));
    }
    if (method === 'name') {
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    // Default: position
    return sorted.sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  useEffect(() => {
    localStorage.setItem('ws_sort_method', sortMethod);
    setWorkspaces(prev => sortWorkspaces(prev, sortMethod));
  }, [sortMethod]);

  // Fetch workspaces owned by the user or where user is a sub-admin
  const fetchWorkspaces = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const qOwner = query(collection(db, 'workspaces'), where('ownerId', '==', currentUser.uid));
      const qSubAdmin = query(collection(db, 'workspaces'), where('subAdmins', 'array-contains', currentUser.email?.toLowerCase()));
      
      const [ownerSnap, subAdminSnap] = await Promise.all([getDocs(qOwner), getDocs(qSubAdmin)]);
      
      const fetchedMap = new Map();
      
      ownerSnap.docs.forEach(doc => fetchedMap.set(doc.id, { id: doc.id, ...doc.data() }));
      subAdminSnap.docs.forEach(doc => {
        if (!fetchedMap.has(doc.id)) {
            fetchedMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
      
      const fetched = Array.from(fetchedMap.values());
      setWorkspaces(sortWorkspaces(fetched, sortMethod));
    } catch (err) {
      console.error("Error fetching workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [currentUser]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    console.log("Create clicked with name:", newWorkspaceName);
    
    if (!newWorkspaceName.trim()) {
        alert("Please enter a name first.");
        return;
    }

    try {
      console.log("Generating workspace data...");
      const newId = uuidv4();
      const docRef = doc(db, 'workspaces', newId);
      const now = new Date().toISOString();
      const newWorkspaceData = {
        name: newWorkspaceName.trim(),
        ownerId: currentUser.uid,
        theme: selectedTheme,
        rows: [],
        investors: [],
        subAdmins: [],
        reserveFund: 0,
        createdAt: now,
        updatedAt: now,
        position: workspaces.length,
        ownerName: currentUser.displayName || currentUser.email.split('@')[0],
        ownerEmail: currentUser.email
      };
      
      console.log("Writing to Firestore...", newWorkspaceData);
      await setDoc(docRef, newWorkspaceData);
      console.log("Firestore write resolved!");
      
      const updatedList = [...workspaces, { id: newId, ...newWorkspaceData }];
      setWorkspaces(sortWorkspaces(updatedList, sortMethod));
      setNewWorkspaceName('');
      setSelectedTheme('theme-midnight');
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating workspace:", err);
      alert("Failed to create Journal: " + err.message);
    }
  };

  const handleDeleteWorkspace = async (id, name) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete the Journal: "${name}"? This action cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, 'workspaces', id));
      setWorkspaces(workspaces.filter(w => w.id !== id));
    } catch (err) {
      console.error("Error deleting workspace:", err);
    }
  };

  const handleUpdateWorkspace = async (id) => {
    if (!editName.trim()) return;
    try {
      const docRef = doc(db, 'workspaces', id);
      const now = new Date().toISOString();
      await setDoc(docRef, { 
        name: editName.trim(), 
        theme: editTheme,
        updatedAt: now
      }, { merge: true });

      const updated = workspaces.map(ws => ws.id === id ? { ...ws, name: editName.trim(), theme: editTheme, updatedAt: now } : ws);
      setWorkspaces(sortWorkspaces(updated, sortMethod));
      setEditingId(null);
    } catch (err) {
      console.error("Error updating workspace:", err);
      alert("Failed to update: " + err.message);
    }
  };

  const startEditing = (ws) => {
    setEditingId(ws.id);
    setEditName(ws.name);
    setEditTheme(ws.theme || 'default');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[color:var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] p-6 md:p-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-96 bg-[color:var(--accent-primary)]/5 rounded-b-[100%] blur-3xl pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[color:var(--accent-secondary)]/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-6">
          <div className="animate-in slide-in-from-left-4 duration-500">
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[color:var(--text-primary)] via-[color:var(--text-secondary)] to-[color:var(--text-primary)] bg-clip-text text-transparent tracking-tight">
              My Journals
            </h1>
            <p className="text-[color:var(--text-secondary)] mt-2 font-medium opacity-80">Manage your trading workspaces.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <button
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className="btn bg-[color:var(--bg-tertiary)] hover:bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] text-[color:var(--text-primary)]"
                title="Sort Journals"
              >
                <ArrowUpDown className="w-5 h-5" />
              </button>

              {isSortMenuOpen && (
                <div className="absolute top-14 right-0 w-48 bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-[color:var(--glass-border)] text-[10px] uppercase font-bold text-[color:var(--text-secondary)] px-4 py-2">Sort By</div>
                  <button onClick={() => { setSortMethod('position'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-[color:var(--bg-tertiary)] ${sortMethod === 'position' ? 'bg-[color:var(--bg-tertiary)] text-[color:var(--accent-primary)] font-bold' : 'text-[color:var(--text-secondary)]'}`}>
                    <GripVertical className="w-4 h-4" /> Custom Order
                  </button>
                  <button onClick={() => { setSortMethod('createdAt'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-[color:var(--bg-tertiary)] ${sortMethod === 'createdAt' ? 'bg-[color:var(--bg-tertiary)] text-[color:var(--accent-primary)] font-bold' : 'text-[color:var(--text-secondary)]'}`}>
                    <Plus className="w-4 h-4" /> Date Created
                  </button>
                  <button onClick={() => { setSortMethod('updatedAt'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-[color:var(--bg-tertiary)] ${sortMethod === 'updatedAt' ? 'bg-[color:var(--bg-tertiary)] text-[color:var(--accent-primary)] font-bold' : 'text-[color:var(--text-secondary)]'}`}>
                    <Clock className="w-4 h-4" /> Last Modified
                  </button>
                  <button onClick={() => { setSortMethod('name'); setIsSortMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-[color:var(--bg-tertiary)] ${sortMethod === 'name' ? 'bg-[color:var(--bg-tertiary)] text-[color:var(--accent-primary)] font-bold' : 'text-[color:var(--text-secondary)]'}`}>
                    <Pencil className="w-4 h-4" /> Name (A-Z)
                  </button>
                </div>
              )}
            </div>

            <button
               onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
               className="btn bg-[color:var(--bg-tertiary)] hover:bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] text-[color:var(--text-primary)]"
               title="Lobby Theme"
            >
               <Palette className="w-5 h-5" />
            </button>

            {isThemeMenuOpen && (
              <div className="absolute top-24 right-4 md:right-32 w-48 bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setLobbyTheme(theme.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-[color:var(--bg-tertiary)] transition-colors ${lobbyTheme === theme.id ? 'text-[color:var(--accent-primary)] font-medium' : 'text-[color:var(--text-secondary)]'}`}
                    >
                      <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.color }} />
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsCreating(!isCreating)}
              className="btn btn-primary flex-1 md:flex-none whitespace-nowrap shadow-lg shadow-[color:var(--accent-primary)]/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Journal
            </button>
            <button
              onClick={logout}
              className="btn bg-[color:var(--bg-tertiary)] hover:bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] flex-1 md:flex-none text-[color:var(--text-primary)]"
            >
              Sign out
            </button>
          </div>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateWorkspace} className="glass-panel p-6 mb-8 animate-in fly-in-from-top-4 duration-300 border-l-4 border-l-[color:var(--accent-primary)]">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Create New Trading Journal</h2>
               <button type="button" onClick={() => setIsCreating(false)} className="text-[color:var(--text-secondary)] hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-[color:var(--text-secondary)] tracking-wider mb-2 block">Journal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Prop Firm Challenge #1"
                  value={newWorkspaceName}
                  onChange={e => setNewWorkspaceName(e.target.value)}
                  className="w-full bg-[color:var(--bg-tertiary)]/50 border border-[color:var(--glass-border)] rounded-lg p-3 text-[color:var(--text-primary)] focus:ring-2 focus:ring-[color:var(--accent-primary)] outline-none"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-[color:var(--text-secondary)] tracking-wider mb-2 block">Choose Theme</label>
                <div className="flex flex-wrap gap-3 p-3 bg-[color:var(--bg-tertiary)]/30 rounded-xl border border-[color:var(--glass-border)]">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`group relative w-10 h-10 rounded-xl border-2 transition-all ${selectedTheme === theme.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                      style={{ backgroundColor: theme.color }}
                      title={theme.label}
                    >
                      {selectedTheme === theme.id && (
                      <span className="absolute inset-0 m-auto text-white w-5 h-5 flex items-center justify-center font-black drop-shadow-md">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button type="button" onClick={handleCreateWorkspace} className="btn btn-primary w-full sm:w-auto h-[50px] px-8 font-bold">
                  Create Journal
                </button>
              </div>
            </div>
          </form>
        )}

        <Reorder.Group
          axis="y"
          values={workspaces}
          onReorder={async (newOrder) => {
            if (sortMethod !== 'position') return; // Only allow drag in Custom mode
            setWorkspaces(newOrder);
            
            // Push position updates to Firestore (throttled/batched ideally)
            const updates = newOrder.map(async (ws, index) => {
              if (ws.position !== index) {
                 const docRef = doc(db, 'workspaces', ws.id);
                 return setDoc(docRef, { position: index }, { merge: true });
              }
            });
            await Promise.all(updates);
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {workspaces.map(ws => {
            const rowCount = ws.rows?.length || 0;
            const investorCount = ws.investors?.length || 0;
            const totalFund = (ws.investors?.reduce((sum, inv) => sum + inv.capital, 0) || 0) + (ws.reserveFund || 0);
            const totalNetPnL = (ws.rows || []).reduce((sum, row) => sum + (parseFloat(row.pnl) || 0), 0);

            return (
              <Reorder.Item
                key={ws.id}
                value={ws}
                dragListener={sortMethod === 'position'}
                className={`glass-panel p-0 group flex flex-col hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ${ws.theme || 'theme-midnight'} border-2 border-transparent hover:border-[color:var(--accent-primary)]/30 overflow-hidden relative`}
              >
                <div className="p-6 md:p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      {sortMethod === 'position' && (
                        <div className="cursor-grab active:cursor-grabbing p-1 text-[color:var(--text-secondary)] opacity-40 hover:opacity-100 transition-opacity">
                          <GripVertical className="w-5 h-5" />
                        </div>
                      )}
                      <div className="p-4 bg-[color:var(--accent-primary)]/10 rounded-2xl text-[color:var(--accent-primary)] shadow-inner">
                        <LayoutDashboard className="w-6 h-6" />
                      </div>
                    </div>
                    {ws.ownerId === currentUser.uid && !editingId && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => startEditing(ws)}
                          className="text-[color:var(--text-secondary)] hover:text-[color:var(--accent-primary)] p-2 rounded-lg transition-colors hover:bg-[color:var(--accent-primary)]/10"
                          title="Rename / Theme"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                          className="text-[color:var(--text-secondary)] hover:text-red-400 p-2 rounded-lg transition-colors hover:bg-red-500/10"
                          title="Delete Journal"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingId === ws.id ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-[color:var(--bg-tertiary)] border border-[color:var(--glass-border)] rounded-lg p-2 text-sm text-[color:var(--text-primary)] focus:ring-1 focus:ring-[color:var(--accent-primary)] outline-none"
                          autoFocus
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {THEMES.map(theme => (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => setEditTheme(theme.id)}
                              className={`w-7 h-7 rounded-lg border transition-all ${editTheme === theme.id ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                              style={{ backgroundColor: theme.color }}
                              title={theme.label}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateWorkspace(ws.id)} className="btn btn-primary !py-1.5 !px-4 text-xs">Save</button>
                        <button onClick={() => setEditingId(null)} className="btn btn-ghost !py-1.5 !px-4 text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-[color:var(--text-primary)] truncate" title={ws.name}>
                            {ws.name}
                          </h3>
                          {ws.ownerId !== currentUser.uid && (
                              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Sub-Admin</span>
                          )}
                      </div>
                      <p className="text-xs text-[color:var(--text-secondary)] font-mono mb-6">
                        ID: {ws.id.split('-')[0]}...
                      </p>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Net P/L</p>
                          <p className={`font-bold ${totalNetPnL < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {formatCurrency(totalNetPnL)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Trades</p>
                          <p className="font-medium text-[color:var(--text-primary)]">{rowCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Fund Size</p>
                          <p className="font-medium text-[color:var(--text-primary)]">{formatCurrency(totalFund)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Investors</p>
                          <p className="font-medium text-[color:var(--text-primary)]">{investorCount}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-[color:var(--glass-border)] p-4 bg-[color:var(--bg-tertiary)]/30 group-hover:bg-[color:var(--accent-primary)]/5 transition-colors rounded-b-2xl mt-auto">
                  <button
                    onClick={() => navigate(`/workspace/${ws.id}`)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[color:var(--text-primary)] group-hover:text-[color:var(--accent-primary)] transition-colors"
                  >
                    Enter Workspace
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </Reorder.Item>
            );
          })}

          {workspaces.length === 0 && !isCreating && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-[color:var(--glass-border)] rounded-2xl">
              <LayoutDashboard className="w-12 h-12 mx-auto text-[color:var(--text-secondary)] mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-[color:var(--text-primary)] mb-2">No Journals Found</h3>
              <p className="text-[color:var(--text-secondary)] mb-6">Create your first trading journal to start logging trades.</p>
              <button onClick={() => setIsCreating(true)} className="btn btn-primary mx-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Journal
              </button>
            </div>
          )}
        </Reorder.Group>
      </div>
    </div>
  );
}
