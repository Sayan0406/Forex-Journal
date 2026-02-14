import { useState, useMemo } from 'react';
import { formatCurrency, groupTrades } from '../utils/journalUtils';
import { Users, PieChart, TrendingUp, Wallet, Plus, Trash2, Phone, QrCode, Pencil, AlertCircle, Save, BarChart3, X, ChevronDown, ChevronRight, Calendar, Settings, Mail, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

// ... (StatCard, ReserveFundModal, ProfitSplitModal, StatsModal components remain unchanged) ...
// Wait, I need to keep the imports and top level components. 
// I will just replace the MAIN component `InvestorDashboard` and its imports/helper functions if needed.
// Actually, to be safe, I should use `multi_replace_file_content` to target specific blocks or replace the whole file if I'm confident. 
// The file is getting large (~500 lines). 
// Let's use `replace_file_content` on the `InvestorDashboard` component part.

// I'll start by adding the imports.
// Then I'll update the `InvestorDashboard` component.

/* 
    Plan:
    1. Update imports to include Mail, Download.
    2. Update `newInvestor` state to include `email`. (It's not there locally, I need to add it).
    3. Update `handleEdit` to set email.
    4. Update form to include Email input.
    5. Update list to show Email.
    6. Add `handleMailBackup` function.
    7. Add "Mail Backup" button at the bottom.
*/

// I'll do this in chunks using `multi_replace_file_content`.

// Chunk 1: Imports
// Chunk 2: Component State & Handlers
// Chunk 3: Form
// Chunk 4: List
// Chunk 5: Bottom Button


const StatCard = ({ title, value, icon: Icon, subtext, highlight, onAction, actionIcon: ActionIcon }) => (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-[color:var(--bg-secondary)] border-[color:var(--accent-primary)]/30' : 'bg-[color:var(--bg-secondary)]/40 border-[color:var(--glass-border)]'} flex flex-col gap-2 relative overflow-hidden group hover:border-[color:var(--glass-border)] transition-colors`}>
        <div className="flex justify-between items-start z-10">
            <span className="text-[color:var(--text-secondary)] text-sm font-medium">{title}</span>
            <div className="flex items-center gap-2">
                {onAction && ActionIcon && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(); }}
                        className="text-[color:var(--text-secondary)] hover:text-[color:var(--accent-primary)] transition-colors"
                        title="Configure"
                    >
                        <ActionIcon className="w-4 h-4" />
                    </button>
                )}
                <Icon className={`w-4 h-4 ${highlight ? 'text-[color:var(--accent-primary)]' : 'text-[color:var(--text-secondary)]'}`} />
            </div>
        </div>
        <div className="z-10">
            <span className={`text-2xl font-bold tracking-tight ${formatCurrency(value) < 0 ? 'text-rose-400' : 'text-[color:var(--text-primary)]'}`}>
                {title.includes('%') ? `${value}%` : formatCurrency(value)}
            </span>
            {subtext && <p className="text-xs text-[color:var(--text-secondary)] mt-1">{subtext}</p>}
        </div>
        {highlight && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[color:var(--accent-primary)]/10 rounded-full blur-2xl group-hover:bg-[color:var(--accent-primary)]/20 transition-colors" />}
    </div>
);

const ProfitSplitModal = ({ investors, setInvestors, onClose }) => {
    const [localInvestors, setLocalInvestors] = useState(
        investors.map(inv => ({ ...inv }))
    );

    const totalInvestorShare = localInvestors.reduce((sum, inv) => sum + (parseFloat(inv.profitPercent) || 0), 0);
    const traderShare = 100 - totalInvestorShare;

    const handleChange = (id, val) => {
        setLocalInvestors(prev => prev.map(inv =>
            inv.id === id ? { ...inv, profitPercent: parseFloat(val) || 0 } : inv
        ));
    };

    const handleSave = () => {
        if (totalInvestorShare > 100) {
            alert(`Total investor share (${totalInvestorShare}%) cannot exceed 100%`);
            return;
        }
        setInvestors(localInvestors);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[color:var(--bg-secondary)] w-full max-w-md rounded-2xl border border-[color:var(--glass-border)] shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-[color:var(--glass-border)] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Profit Split</h2>
                        <p className="text-[color:var(--text-secondary)] text-sm">Adjust how profits are distributed</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[color:var(--bg-tertiary)] rounded-full transition-colors">
                        <X className="w-5 h-5 text-[color:var(--text-secondary)]" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="bg-[color:var(--bg-tertiary)]/30 p-4 rounded-xl border border-[color:var(--glass-border)] flex justify-between items-center">
                        <span className="text-[color:var(--text-primary)] font-medium">Trader's Share</span>
                        <span className={`text-xl font-bold ${traderShare < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {traderShare.toFixed(2)}%
                        </span>
                    </div>

                    <div className="space-y-3">
                        {localInvestors.map(inv => (
                            <div key={inv.id} className="flex justify-between items-center gap-4">
                                <span className="text-sm text-[color:var(--text-secondary)] flex-1 truncate" title={inv.name}>{inv.name}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={inv.profitPercent}
                                        onChange={(e) => handleChange(inv.id, e.target.value)}
                                        className="w-20 bg-[color:var(--bg-primary)] border border-[color:var(--glass-border)] rounded px-2 py-1 text-right text-sm text-[color:var(--text-primary)] focus:ring-1 focus:ring-[color:var(--accent-primary)] outline-none"
                                        step="0.1"
                                    />
                                    <span className="text-[color:var(--text-secondary)] text-sm">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-[color:var(--glass-border)] flex justify-end gap-2">
                    <button onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary text-sm"
                        disabled={totalInvestorShare > 100}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// ... StatsModal component code (simulated reuse or just assume it is there unchanged if I don't touch it) ... 
// Wait, I am replacing a chunk. I need to be careful not to delete StatsModal if it's in the chunk range.
// The previous tool output shows StatsModal ends around line 130ish or so?
// Actually I need to check line numbers. 
// Step 414 output: `StatsModal` is NOT there yet in the file dump.
// Step 429 output: I added `StatsModal`. 
// I need to view the file again to be safe about line numbers before doing a big replace.
// But I can see Step 429 added `StatsModal` before `export default function InvestorDashboard`.
// The `StatCard` definition is at the top.
// I will replace `StatCard` definition and add `ProfitSplitModal` right after it.
// Then I will update `InvestorDashboard` to use it.

// Let's inspect the file first to get exact lines.

const StatsModal = ({ investor, rows, onClose }) => {
    const [activeTab, setActiveTab] = useState('monthly'); // 'yearly', 'monthly', 'weekly'

    const stats = useMemo(() => {
        const grouped = groupTrades(rows); // Returns months with weeks

        // Aggregate by Year
        const yearly = {};
        grouped.forEach(month => {
            const year = month.key.split('-')[0];
            if (!yearly[year]) {
                yearly[year] = { key: year, label: year, pnl: 0, count: 0 };
            }
            yearly[year].pnl += month.stats.pnl;
            yearly[year].count += month.stats.count;
        });

        // Flatten Monthly
        const monthly = grouped.map(m => ({
            key: m.key,
            label: m.label,
            pnl: m.stats.pnl,
            count: m.stats.count
        }));

        // Flatten Weekly
        const weekly = [];
        grouped.forEach(m => {
            m.children.forEach(w => {
                weekly.push({
                    key: w.key,
                    label: `${m.label} - ${w.label}`,
                    pnl: w.stats.pnl,
                    count: w.stats.count
                });
            });
        });

        return {
            yearly: Object.values(yearly).sort((a, b) => b.key.localeCompare(a.key)),
            monthly: monthly.reverse(), // Newest first
            weekly: weekly.reverse()
        };
    }, [rows]);

    const renderTable = (data, labelHeader) => (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[color:var(--bg-tertiary)]/50 text-[color:var(--text-secondary)] text-xs uppercase">
                    <tr>
                        <th className="p-3 rounded-l-lg">{labelHeader}</th>
                        <th className="p-3 text-right">Trades</th>
                        <th className="p-3 text-right">Total P/L</th>
                        <th className="p-3 text-right rounded-r-lg">Inv. Share ({investor.profitPercent}%)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--glass-border)]">
                    {data.map(item => {
                        const share = item.pnl * (investor.profitPercent / 100);
                        return (
                            <tr key={item.key} className="hover:bg-[color:var(--bg-tertiary)]/20 transition-colors">
                                <td className="p-3 font-medium text-[color:var(--text-primary)]">{item.label}</td>
                                <td className="p-3 text-right text-[color:var(--text-secondary)]">{item.count}</td>
                                <td className={`p-3 text-right font-medium ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(item.pnl)}
                                </td>
                                <td className={`p-3 text-right font-bold ${share >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(share)}
                                </td>
                            </tr>
                        );
                    })}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-4 text-center text-[color:var(--text-secondary)]">No data available for this period.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[color:var(--bg-secondary)] w-full max-w-3xl rounded-2xl border border-[color:var(--glass-border)] shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-[color:var(--glass-border)] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{investor.name}'s Performance</h2>
                        <p className="text-[color:var(--text-secondary)] text-sm">Profit Share: <span className="text-[color:var(--accent-primary)]">{investor.profitPercent}%</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[color:var(--bg-tertiary)] rounded-full transition-colors">
                        <X className="w-5 h-5 text-[color:var(--text-secondary)]" />
                    </button>
                </div>

                <div className="p-4 border-b border-[color:var(--glass-border)] flex gap-2 overflow-x-auto">
                    {['yearly', 'monthly', 'weekly'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalized ${activeTab === tab
                                ? 'bg-[color:var(--accent-primary)] text-white'
                                : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-tertiary)]'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'yearly' && renderTable(stats.yearly, "Year")}
                    {activeTab === 'monthly' && renderTable(stats.monthly, "Month")}
                    {activeTab === 'weekly' && renderTable(stats.weekly, "Week")}
                </div>
            </div>
        </div>
    );
};

const ReserveFundModal = ({ reserveFund, setReserveFund, totalInvestedCapital, onClose }) => {
    // Initialize target with current total (Invested + Reserve)
    const [targetCapital, setTargetCapital] = useState(totalInvestedCapital + reserveFund);

    const calculatedReserve = Math.max(0, targetCapital - totalInvestedCapital);

    const handleSave = () => {
        setReserveFund(calculatedReserve);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[color:var(--bg-secondary)] w-full max-w-sm rounded-2xl border border-[color:var(--glass-border)] shadow-2xl flex flex-col">
                <div className="p-6 border-b border-[color:var(--glass-border)] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Capital Maintenance</h2>
                        <p className="text-[color:var(--text-secondary)] text-sm">Set Target Fund Capital</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[color:var(--bg-tertiary)] rounded-full transition-colors">
                        <X className="w-5 h-5 text-[color:var(--text-secondary)]" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-[color:var(--text-secondary)]">Total Invested Capital:</span>
                        <span className="font-medium text-[color:var(--text-primary)]">{formatCurrency(totalInvestedCapital)}</span>
                    </div>

                    <div>
                        <label className="text-sm text-[color:var(--text-secondary)] mb-2 block">Target Total Capital (₹)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={targetCapital}
                                onChange={(e) => setTargetCapital(parseFloat(e.target.value) || 0)}
                                className="w-full bg-[color:var(--bg-primary)] border border-[color:var(--glass-border)] rounded-lg px-4 py-2 text-[color:var(--text-primary)] focus:ring-2 focus:ring-[color:var(--accent-primary)] outline-none text-lg font-bold"
                                placeholder="30000"
                            />
                        </div>
                    </div>

                    <div className="bg-[color:var(--bg-tertiary)]/30 p-4 rounded-xl border border-[color:var(--glass-border)] space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-[color:var(--text-secondary)]">Required Reserve:</span>
                            <span className="font-mono font-medium text-[color:var(--accent-primary)]">
                                {formatCurrency(calculatedReserve)}
                            </span>
                        </div>
                        <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
                            <span className="text-[color:var(--text-primary)] font-medium">₹{calculatedReserve.toLocaleString('en-IN')}</span> will be retained from profits to reach your target of <span className="text-[color:var(--text-primary)] font-medium">₹{targetCapital.toLocaleString('en-IN')}</span>.
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-[color:var(--glass-border)] flex justify-end gap-2">
                    <button onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary text-sm">Set Target</button>
                </div>
            </div>
        </div>
    );
};

export default function InvestorDashboard({ totalPnL, investors, setInvestors, rows = [], reserveFund = 0, setReserveFund }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState(null);
    const [viewStatsId, setViewStatsId] = useState(null); // ID of investor to view stats for
    const [isProfitSplitOpen, setIsProfitSplitOpen] = useState(false);
    const [isReserveFundOpen, setIsReserveFundOpen] = useState(false);

    const [newInvestor, setNewInvestor] = useState({
        name: '',
        capital: '',
        profitPercent: '',
        upiId: '',
        phone: '',
        email: ''
    });

    const resetForm = () => {
        setNewInvestor({ name: '', capital: '', profitPercent: '', upiId: '', phone: '', email: '' });
        setEditingId(null);
        setError(null);
        setIsFormOpen(false);
    };

    const handleEdit = (investor) => {
        setNewInvestor({
            name: investor.name,
            capital: investor.capital,
            profitPercent: investor.profitPercent,
            upiId: investor.upiId || '',
            phone: investor.phone || '',
            email: investor.email || ''
        });
        setEditingId(investor.id);
        setIsFormOpen(true);
        setError(null);
    };

    const validateTotalShare = (newShare, excludeId = null) => {
        // Calculate total share of OTHER investors
        const otherInvestorsShare = investors
            .filter(inv => inv.id !== excludeId)
            .reduce((sum, inv) => sum + inv.profitPercent, 0);

        const total = otherInvestorsShare + parseFloat(newShare);
        return total <= 100;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);

        if (!newInvestor.name || !newInvestor.capital) {
            setError("Name and Capital are required.");
            return;
        }

        const profitPercent = parseFloat(newInvestor.profitPercent) || 0;

        if (!validateTotalShare(profitPercent, editingId)) {
            setError(`Total profit share cannot exceed 100%. Current total: ${investors.reduce((s, i) => s + (i.id !== editingId ? i.profitPercent : 0), 0)}%`);
            return;
        }

        if (editingId) {
            // Update existing
            setInvestors(investors.map(inv => inv.id === editingId ? {
                ...inv,
                name: newInvestor.name,
                capital: parseFloat(newInvestor.capital) || 0,
                profitPercent: profitPercent,
                upiId: newInvestor.upiId,
                phone: newInvestor.phone,
                email: newInvestor.email
            } : inv));
        } else {
            // Add new
            setInvestors([...investors, {
                id: uuidv4(),
                name: newInvestor.name,
                capital: parseFloat(newInvestor.capital) || 0,
                profitPercent: profitPercent,
                upiId: newInvestor.upiId,
                phone: newInvestor.phone,
                email: newInvestor.email
            }]);
        }

        resetForm();
    };

    const handleDelete = (id) => {
        if (confirm('Remove this investor?')) {
            setInvestors(investors.filter(inv => inv.id !== id));
        }
    };

    const handleMailBackup = () => {
        // 1. Generate JSON Blob
        const backupData = {
            date: new Date().toISOString(),
            investors,
            rows,
            reserveFund,
            totalPnL
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // 2. Trigger Download
        const a = document.createElement('a');
        a.href = url;
        a.download = `forex_journal_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 3. Open Mail Client
        const investorEmails = investors
            .map(inv => inv.email)
            .filter(email => email) // Filter out empty
            .join(',');

        // 4. Toast / Alert
        alert("Backup file downloaded! Please attach it manually to the email draft that opens now.");

        const subject = encodeURIComponent(`Daily Trading Journal Backup - ${new Date().toLocaleDateString()}`);
        const body = encodeURIComponent("Please find attached the daily trading journal backup.\n\n(Note: You must manually attach the downloaded file to this email.)");

        window.location.href = `mailto:${investorEmails}?subject=${subject}&body=${body}`;
    };

    // Calculations
    const safeReserveFund = Math.max(0, reserveFund);
    const totalCapital = investors.reduce((sum, inv) => sum + inv.capital, 0) + safeReserveFund;
    const distributablePnL = totalPnL - safeReserveFund;
    const totalInvestorShare = investors.reduce((sum, inv) => sum + (distributablePnL * (inv.profitPercent / 100)), 0);
    const traderShare = distributablePnL - totalInvestorShare;

    return (
        <div className="glass-panel p-6 mb-8">
            {viewStatsId && (
                <StatsModal
                    investor={investors.find(i => i.id === viewStatsId)}
                    rows={rows}
                    onClose={() => setViewStatsId(null)}
                />
            )}

            {isProfitSplitOpen && (
                <ProfitSplitModal
                    investors={investors}
                    setInvestors={setInvestors}
                    onClose={() => setIsProfitSplitOpen(false)}
                />
            )}

            {isReserveFundOpen && (
                <ReserveFundModal
                    reserveFund={safeReserveFund}
                    setReserveFund={setReserveFund}
                    totalInvestedCapital={investors.reduce((sum, inv) => sum + inv.capital, 0)}
                    onClose={() => setIsReserveFundOpen(false)}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-[color:var(--text-primary)] flex items-center gap-2">
                        <Users className="w-5 h-5 text-[color:var(--accent-primary)]" />
                        Investor Dashboard
                    </h2>
                    <p className="text-[color:var(--text-secondary)] text-sm mt-1">
                        {investors.length} Investors • Total Fund: {formatCurrency(totalCapital)}
                    </p>
                </div>

                <button
                    onClick={() => {
                        resetForm();
                        setIsFormOpen(!isFormOpen);
                    }}
                    className="btn btn-primary text-sm whitespace-nowrap"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Investor
                </button>
            </div>

            {/* Aggregates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total P/L" value={totalPnL} icon={Wallet} subtext="Gross Fund Performance" />
                <StatCard title="Investors' Share" value={totalInvestorShare} icon={PieChart} subtext="Pending Payout" highlight />
                <StatCard
                    title="Trader's Share"
                    value={traderShare}
                    icon={Users}
                    subtext="Net Profit"
                    onAction={() => setIsProfitSplitOpen(true)}
                    actionIcon={Settings}
                />
                <StatCard
                    title="Fund Capital"
                    value={totalCapital}
                    icon={TrendingUp}
                    subtext={reserveFund > 0 ? `Includes ₹${reserveFund} Reserve` : "Total Assets Under Mgmt"}
                    onAction={() => setIsReserveFundOpen(true)}
                    actionIcon={Pencil}
                />
            </div>

            {/* Add/Edit Form */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="bg-[color:var(--bg-secondary)]/50 p-4 rounded-lg border border-[color:var(--glass-border)] mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4 border-b border-[color:var(--glass-border)] pb-2">
                        <h3 className="text-[color:var(--text-primary)] font-semibold text-sm">
                            {editingId ? 'Edit Investor' : 'Add New Investor'}
                        </h3>
                        <button type="button" onClick={resetForm} className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
                            <Plus className="w-5 h-5 rotate-45" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                        <div className="lg:col-span-1">
                            <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={newInvestor.name}
                                onChange={e => setNewInvestor({ ...newInvestor, name: e.target.value })}
                                className="w-full bg-[color:var(--bg-tertiary)] border-none rounded p-2 text-sm text-[color:var(--text-primary)] focus:ring-1 focus:ring-[color:var(--accent-primary)]"
                                required
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">Capital (₹)</label>
                            <input
                                type="number"
                                placeholder="10000"
                                value={newInvestor.capital}
                                onChange={e => setNewInvestor({ ...newInvestor, capital: e.target.value })}
                                className="w-full bg-[color:var(--bg-tertiary)] border-none rounded p-2 text-sm text-[color:var(--text-primary)] focus:ring-1 focus:ring-[color:var(--accent-primary)]"
                                required
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">Profit Share (%)</label>
                            <input
                                type="number"
                                placeholder="10"
                                value={newInvestor.profitPercent}
                                onChange={e => setNewInvestor({ ...newInvestor, profitPercent: e.target.value })}
                                className="w-full bg-[color:var(--bg-tertiary)] border-none rounded p-2 text-sm text-[color:var(--text-primary)] focus:ring-1 focus:ring-[color:var(--accent-primary)]"
                                required
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">UPI ID</label>
                            <input
                                type="text"
                                placeholder="name@upi"
                                value={newInvestor.upiId}
                                onChange={e => setNewInvestor({ ...newInvestor, upiId: e.target.value })}
                                className="w-full bg-[color:var(--bg-tertiary)] border-none rounded p-2 text-sm text-[color:var(--text-primary)] focus:ring-1 focus:ring-[color:var(--accent-primary)]"
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">Phone</label>
                            <input
                                type="tel"
                                placeholder="9876543210"
                                value={newInvestor.phone}
                                onChange={e => setNewInvestor({ ...newInvestor, phone: e.target.value })}
                                className="w-full bg-[color:var(--bg-tertiary)] border-none rounded p-2 text-sm text-[color:var(--text-primary)] focus:ring-1 focus:ring-[color:var(--accent-primary)]"
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">Email</label>
                            <input
                                type="email"
                                placeholder="investor@example.com"
                                value={newInvestor.email}
                                onChange={e => setNewInvestor({ ...newInvestor, email: e.target.value })}
                                className="w-full bg-[color:var(--bg-tertiary)] border-none rounded p-2 text-sm text-[color:var(--text-primary)] focus:ring-1 focus:ring-[color:var(--accent-primary)]"
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <button type="submit" className={`w-full btn py-2 text-sm ${editingId ? 'btn-primary' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                                {editingId ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Investor List */}
            <div className="overflow-x-auto rounded-lg border border-[color:var(--glass-border)]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[color:var(--bg-secondary)]/50 text-[color:var(--text-secondary)] uppercase text-xs">
                        <tr>
                            <th className="p-3 w-12 text-center">Sl. No.</th>
                            <th className="p-3">Investor</th>
                            <th className="p-3">Contact</th>
                            <th className="p-3 text-right">Capital</th>
                            <th className="p-3 text-right">Profit %</th>
                            <th className="p-3 text-right">P/L Share</th>
                            <th className="p-3 text-right">Net Worth</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--glass-border)]">
                        {investors.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500">
                                    No investors added yet. Add one to track profit distribution.
                                </td>
                            </tr>
                        ) : (
                            investors.map((inv, index) => {
                                const pnlShare = totalPnL * (inv.profitPercent / 100);
                                const netWorth = inv.capital + pnlShare;
                                return (
                                    <tr key={inv.id} className="hover:bg-[color:var(--bg-tertiary)]/30 transition-colors">
                                        <td className="p-3 text-center text-[color:var(--text-secondary)]">{index + 1}</td>
                                        <td className="p-3 font-medium text-[color:var(--text-primary)]">{inv.name}</td>
                                        <td className="p-3 text-[color:var(--text-secondary)]">
                                            <div className="flex flex-col gap-1">
                                                {inv.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {inv.email}</span>}
                                                {inv.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {inv.phone}</span>}
                                                {inv.upiId && <span className="flex items-center gap-1"><QrCode className="w-3 h-3" /> {inv.upiId}</span>}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right text-[color:var(--text-secondary)]">{formatCurrency(inv.capital)}</td>
                                        <td className="p-3 text-right text-[color:var(--accent-primary)]">{inv.profitPercent}%</td>
                                        <td className={`p-3 text-right font-medium ${pnlShare >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {pnlShare > 0 ? '+' : ''}{formatCurrency(pnlShare)}
                                        </td>
                                        <td className="p-3 text-right font-bold text-[color:var(--text-primary)]">{formatCurrency(netWorth)}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setViewStatsId(inv.id)}
                                                    className="text-[color:var(--text-secondary)] hover:text-[color:var(--accent-primary)] transition-colors p-1"
                                                    title="View Stats"
                                                >
                                                    <BarChart3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(inv)}
                                                    className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors p-1"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(inv.id)}
                                                    className="text-[color:var(--text-secondary)] hover:text-rose-400 transition-colors p-1"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleMailBackup}
                    className="flex items-center gap-2 bg-[color:var(--bg-tertiary)] hover:bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)] px-4 py-2 rounded-lg transition-colors border border-[color:var(--glass-border)] text-sm font-medium"
                >
                    <Mail className="w-4 h-4" />
                    Email Daily Backup
                    <Download className="w-3 h-3 text-[color:var(--text-secondary)] ml-1" />
                </button>
            </div>
        </div>
    );
}
