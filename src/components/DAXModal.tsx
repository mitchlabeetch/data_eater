import React, { useState } from 'react';
import { useDataStore } from '../stores/dataStore';
import { Sigma, X, Copy, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface DAXModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DAXModal: React.FC<DAXModalProps> = ({ isOpen, onClose }) => {
  const { columns, fileMeta } = useDataStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const tableName = fileMeta ? fileMeta.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Table';

  const suggestions: Array<{ id: string, label: string, formula: string }> = [];

  columns.forEach(c => {
    const isNum = ['DOUBLE', 'DECIMAL', 'INTEGER', 'BIGINT'].includes(c.type.toUpperCase());
    const isDate = /date|time/i.test(c.type) || /date|time/i.test(c.name);

    if (isNum) {
      suggestions.push({
        id: `sum_${c.name}`,
        label: `Total ${c.name}`,
        formula: `${c.name} Total = SUM('${tableName}'[${c.name}])`
      });
      suggestions.push({
        id: `avg_${c.name}`,
        label: `Moyenne ${c.name}`,
        formula: `${c.name} Moyenne = AVERAGE('${tableName}'[${c.name}])`
      });
    } else if (isDate) {
      suggestions.push({
        id: `count_${c.name}`,
        label: `Nombre de ${c.name}`,
        formula: `${c.name} Count = COUNT('${tableName}'[${c.name}])`
      });
    } else {
      suggestions.push({
        id: `dist_${c.name}`,
        label: `Unicité ${c.name}`,
        formula: `${c.name} Uniques = DISTINCTCOUNT('${tableName}'[${c.name}])`
      });
    }
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sigma size={20} className="text-yellow-500" />Assistant DAX (PowerBI)</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
          <p className="text-sm text-text-muted leading-relaxed">Copiez ces mesures de base pour démarrer votre rapport PowerBI avec la table <code className="text-white bg-surface-active px-1 rounded">{tableName}</code>.</p>
          <div className="space-y-2">
             {suggestions.map((s) => (
               <div key={s.id} className="bg-background-dark/50 border border-border-dark rounded-xl p-3 flex flex-col gap-2 group hover:border-yellow-500/30 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-text-subtle tracking-widest">{s.label}</span>
                    <button onClick={() => handleCopy(s.id, s.formula)} className={clsx("flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-all", copiedId === s.id ? "bg-primary text-background-dark" : "bg-surface-active text-white hover:bg-yellow-500 hover:text-black")}>
                      {copiedId === s.id ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {copiedId === s.id ? 'COPIÉ !' : 'COPIER DAX'}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-yellow-500/90 whitespace-pre-wrap break-all">{s.formula}</pre>
               </div>
             ))}
          </div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-surface-active text-white font-bold text-xs uppercase tracking-widest hover:bg-border-dark transition-colors">FERMER</button>
        </div>
      </div>
    </div>
  );
};