import React, { useState } from 'react';
import { X, ClipboardPaste, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function AiImportModal({ isOpen, onClose, columns, existingRows, onAddTrades }) {
    const [pasteData, setPasteData] = useState('');
    const [previewCount, setPreviewCount] = useState(0);

    if (!isOpen) return null;

    const handleProcess = () => {
        if (!pasteData) return;

        const rawLines = pasteData.trim().split('\n').map(l => l.trim()).filter(l => l);
        let parsedTrades = [];

        // Detection: Is this the vertical MT4/MT5 style format?
        const verticalKeywords = ["symbol", "vol.", "entry price", "avg.price", "pnl", "open time", "action"];
        const headerMatchCount = rawLines.slice(0, 20).filter(line => 
            verticalKeywords.some(key => line.toLowerCase().includes(key.toLowerCase()))
        ).length;

        if (headerMatchCount >= 4) {
            // VERTICAL PARSER
            // Data usually starts after the 'Action' header or similar
            let dataOffset = 0;
            for (let i = 0; i < Math.min(rawLines.length, 25); i++) {
                if (rawLines[i].toLowerCase() === 'action') {
                    dataOffset = i + 1;
                    break;
                }
            }
            if (dataOffset === 0) dataOffset = 12; // Fallback to user's 12-header block size

            const dataLines = rawLines.slice(dataOffset);
            // Blocks of 12 lines each as seen in user's prompt
            for (let i = 0; i < dataLines.length; i += 12) {
                const block = dataLines.slice(i, i + 12);
                if (block.length < 5) break;

                const trade = { id: uuidv4() };
                
                // Mapping based on the specific vertical sequence observed
                const rawAction = block[0] || 'S';
                trade.type = rawAction.toLowerCase().startsWith('b') ? 'Buy' : 'Sell';
                trade.symbol = block[1] || 'Unknown';
                
                const rawLot = block[2] || '0';
                trade.lot = rawLot.includes('/') ? rawLot.split('/')[0].replace(/[^\d.]/g, '') : rawLot.replace(/[^\d.]/g, '');
                
                trade.entry = (block[3] || '0').replace(/[^\d.]/g, '');
                trade.exit = (block[4] || '0').replace(/[^\d.]/g, '');
                trade.pnl = (block[5] || '0').replace(/[^\d.+-]/g, '');
                trade.date = block[8] || new Date().toLocaleDateString();
                trade.status = 'Closed';
                trade.investment = 0; // Default or calculated
                trade.notes = 'AI Vertical Import';

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
                        newTrade[schemaCol.id] = cols[index].trim();
                    }
                });
                parsedTrades.push(newTrade);
            }
        }

        if (parsedTrades.length > 0) {
            onAddTrades(parsedTrades);
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
                        className="btn bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Process & Import
                    </button>
                </div>
            </div>
        </div>
    );
}
