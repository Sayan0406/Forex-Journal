import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Download, FileSpreadsheet, X, List, Layers, ChevronRight, ChevronDown, Filter, ArrowUpDown, ClipboardPaste, Undo } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Modal from './Modal';
import AiImportModal from './AiImportModal';
import { groupTrades, formatCurrency, calculateTotals } from '../utils/journalUtils';
import { motion, AnimatePresence } from 'framer-motion';

const SYMBOL_OPTIONS = [
    'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD',
    'BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD',
    'US30', 'NAS100', 'SPX500', 'GER40'
];

const DEFAULT_COLUMNS = [
    { id: 'date', label: 'Date', type: 'date' },
    { id: 'symbol', label: 'Symbol', type: 'select', options: SYMBOL_OPTIONS },
    { id: 'type', label: 'Type', type: 'select', options: ['Buy', 'Sell'] },
    { id: 'lot', label: 'Lot', type: 'number' },
    { id: 'entry', label: 'Entry', type: 'number' },
    { id: 'exit', label: 'Exit', type: 'number' },
    { id: 'investment', label: 'Investment', type: 'number' },
    { id: 'pnl', label: 'P/L', type: 'number' },
    { id: 'notes', label: 'Notes', type: 'text' },
];

const StatBadge = ({ label, value, isPnL }) => {
    const num = Number(value);
    const colorClass = isPnL
        ? (num > 0 ? 'text-emerald-400' : num < 0 ? 'text-rose-400' : 'text-[color:var(--text-secondary)]')
        : 'text-[color:var(--accent-primary)]';

    return (
        <div className="flex items-center gap-2 text-sm bg-[color:var(--bg-primary)]/40 px-3 py-1 rounded-full border border-[color:var(--glass-border)]">
            <span className="text-[color:var(--text-secondary)] font-medium">{label}:</span>
            <span className={`font-semibold ${colorClass}`}>
                {num >= 0 && isPnL ? '+' : ''}{formatCurrency(value)}
            </span>
        </div>
    );
};

const AccordionItem = ({ node, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const levelStyles = {
        month: "bg-slate-800/50 border-l-4 border-l-purple-500",
        week: "bg-slate-800/30 border-l-4 border-l-sky-500 ml-4",
        day: "bg-slate-800/10 border-l-4 border-l-emerald-500 ml-8"
    };

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all hover:bg-[color:var(--bg-tertiary)]/50 ${levelStyles[node.level]} ${isOpen ? 'rounded-b-none' : ''}`}
            >
                <div className="flex items-center gap-4">
                    {isOpen ? <ChevronDown className="w-5 h-5 text-[color:var(--text-secondary)]" /> : <ChevronRight className="w-5 h-5 text-[color:var(--text-secondary)]" />}
                    <span className="font-semibold text-[color:var(--text-primary)]">{node.label}</span>
                    <span className="text-xs text-[color:var(--text-secondary)] bg-[color:var(--bg-primary)]/50 px-2 py-0.5 rounded">
                        {node.stats.count} trades
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <StatBadge label="Inv" value={node.stats.investment} />
                    <StatBadge label="P/L" value={node.stats.pnl} isPnL />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={`p-2 border-t border-[color:var(--glass-border)] ${levelStyles[node.level].split(' ')[0]} rounded-b-lg`}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function JournalTable({ userRole = 'master', rows, setRows, investors }) {
    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('journal_columns');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    const [viewMode, setViewMode] = useState('table'); // 'table' | 'hierarchy'
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [newColumn, setNewColumn] = useState({ label: '', type: 'text' });
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [filterOutcome, setFilterOutcome] = useState('all'); // 'all', 'win', 'loss', 'breakeven'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    const [deletedRows, setDeletedRows] = useState([]);

    const handleExportCSV = () => {
        if (rows.length === 0) return;
        const headers = columns.map(c => c.label).join(',');
        const csvRows = rows.map(row => 
            columns.map(col => `"${(row[col.id] || '').toString().replace(/"/g, '""')}"`).join(',')
        );
        const csvContent = [headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `trades_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        window.print();
    };

    // Processed Data (Filter -> Sort)
    const processedRows = useMemo(() => {
        let result = [...rows];

        // 1. Filter by Outcome
        if (filterOutcome !== 'all') {
            result = result.filter(r => {
                const pnl = parseFloat(r.pnl || 0);
                if (filterOutcome === 'win') return pnl > 0;
                if (filterOutcome === 'loss') return pnl < 0;
                if (filterOutcome === 'breakeven') return pnl === 0;
                return true;
            });
        }

        // 2. Sort by Date
        result.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return result;
    }, [rows, filterOutcome, sortOrder]);

    // Grouped Data Memos (uses processed rows)
    const groupedData = useMemo(() => groupTrades(processedRows), [processedRows]);

    const { pnl: totalPnL } = useMemo(() => calculateTotals(processedRows), [processedRows]);

    const tradeStats = useMemo(() => {
        if (!processedRows.length) return null;
        let wins = 0;
        let best = -Infinity;
        let worst = Infinity;
        
        processedRows.forEach(r => {
            const p = parseFloat(r.pnl) || 0;
            if (p > 0) wins++;
            if (p > best) best = p;
            if (p < worst) worst = p;
        });

        return {
            total: processedRows.length,
            winRate: ((wins / processedRows.length) * 100).toFixed(1),
            best: best === -Infinity ? 0 : best,
            worst: worst === Infinity ? 0 : worst
        };
    }, [processedRows]);

    useEffect(() => {
        localStorage.setItem('journal_columns', JSON.stringify(columns));
    }, [columns]);

    // Migration: Pair -> Symbol
    useEffect(() => {
        const hasPair = columns.find(c => c.id === 'pair');
        if (hasPair) {
            setColumns(prev => prev.map(c =>
                c.id === 'pair'
                    ? { ...c, id: 'symbol', label: 'Symbol', type: 'select', options: SYMBOL_OPTIONS }
                    : c
            ));
            setRows(prev => prev.map(r => {
                if (r.pair !== undefined && r.symbol === undefined) {
                    const { pair, ...rest } = r;
                    return { ...rest, symbol: pair };
                }
                return r;
            }));
        }
    }, [columns, setRows]);

    const handleAddColumn = (e) => {
        e.preventDefault();
        if (!newColumn.label) return;
        const id = newColumn.label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
        setColumns([...columns, { ...newColumn, id }]);
        setNewColumn({ label: '', type: 'text' });
        setIsAddColumnOpen(false);
    };

    const handleDeleteColumn = (colId) => {
        if (confirm('Are you sure you want to delete this column? Data in this column will be lost.')) {
            setColumns(columns.filter(c => c.id !== colId));
        }
    };

    const handleAddRow = () => {
        const newRow = { id: uuidv4() };
        columns.forEach(col => newRow[col.id] = '');
        if (columns.find(c => c.id === 'date')) {
            newRow.date = new Date().toISOString().split('T')[0];
        }
        if (columns.find(c => c.id === 'symbol')) {
            newRow.symbol = '';
        }
        setRows([newRow, ...rows]);
    };

    const handleDeleteRow = (rowId) => {
        setRows(rows.filter(r => r.id !== rowId));
    };

    const handleCellChange = (rowId, colId, value) => {
        setRows(rows.map(row =>
            row.id === rowId ? { ...row, [colId]: value } : row
        ));
    };

    // Render Table Row Helper
    const renderRow = (row, index) => (
        <tr key={row.id} className="border-b border-[color:var(--bg-tertiary)]/50 hover:bg-[color:var(--bg-tertiary)]/30 transition-colors group">
            {/* Serial Number */}
            <td className="p-4 text-[color:var(--text-secondary)] font-mono text-xs w-10">
                {index + 1}
            </td>
            {columns.map(col => {
                // Determine color for P/L column
                let cellColorClass = 'text-[color:var(--text-primary)]';
                if (col.id === 'pnl') {
                    const val = parseFloat(row[col.id]);
                    if (val > 0) cellColorClass = 'text-emerald-400 font-semibold';
                    else if (val < 0) cellColorClass = 'text-rose-400 font-semibold';
                }

                return (
                    <td key={`${row.id}-${col.id}`} className="p-4">
                        {col.type === 'select' ? (
                            <div className="relative">
                                {userRole === 'investor' ? (
                                    <span className={`font-medium px-2 py-1 rounded text-sm ${row[col.id] === 'Buy' ? 'text-emerald-400 bg-emerald-400/10' :
                                        row[col.id] === 'Sell' ? 'text-rose-400 bg-rose-400/10' : 'text-[color:var(--text-primary)]'
                                        }`}>
                                        {row[col.id] || '-'}
                                    </span>
                                ) : (
                                    <select
                                        value={row[col.id] || ''}
                                        onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                        className={`appearance-none bg-transparent border-none font-medium focus:ring-0 w-full cursor-pointer outline-none pl-2 pr-8 py-1 rounded min-w-[100px] ${row[col.id] === 'Buy' ? 'text-emerald-400 bg-emerald-400/10' :
                                            row[col.id] === 'Sell' ? 'text-rose-400 bg-rose-400/10' : 'text-[color:var(--text-primary)]'
                                            }`}
                                    >
                                        <option value="" className="bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)]">Select</option>
                                        {col.options?.map(opt => (
                                            <option key={opt} value={opt} className="bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)]">{opt}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ) : (
                            userRole === 'investor' ? (
                                <span className={`text-sm px-1 ${cellColorClass}`}>
                                    {col.id === 'pnl' || col.id === 'investment' || col.id === 'entry' || col.id === 'exit' 
                                        ? (col.id === 'pnl' ? (parseFloat(row[col.id]) >= 0 ? '+' : '') : '') + formatCurrency(row[col.id] || 0)
                                        : (row[col.id] || '-')}
                                </span>
                            ) : (
                                <input
                                    type={col.type}
                                    step={col.type === 'number' ? 'any' : undefined}
                                    value={row[col.id] ?? ''}
                                    onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                    className={`bg-transparent border-none w-full focus:ring-1 focus:ring-[color:var(--accent-primary)]/50 rounded px-1 outline-none min-w-[60px] lg:min-w-[80px] ${cellColorClass}`}
                                    placeholder="..."
                                />
                            )
                        )}
                    </td>
                );
            })}
            {userRole === 'master' && (
                <td className="p-4 text-center sticky right-0">
                    <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-[color:var(--text-secondary)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-[color:var(--bg-tertiary)]/50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </td>
            )}
        </tr>
    );

    return (
        <div className="glass-panel p-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-8">
                <h2 className="text-2xl font-bold text-[color:var(--text-primary)] tracking-tight">Trade History</h2>

                <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                    {/* Outcome Filter */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-[color:var(--text-secondary)]" />
                        </div>
                        <select
                            value={filterOutcome}
                            onChange={(e) => setFilterOutcome(e.target.value)}
                            className="bg-[color:var(--bg-secondary)]/40 border border-[color:var(--glass-border)] text-[color:var(--text-primary)] text-sm rounded-lg focus:ring-[color:var(--accent-primary)] focus:border-[color:var(--accent-primary)] block w-full pl-10 p-2.5 appearance-none cursor-pointer hover:bg-[color:var(--bg-tertiary)]/50 transition-colors"
                        >
                            <option value="all">All Outcomes</option>
                            <option value="win">Wins only</option>
                            <option value="loss">Losses only</option>
                            <option value="breakeven">Break Even</option>
                        </select>
                    </div>

                    <div className="h-6 w-px bg-white/10 hidden sm:block mx-2"></div>

                    {/* Sort Toggle */}
                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center gap-2 bg-[color:var(--bg-secondary)]/40 px-3 py-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg border border-[color:var(--glass-border)] hover:bg-[color:var(--bg-tertiary)]/50 transition-all text-sm h-[42px]"
                        title={sortOrder === 'asc' ? "Sort: Oldest First" : "Sort: Newest First"}
                    >
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="hidden sm:inline whitespace-nowrap">{sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
                    </button>

                    <div className="h-6 w-px bg-white/10 hidden sm:block mx-2"></div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-[color:var(--bg-secondary)]/40 p-1 rounded-lg border border-[color:var(--glass-border)]">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-[color:var(--bg-tertiary)] text-[color:var(--text-primary)] shadow' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
                            title="Table View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('hierarchy')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'hierarchy' ? 'bg-[color:var(--bg-tertiary)] text-[color:var(--text-primary)] shadow' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
                            title="Hierarchical View"
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-white/10 hidden sm:block mx-2"></div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {(userRole === 'master' || userRole === 'subadmin') && deletedRows.length > 0 && (
                            <button onClick={() => {
                                setRows(deletedRows);
                                setDeletedRows([]);
                            }} className="btn text-sm whitespace-nowrap bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40" title="Undo Delete All">
                                <Undo className="w-4 h-4 sm:mr-1.5" />
                                <span className="hidden sm:inline">Undo</span>
                            </button>
                        )}
                        {(userRole === 'master' || userRole === 'subadmin') && (
                                <button onClick={() => {
                                    if (rows.length > 0 && confirm('Are you sure you want to delete ALL trades? You can undo this action immediately after.')) {
                                        setDeletedRows([...rows]);
                                        setRows([]);
                                    }
                                }} className="btn text-sm whitespace-nowrap bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40" title="Delete All Trades">
                                    <Trash2 className="w-4 h-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Delete All</span>
                                </button>
                        )}
                        <button onClick={handleExportCSV} className="btn text-sm whitespace-nowrap bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40" title="Export CSV">
                            <FileSpreadsheet className="w-4 h-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>
                        <button onClick={handleExportPDF} className="btn text-sm whitespace-nowrap bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40" title="Export PDF (Print)">
                            <Download className="w-4 h-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Export PDF</span>
                        </button>
                        {(userRole === 'master' || userRole === 'subadmin') && (
                            <>
                                <button onClick={() => setIsAiModalOpen(true)} className="btn text-sm whitespace-nowrap bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40" title="Paste Import">
                                    <ClipboardPaste className="w-4 h-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Paste Import</span>
                                </button>
                                <button onClick={handleAddRow} className="btn btn-primary text-sm whitespace-nowrap" title="New Trade">
                                    <Plus className="w-5 h-5 sm:mr-1" />
                                    <span className="hidden sm:inline">New Trade</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {tradeStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-[color:var(--bg-secondary)]/40 border border-[color:var(--glass-border)] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-[color:var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider mb-1">Win Rate</span>
                        <span className="text-lg font-bold text-emerald-400">{tradeStats.winRate}%</span>
                    </div>
                    <div className="bg-[color:var(--bg-secondary)]/40 border border-[color:var(--glass-border)] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-[color:var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider mb-1">Total Trades</span>
                        <span className="text-lg font-bold text-[color:var(--text-primary)]">{tradeStats.total}</span>
                    </div>
                    <div className="bg-[color:var(--bg-secondary)]/40 border border-[color:var(--glass-border)] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-[color:var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider mb-1">Best Trade</span>
                        <span className="text-lg font-bold text-emerald-400">+{formatCurrency(tradeStats.best)}</span>
                    </div>
                    <div className="bg-[color:var(--bg-secondary)]/40 border border-[color:var(--glass-border)] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-[color:var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider mb-1">Worst Trade</span>
                        <span className="text-lg font-bold text-rose-400">{formatCurrency(tradeStats.worst)}</span>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto min-h-[400px]">
                {viewMode === 'hierarchy' ? (
                    <div className="space-y-4">
                        {groupedData.length === 0 ? (
                            <div className="text-center p-12 text-[color:var(--text-secondary)]">
                                {filterOutcome !== 'all' ? 'No trades match this filter.' : 'No trades to display.'}
                            </div>
                        ) : (
                            groupedData.map(month => (
                                <AccordionItem key={month.key} node={month} defaultOpen={true}>
                                    {month.children.map(week => (
                                        <AccordionItem key={week.key} node={week}>
                                            {week.children.map(day => (
                                                <AccordionItem key={day.key} node={day}>
                                                    <table className="w-full border-collapse text-left mt-2 bg-[color:var(--bg-primary)]/30 rounded-lg overflow-hidden">
                                                        <thead className="bg-[color:var(--bg-primary)]/50 text-xs uppercase text-[color:var(--text-secondary)]">
                                                            <tr>
                                                                <th className="p-2 w-10">#</th>
                                                                {columns.map(col => <th key={col.id} className="p-2">{col.label}</th>)}
                                                                <th className="p-2 w-10"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {day.trades.map((trade, i) => renderRow(trade, i))}
                                                        </tbody>
                                                    </table>
                                                </AccordionItem>
                                            ))}
                                        </AccordionItem>
                                    ))}
                                </AccordionItem>
                            ))
                        )}
                    </div>
                ) : (
                    <>
                    <table className="hidden md:table w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-[color:var(--glass-border)] text-[color:var(--text-secondary)] text-sm uppercase tracking-wider">
                                <th className="p-4 w-10 text-center font-medium">#</th>
                                {columns.map(col => (
                                    <th key={col.id} className="p-4 font-medium group relative min-w-[100px] lg:min-w-[120px]">
                                        <div className="flex items-center justify-between gap-2">
                                            {col.label}
                                            <button
                                                onClick={() => handleDeleteColumn(col.id)}
                                                className="opacity-0 group-hover:opacity-100 text-[color:var(--text-secondary)] hover:text-red-400 transition-opacity"
                                                title="Delete Column"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 w-12 text-center sticky right-0">
                                    <button
                                        onClick={() => setIsAddColumnOpen(true)}
                                        className="text-[color:var(--text-secondary)] hover:text-[color:var(--accent-primary)] transition-colors p-1.5 rounded-full hover:bg-[color:var(--bg-tertiary)]/50"
                                        title="Add Column"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedRows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 2} className="p-12 text-center text-slate-500">
                                        {filterOutcome !== 'all' ? 'No trades match this filter.' : 'No trades recorded yet.'}
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {processedRows.map((row, index) => renderRow(row, index))}
                                    <tr className="border-t-2 border-[color:var(--glass-border)] bg-[color:var(--bg-tertiary)]/30">
                                        <td className="p-4"></td>
                                        {columns.map((col, i) => {
                                            if (col.id === 'pnl') {
                                                const val = parseFloat(totalPnL);
                                                let cellColorClass = 'text-[color:var(--text-primary)]';
                                                if (val > 0) cellColorClass = 'text-emerald-400 font-bold';
                                                else if (val < 0) cellColorClass = 'text-rose-400 font-bold';
                                                else cellColorClass = 'text-[color:var(--text-secondary)] font-bold';
                                                return (
                                                    <td key={col.id} className={`p-4 ${cellColorClass} whitespace-nowrap`}>
                                                        {val >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                                                    </td>
                                                );
                                            }
                                            if (col.id === columns[0].id && col.id !== 'pnl') {
                                                return <td key={col.id} className="p-4 font-bold text-[color:var(--text-primary)] whitespace-nowrap text-right pr-4">Total P/L</td>;
                                            }
                                            return <td key={col.id} className="p-4"></td>;
                                        })}
                                        <td className="p-4 sticky right-0"></td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Card Layout */}
                    <div className="md:hidden flex flex-col gap-4 pb-4">
                        {processedRows.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 bg-[color:var(--bg-secondary)]/30 rounded-lg border border-[color:var(--glass-border)]">
                                {filterOutcome !== 'all' ? 'No trades match this filter.' : 'No trades recorded yet.'}
                            </div>
                        ) : (
                            processedRows.map((row) => {
                                const pnl = parseFloat(row.pnl || 0);
                                const pnlClass = pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-[color:var(--text-secondary)]';
                                return (
                                    <div key={row.id} className="bg-[color:var(--bg-secondary)]/60 rounded-xl p-4 border border-[color:var(--glass-border)] relative shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${row.type === 'Buy' ? 'bg-emerald-400/10 text-emerald-400' : row.type === 'Sell' ? 'bg-rose-400/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                                    {row.type || 'N/A'}
                                                </span>
                                                <span className="font-bold text-[color:var(--text-primary)]">{row.symbol || 'Symbol'}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRow(row.id)}
                                                className="text-[color:var(--text-secondary)] hover:text-red-400 p-1 bg-[color:var(--bg-tertiary)]/50 rounded-full"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-3 text-sm mb-4 bg-[color:var(--bg-tertiary)]/30 p-3 rounded-lg">
                                            <div className="flex flex-col">
                                                <span className="text-[color:var(--text-secondary)] text-[10px] uppercase">Date</span>
                                                <span className="text-[color:var(--text-primary)] font-medium">{row.date || '-'}</span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[color:var(--text-secondary)] text-[10px] uppercase">Lot Size</span>
                                                <span className="text-[color:var(--text-primary)] font-medium">{row.lot || '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[color:var(--text-secondary)] text-[10px] uppercase">Entry</span>
                                                <span className="text-[color:var(--text-primary)] font-medium">{row.entry || '-'}</span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[color:var(--text-secondary)] text-[10px] uppercase">Exit</span>
                                                <span className="text-[color:var(--text-primary)] font-medium">{row.exit || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-[color:var(--glass-border)] flex justify-between items-center">
                                            <span className="text-[color:var(--text-secondary)] text-sm font-medium">Profit/Loss</span>
                                            <span className={`text-lg font-bold ${pnlClass}`}>
                                                {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        
                        {processedRows.length > 0 && (
                            <div className="bg-[color:var(--bg-secondary)] rounded-xl p-4 border border-[color:var(--glass-border)] flex justify-between items-center shadow-lg">
                                <span className="text-[color:var(--text-primary)] font-bold">Total P/L</span>
                                <span className={`text-xl font-bold ${parseFloat(totalPnL) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {parseFloat(totalPnL) >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                                </span>
                            </div>
                        )}
                    </div>
                    </>
                )}
            </div>

            <Modal
                isOpen={isAddColumnOpen}
                onClose={() => setIsAddColumnOpen(false)}
                title="Add New Column"
            >
                <form onSubmit={handleAddColumn} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">Column Label</label>
                        <input
                            type="text"
                            value={newColumn.label}
                            onChange={(e) => setNewColumn({ ...newColumn, label: e.target.value })}
                            className="w-full bg-[color:var(--bg-secondary)] border border-[color:var(--bg-tertiary)] rounded p-2 text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none"
                            placeholder="e.g. Strategy, Mood, Timeframe"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">Column Type</label>
                        <select
                            value={newColumn.type}
                            onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value })}
                            className="w-full bg-[color:var(--bg-secondary)] border border-[color:var(--bg-tertiary)] rounded p-2 text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none"
                        >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4 gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAddColumnOpen(false)}
                            className="btn btn-ghost"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Create Column
                        </button>
                    </div>
                </form>
            </Modal>

            <AiImportModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                columns={columns}
                existingRows={rows}
                onAddTrades={(parsedTrades) => {
                    setRows(prev => [...prev, ...parsedTrades]);
                }}
            />
        </div>
    );
}
