import React, { useState } from 'react';
import { X, ClipboardPaste } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function AiImportModal({ isOpen, onClose, columns, existingRows, onAddTrades }) {
    const [pasteData, setPasteData] = useState('');
    const [previewCount, setPreviewCount] = useState(0);

    if (!isOpen) return null;

    const handleProcess = () => {
        if (!pasteData) return;

        const rawLines = pasteData.trim().split('\n').map(l => l.trim()).filter(l => l);
        let parsedTrades = [];

        // Detection Logic: Is this a vertical columnar format?
        const hasHeaders = rawLines.slice(0, 25).filter(line => 
            ["symbol", "vol.", "entry price", "avg.price", "pnl", "open time", "action"].some(key => line.toLowerCase().includes(key.toLowerCase()))
        ).length >= 3;
        
        const hasOrderHashes = rawLines.some(l => l.startsWith('#') && l.length > 4);
        const isVertical = hasHeaders || hasOrderHashes || (rawLines.length >= 12 && rawLines.length % 12 === 0);

        if (isVertical) {
            // VERTICAL PARSER
            let dataOffset = 0;
            if (hasHeaders) {
                for (let i = 0; i < Math.min(rawLines.length, 25); i++) {
                    if (rawLines[i].toLowerCase() === 'action' || rawLines[i].toLowerCase().includes('status')) {
                        dataOffset = i + 1;
                        break;
                    }
                }
                if (dataOffset === 0) dataOffset = 12; 
            }

            const dataLines = rawLines.slice(dataOffset);
            // Blocks of 12 lines each as seen in MT4/MT5 reports
            for (let i = 0; i < dataLines.length; i += 12) {
                const block = dataLines.slice(i, i + 12);
                if (block.length < 5) break;

                const trade = { id: uuidv4() };
                
                // Flexible mapping based on content rather than just index if possible
                // Mapping based on the specific vertical sequence observed
                const rawAction = block[0] || 'S';
                trade.type = rawAction.toLowerCase().startsWith('b') ? 'Buy' : 'Sell';
                trade.symbol = block[1] || 'Unknown';
                
                const rawLot = block[2] || '0';
                trade.lot = parseFloat(rawLot.includes('/') ? rawLot.split('/')[0].replace(/[^\d.]/g, '') : rawLot.replace(/[^\d.]/g, '')) || 0;
                
                trade.entry = parseFloat((block[3] || '0').replace(/[^\d.]/g, '')) || 0;
                trade.exit = parseFloat((block[4] || '0').replace(/[^\d.]/g, '')) || 0;
                trade.pnl = parseFloat((block[6] || block[5] || '0').replace(/[^\d.+-]/g, '')) || 0; // Prioritize Net PnL (block 6)
                
                // Helper to convert various date formats to YYYY-MM-DD
                const rawDate = block[8] || '';
                const cleanDate = rawDate.split(' ')[0].replace(/[^\d/-]/g, ''); // Keep only numbers and separators
                const dateParts = cleanDate.split(/[/-]/);
                
                if (dateParts.length === 3) {
                    if (dateParts[0].length === 4) { // YYYY-MM-DD
                        trade.date = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
                    } else if (dateParts[2].length === 4) { // DD/MM/YYYY
                        trade.date = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                    } else {
                        trade.date = rawDate;
                    }
                } else {
                    trade.date = new Date().toISOString().split('T')[0];
                }

                trade.status = 'Closed';
                trade.notes = block[10] || 'AI Vertical Import'; // Store Order Number in Notes

                parsedTrades.push(trade);
            }
        } else {
            // STANDARD LINE-BY-LINE PARSER (CSV/TSV)
            for (const line of rawLines) {
                const cols = line.split(/[\t,]+/);
                if (cols.length < 2) continue; 
                
                const newTrade = { id: uuidv4() };
                columns.forEach((schemaCol, index) => {
                    if (cols[index] !== undefined && schemaCol.id !== 'actions') {
                        let val = cols[index].trim();
                        if (schemaCol.type === 'number') {
                            newTrade[schemaCol.id] = parseFloat(val.replace(/[^\d.+-]/g, '')) || 0;
                        } else if (schemaCol.type === 'date') {
                            // Try to handle DD/MM/YYYY or similar
                            const parts = val.split(/[/-]/);
                            if (parts.length === 3) {
                                // Assume DD/MM/YYYY or YYYY-MM-DD
                                if (parts[0].length === 4) newTrade[schemaCol.id] = val; // Already YYYY
                                else newTrade[schemaCol.id] = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            } else {
                                newTrade[schemaCol.id] = val;
                            }
                        } else {
                            newTrade[schemaCol.id] = val;
                        }
                    }
                });
                parsedTrades.push(newTrade);
            }
        }

        if (parsedTrades.length > 0) {
            // Deduplicate based on Order Number (Notes field) or Symbol+Date+PnL combo if no notes
            const existingKeys = new Set(existingRows.map(r => 
                r.notes?.trim() ? r.notes.trim() : `${r.symbol}-${r.date}-${r.pnl}`
            ).filter(Boolean));

            const newTrades = parsedTrades.filter(t => {
                const key = t.notes?.trim() ? t.notes.trim() : `${t.symbol}-${t.date}-${t.pnl}`;
                return !existingKeys.has(key);
            });

            if (newTrades.length > 0) {
                onAddTrades(newTrades);
                if (newTrades.length < parsedTrades.length) {
                    alert(`Imported ${newTrades.length} new trades. Skipped ${parsedTrades.length - newTrades.length} duplicates.`);
                }
            } else {
                alert('All trades in this paste are already in your journal.');
            }
        }
        
        setPasteData('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[color:var(--text-secondary)] hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <ClipboardPaste className="w-5 h-5 text-indigo-400" />
                    Paste Import
                </h3>
                <p className="text-sm text-[color:var(--text-secondary)] mb-6">
                    Paste your raw trades from MetaTrader, cTrader, or spreadsheets here. We will auto-extract and map the columns automatically.
                </p>

                <textarea
                    value={pasteData}
                    onChange={(e) => {
                        setPasteData(e.target.value);
                        setPreviewCount(e.target.value.trim().split('\n').filter(l => l.includes('\t') || l.includes(',')).length);
                    }}
                    placeholder="Date    Symbol    Lots...&#10;2024-03-21    XAUUSD    1.5..."
                    className="w-full h-48 bg-[color:var(--bg-tertiary)]/50 border border-[color:var(--glass-border)] rounded-lg p-3 text-sm text-[color:var(--text-primary)] focus:ring-1 focus:ring-indigo-500 font-mono resize-none mb-4"
                />

                <div className="flex justify-between items-center">
                    <span className="text-xs text-[color:var(--text-secondary)]">
                        {previewCount > 0 ? `Detected ~${previewCount} logical rows` : ''}
                    </span>
                    <button
                        onClick={handleProcess}
                        disabled={!pasteData.trim()}
                        className="btn bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-6"
                    >
                        <span className="font-bold">✓</span>
                        Process & Import
                    </button>
                </div>
            </div>
        </div>
    );
}
