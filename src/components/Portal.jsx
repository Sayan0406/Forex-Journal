import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { calculateTotals } from '../utils/journalUtils';
import { LayoutDashboard, LogOut, Wallet, PieChart, TrendingUp, DollarSign, Palette, User, FileText } from 'lucide-react';
import JournalTable from './JournalTable';
import { THEMES } from '../App';

export default function Portal() {
    const { traderId } = useParams();
    const { currentUser, logout } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [investorData, setInvestorData] = useState(null);
    const [journalStats, setJournalStats] = useState(null);
    const [theme, setTheme] = useState('theme-midnight');
    const [workspaceName, setWorkspaceName] = useState('Investor Portal');
    const [rows, setRows] = useState([]);
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

    useEffect(() => {
        async function fetchTraderData() {
            if (!currentUser || !traderId) return;
            try {
                const docRef = doc(db, 'workspaces', traderId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const me = data.investors?.find(inv => inv.email?.toLowerCase() === currentUser.email?.toLowerCase());
                    
                    if (me) {
                        setInvestorData(me);
                        if (data.theme) setTheme(data.theme);
                        if (data.name) setWorkspaceName(data.name);
                        if (data.rows) setRows(data.rows);
                        const { pnl } = calculateTotals(data.rows || []);
                        
                        const splitPercentage = parseFloat(me.profitPercent || 0);
                        const individualPnl = (pnl * (splitPercentage / 100));
                        const totalAccountValue = (parseFloat(me.capital) + individualPnl);
                        
                        setJournalStats({
                            individualPnl,
                            capital: parseFloat(me.capital),
                            currentValue: totalAccountValue,
                            percentage: splitPercentage
                        });
                    } else {
                        setError(`You (${currentUser.email}) are not authorized as an investor on this portfolio.`);
                    }
                } else {
                    setError('Portfolio not found.');
                }
            } catch (err) {
                console.error(err);
                setError('Error loading portfolio data.');
            } finally {
                setLoading(false);
            }
        }
        
        fetchTraderData();
    }, [traderId, currentUser]);

    if (!currentUser) return <Navigate to="/login" replace />;

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    useEffect(() => {
        document.body.className = theme;
        if (workspaceName !== 'Investor Portal') {
            document.title = `${workspaceName} - Investor Portal`;
        }
    }, [theme, workspaceName]);

    return (
        <div className="min-h-screen transition-colors duration-300 bg-[color:var(--bg-primary)]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1800px]">
                <header className="mb-6 flex items-center justify-between py-6 gap-4 border-b border-[color:var(--glass-border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[color:var(--accent-primary)]/20 rounded-lg border border-[color:var(--accent-primary)]/30">
                            <LayoutDashboard className="text-[color:var(--accent-primary)] w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-[color:var(--text-primary)] to-[color:var(--text-secondary)] bg-clip-text text-transparent">
                                {workspaceName}
                            </h1>
                            <p className="text-[color:var(--text-secondary)] text-sm">Welcome back, {investorData?.name || currentUser.displayName}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                                className="p-2 bg-[color:var(--bg-tertiary)] hover:bg-[color:var(--bg-secondary)] rounded-lg border border-[color:var(--glass-border)] text-[color:var(--text-secondary)] hover:text-[color:var(--accent-primary)] transition-all"
                                title="Change Theme"
                            >
                                <Palette className="w-5 h-5" />
                            </button>

                            {isThemeMenuOpen && (
                                <div className="absolute top-14 right-0 w-48 bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {THEMES.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setTheme(t.id);
                                                    setIsThemeMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-[color:var(--bg-tertiary)] transition-colors ${theme === t.id ? 'text-[color:var(--accent-primary)] font-medium' : 'text-[color:var(--text-secondary)]'}`}
                                            >
                                                <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: t.color }} />
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={logout} className="btn btn-ghost !px-4 !py-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10">
                            <LogOut className="w-5 h-5 mr-2" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </header>

                <main className="py-8">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="w-10 h-10 border-4 border-[color:var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                            <h3 className="text-xl font-bold mb-2">Access Denied</h3>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-[color:var(--accent-primary)]/20">
                                        <Wallet className="w-5 h-5 text-[color:var(--accent-primary)]" />
                                    </div>
                                    <h3 className="text-sm font-medium text-[color:var(--text-secondary)]">Current Value</h3>
                                </div>
                                <p className="text-3xl font-bold text-[color:var(--text-primary)]">{formatCurrency(journalStats?.currentValue)}</p>
                            </div>

                            <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-[color:var(--text-secondary)]">Net Profit Split</h3>
                                </div>
                                <p className={`text-3xl font-bold ${journalStats?.individualPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {journalStats?.individualPnl >= 0 ? '+' : ''}{formatCurrency(journalStats?.individualPnl)}
                                </p>
                            </div>

                            <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-indigo-500/20">
                                        <PieChart className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-[color:var(--text-secondary)]">Profit Share</h3>
                                </div>
                                <p className="text-3xl font-bold text-indigo-400">{journalStats?.percentage}%</p>
                            </div>

                            <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-slate-500/20">
                                        <DollarSign className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-[color:var(--text-secondary)]">Initial Deposit</h3>
                                </div>
                                <p className="text-3xl font-bold text-slate-300">{formatCurrency(journalStats?.capital)}</p>
                            </div>
                        </div>

                        {/* Journal Table Section */}
                        <div className="mt-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-indigo-500/20">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Trade History</h2>
                            </div>
                            <JournalTable 
                                userRole="investor"
                                rows={rows}
                                setRows={() => {}} // Read-only
                            />
                        </div>

                        {/* Investor Account Section */}
                        <div className="mt-12 mb-20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-[color:var(--accent-primary)]/20">
                                    <User className="w-5 h-5 text-[color:var(--accent-primary)]" />
                                </div>
                                <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Account Details</h2>
                            </div>
                            <div className="bg-[color:var(--bg-secondary)] border border-[color:var(--glass-border)] rounded-2xl p-8 shadow-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-[color:var(--text-primary)]">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Investor Name</span>
                                        <span className="text-lg font-medium">{investorData?.name}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Email Address</span>
                                        <span className="text-lg font-medium">{investorData?.email}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Profit Share %</span>
                                        <span className="text-lg font-medium text-emerald-400">{investorData?.profitPercent}%</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Capital Invested</span>
                                        <span className="text-lg font-medium">{formatCurrency(investorData?.capital)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Current P/L Split</span>
                                        <span className={`text-lg font-bold ${journalStats?.individualPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatCurrency(journalStats?.individualPnl)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase font-bold text-[color:var(--text-secondary)] tracking-wider">Account ID</span>
                                        <span className="text-lg font-mono text-[color:var(--text-secondary)]">{currentUser.uid.slice(0, 8)}...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
