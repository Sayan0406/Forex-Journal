import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Plus, LayoutDashboard, Trash2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/journalUtils';

export default function WorkspacesDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

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
      setWorkspaces(fetched.sort((a,b) => a.name.localeCompare(b.name)));
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
      const newWorkspaceData = {
        name: newWorkspaceName.trim(),
        ownerId: currentUser.uid,
        rows: [],
        investors: [],
        subAdmins: [],
        reserveFund: 0,
        createdAt: new Date().toISOString()
      };
      
      console.log("Writing to Firestore...", newWorkspaceData);
      await setDoc(docRef, newWorkspaceData);
      console.log("Firestore write resolved!");
      
      setWorkspaces([...workspaces, { id: newId, ...newWorkspaceData }]);
      setNewWorkspaceName('');
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[color:var(--text-primary)] to-[color:var(--text-secondary)] bg-clip-text text-transparent">
              My Journals
            </h1>
            <p className="text-[color:var(--text-secondary)] mt-2">Manage your trading workspaces.</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
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
            <h2 className="text-lg font-bold text-[color:var(--text-primary)] mb-4">Create New Trading Journal</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. Prop Firm Challenge #1"
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                className="flex-1 bg-[color:var(--bg-tertiary)]/50 border border-[color:var(--glass-border)] rounded-lg p-3 text-[color:var(--text-primary)] focus:ring-2 focus:ring-[color:var(--accent-primary)] outline-none"
                autoFocus
                required
              />
              <button type="button" onClick={handleCreateWorkspace} className="btn btn-primary h-[50px] px-8 font-bold">
                Create
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map(ws => {
            const rowCount = ws.rows?.length || 0;
            const investorCount = ws.investors?.length || 0;
            const totalFund = (ws.investors?.reduce((sum, inv) => sum + inv.capital, 0) || 0) + (ws.reserveFund || 0);

            return (
              <div key={ws.id} className="glass-panel p-0 group flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:shadow-[color:var(--accent-primary)]/10 transition-all duration-300">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-[color:var(--accent-primary)]/10 rounded-xl text-[color:var(--accent-primary)]">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    {ws.ownerId === currentUser.uid && (
                        <button
                        onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                        className="text-[color:var(--text-secondary)] hover:text-red-400 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-500/10"
                        title="Delete Journal"
                        >
                        <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                  </div>
                  
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Fund Size</p>
                      <p className="font-medium text-[color:var(--text-primary)]">{formatCurrency(totalFund)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Investors</p>
                      <p className="font-medium text-[color:var(--text-primary)]">{investorCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Trades Logged</p>
                      <p className="font-medium text-[color:var(--text-primary)]">{rowCount}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[color:var(--glass-border)] p-4 bg-[color:var(--bg-tertiary)]/30 group-hover:bg-[color:var(--accent-primary)]/5 transition-colors rounded-b-2xl">
                  <button
                    onClick={() => navigate(`/workspace/${ws.id}`)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[color:var(--text-primary)] group-hover:text-[color:var(--accent-primary)] transition-colors"
                  >
                    Enter Workspace
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
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
        </div>
      </div>
    </div>
  );
}
