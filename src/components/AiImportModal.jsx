import React, { useState } from 'react';
import { X, ClipboardPaste, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function AiImportModal({ isOpen, onClose, columns, existingRows, onAddTrades }) {
    const [pasteData, setPasteData] = useState('');
    const [previewCount, setPreviewCount] = useState(0);

    if (!isOpen) return null;

    const handleProcess = () => {
        if (!pasteData) return;

        // Simple parser for tab or comma separated data
        const lines = pasteData.trim().split('\n');
        const parsedTrades = [];

        for (const line of lines) {
            const cols = line.split(/[\t,]+/);
            if (cols.length < 2) continue; // Skip empty lines or single words
            
            const newTrade = { id: uuidv4() };
            
            // Map the parsed columns linearly to the schema (basic matching)
            columns.forEach((schemaCol, index) => {
                if (cols[index] !== undefined && schemaCol.id !== 'actions') {
                    newTrade[schemaCol.id] = cols[index].trim();
                }
            });
            
            parsedTrades.push(newTrade);
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
