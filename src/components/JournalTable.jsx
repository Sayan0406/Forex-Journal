import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Download, FileSpreadsheet, X, List, Layers, ChevronRight, ChevronDown, Filter } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Modal from './Modal';
import { groupTrades, formatCurrency } from '../utils/journalUtils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export default function JournalTable({ rows, setRows, investors }) {
    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('journal_columns');
        return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    });

    const [viewMode, setViewMode] = useState('table'); // 'table' | 'hierarchy'
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [newColumn, setNewColumn] = useState({ label: '', type: 'text' });
    const [filterOutcome, setFilterOutcome] = useState('all'); // 'all', 'win', 'loss', 'breakeven'

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

        // 2. Sort by Date (Oldest First)
        result.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateA - dateB;
        });

        return result;
    }, [rows, filterOutcome]);

    // Grouped Data Memos (uses processed rows)
    const groupedData = useMemo(() => groupTrades(processedRows), [processedRows]);

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

    const exportXLSX = () => {
        const ws = XLSX.utils.json_to_sheet(processedRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Journal");
        XLSX.writeFile(wb, "forex_journal.xlsx");
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["Sl. No.", ...columns.map(col => col.label)];
        const tableRows = processedRows.map((row, index) => [
            index + 1,
            ...columns.map(col => row[col.id] || '')
        ]);
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            styles: { fontSize: 8 },
            theme: 'grid'
        });
        doc.save("forex_journal.pdf");
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
                                <select
                                    value={row[col.id] || ''}
                                    onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                    className={`appearance-none bg-transparent border-none font-medium focus:ring-0 w-full cursor-pointer outline-none pl-2 pr-8 py-1 rounded min-w-[140px] ${row[col.id] === 'Buy' ? 'text-emerald-400 bg-emerald-400/10' :
                                        row[col.id] === 'Sell' ? 'text-rose-400 bg-rose-400/10' : 'text-[color:var(--text-primary)]'
                                        }`}
                                >
                                    <option value="" className="bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)]">Select</option>
                                    {col.options?.map(opt => (
                                        <option key={opt} value={opt} className="bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)]">{opt}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <input
                                type={col.type}
                                value={row[col.id] || ''}
                                onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                className={`bg-transparent border-none w-full focus:ring-1 focus:ring-[color:var(--accent-primary)]/50 rounded px-1 outline-none min-w-[140px] ${cellColorClass}`}
                                placeholder="..."
                            />
                        )}
                    </td>
                );
            })}
            <td className="p-4 text-center sticky right-0">
                <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="text-[color:var(--text-secondary)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-[color:var(--bg-tertiary)]/50"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
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
                        <button onClick={exportXLSX} className="btn btn-ghost text-sm p-2" title="Export CSV">
                            <FileSpreadsheet className="w-5 h-5" />
                        </button>
                        <button onClick={exportPDF} className="btn btn-ghost text-sm p-2" title="Export PDF">
                            <Download className="w-5 h-5" />
                        </button>
                        <button onClick={handleAddRow} className="btn btn-primary text-sm whitespace-nowrap">
                            <Plus className="w-5 h-5 mr-1" />
                            New Trade
                        </button>
                    </div>
                </div>
            </div>

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
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-[color:var(--glass-border)] text-[color:var(--text-secondary)] text-sm uppercase tracking-wider">
                                <th className="p-4 w-10 text-center font-medium">#</th>
                                {columns.map(col => (
                                    <th key={col.id} className="p-4 font-medium group relative min-w-[160px]">
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
                                processedRows.map((row, index) => renderRow(row, index))
                            )}
                        </tbody>
                    </table>
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
        </div>
    );
}
