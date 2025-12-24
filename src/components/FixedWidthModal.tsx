import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { Monitor, X, Ruler } from 'lucide-react';
import clsx from 'clsx';

interface FixedWidthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FixedWidthModal: React.FC<FixedWidthModalProps> = ({ isOpen, onClose }) => {
  const { columns, fetchRows } = useDataStore();
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [totalLength, setTotalLength] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, number> = {};
      columns.forEach(c => { initial[c.name] = 15; });
      setWidths(initial);
      loadData();
    }
  }, [isOpen, columns]);

  const loadData = async () => {
    const rows = await fetchRows(10);
    setPreviewRows(rows);
  };

  useEffect(() => {
    setTotalLength(Object.values(widths).reduce((a, b) => a + b, 0));
  }, [widths]);

  const updateWidth = (col: string, val: number) => {
    setWidths(prev => ({ ...prev, [col]: Math.max(1, val) }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#050a05] border-2 border-[#13ec5b]/30 w-full max-w-6xl h-[85vh] rounded-lg shadow-[0_0_50px_rgba(19,236,91,0.1)] flex flex-col overflow-hidden font-mono text-[#13ec5b]">
        <div className="p-4 border-b border-[#13ec5b]/30 bg-[#0a150a] flex justify-between items-center select-none">
          <div className="flex items-center gap-4"><Monitor size={24} className="animate-pulse" /><div><h2 className="text-lg font-black tracking-[0.2em] uppercase">Visualiseur Plein Écran (80/132)</h2><p className="text-[10px] opacity-70 italic">Mode compatible Robertet Legacy / AS400 Standard</p></div></div>
          <button onClick={onClose} className="p-2 hover:bg-[#13ec5b]/20 rounded transition-colors text-[#13ec5b]"><X size={24} /></button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-[#13ec5b]/30 p-4 space-y-6 overflow-y-auto custom-scrollbar bg-[#0a150a]/50">
             <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Ruler size={12} /> Réglages Largeurs</label><div className="space-y-3">{columns.map(c => (<div key={c.name} className="space-y-1"><div className="flex justify-between text-[10px] uppercase font-bold opacity-60"><span className="truncate max-w-[120px]">{c.name}</span><span>{widths[c.name]}</span></div><input type="range" min="1" max="100" value={widths[c.name] || 10} onChange={e => updateWidth(c.name, parseInt(e.target.value))} className="w-full accent-[#13ec5b] bg-[#13ec5b]/10 h-1 rounded-full cursor-pointer" /></div>))}</div></div>
             <div className="p-3 border border-[#13ec5b]/30 bg-black/50 rounded space-y-2"><p className="text-[10px] font-bold uppercase underline">Statut du Bloc</p><div className="flex justify-between text-xs"><span>Largeur Totale:</span><span className="font-black">{totalLength} ch</span></div><div className="text-[9px] opacity-50 leading-tight">Standard AS400: 80 chars <br/>Impression Large: 132 chars</div></div>
          </div>
          <div className="flex-1 bg-black/80 flex flex-col overflow-hidden">
            <div className="h-8 bg-[#13ec5b]/5 border-b border-[#13ec5b]/20 flex items-center text-[9px] font-black select-none overflow-hidden">{Array.from({ length: 200 }).map((_, i) => (<div key={i} className="shrink-0 flex flex-col items-center w-[8px]"><div className={clsx("h-1.5 w-px bg-[#13ec5b]/30", i % 10 === 0 && "h-3 bg-[#13ec5b]", i % 5 === 0 && "h-2")}></div>{i % 10 === 0 && <span className="mt-0.5">{i}</span>}</div>))}</div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar-green"><div className="inline-block min-w-full"><div className="flex border-b border-[#13ec5b]/20 pb-1 mb-2">{columns.map(c => (<div key={c.name} style={{ width: `${(widths[c.name] || 10) * 8}px` }} className="shrink-0 font-black text-[11px] uppercase truncate border-r border-[#13ec5b]/10 pr-1">{c.name}</div>))}</div><div className="space-y-1">{previewRows.map((row, i) => (<div key={i} className="flex hover:bg-[#13ec5b]/5 transition-colors group">{columns.map(c => (<div key={c.name} style={{ width: `${(widths[c.name] || 10) * 8}px` }} className="shrink-0 text-[11px] font-mono whitespace-pre border-r border-[#13ec5b]/5 pr-1 opacity-80 group-hover:opacity-100">{String(row[c.name] || '').substring(0, widths[c.name]).padEnd(widths[c.name], ' ')}</div>))}</div>))}</div></div></div>
          </div>
        </div>
        <div className="p-4 border-t border-[#13ec5b]/30 bg-[#0a150a] flex justify-end gap-4 items-center"><p className="text-[10px] italic opacity-50 mr-auto">Visualisation en temps réel du formatage "Fixed-Length"</p><button onClick={onClose} className="px-6 py-2 border border-[#13ec5b]/50 hover:bg-[#13ec5b]/10 font-bold text-sm tracking-widest">TERMINER</button></div>
      </div>
    </div>
  );
};