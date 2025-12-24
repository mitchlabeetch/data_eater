import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { User, X, Loader2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface NameSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NameSplitterModal: React.FC<NameSplitterModalProps> = ({ isOpen, onClose }) => {
  const { selectedColumn, fetchRows, executeMutation } = useDataStore();
  const [order, setStrategy] = useState<'FIRST_LAST' | 'LAST_FIRST'>('FIRST_LAST');
  const [preview, setPreview] = useState<Array<{ first: string, last: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && selectedColumn) {
      loadPreview();
    }
  }, [isOpen, selectedColumn, order]);

  const loadPreview = async () => {
    if (!selectedColumn) return;
    const rows = await fetchRows(5);
    const split = rows.map(r => {
      const full = String(r[selectedColumn] || '').trim();
      const parts = full.split(/\s+/);
      if (parts.length < 2) return { first: full, last: '' };
      if (order === 'FIRST_LAST') return { first: parts[0], last: parts.slice(1).join(' ') };
      return { first: parts.slice(1).join(' '), last: parts[0] };
    });
    setPreview(split);
  };

  const handleApply = async () => {
    if (!selectedColumn) return;
    setIsProcessing(true);
    try {
      const firstCol = `${selectedColumn}_prenom`;
      const lastCol = `${selectedColumn}_nom`;
      await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS "${firstCol}" VARCHAR`);
      await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS "${lastCol}" VARCHAR`);
      const firstSql = order === 'FIRST_LAST' ? `list_extract(string_split("${selectedColumn}", ' '), 1)` : `array_to_string(list_slice(string_split("${selectedColumn}", ' '), 2, -1), ' ')`;
      const lastSql = order === 'FIRST_LAST' ? `array_to_string(list_slice(string_split("${selectedColumn}", ' '), 2, -1), ' ')` : `list_extract(string_split("${selectedColumn}", ' '), 1)`;
      await executeMutation(`UPDATE current_dataset SET "${firstCol}" = ${firstSql}, "${lastCol}" = ${lastSql}`, `Découpage noms: ${selectedColumn}`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors du découpage des noms.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !selectedColumn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center"><h2 className="text-lg font-bold text-white flex items-center gap-2"><User size={20} className="text-primary" />Découper Prénom / Nom</h2><button onClick={onClose} className="text-text-muted hover:text-white"><X size={20} /></button></div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-text-muted">Structure du Nom</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStrategy('FIRST_LAST')} className={clsx("p-3 rounded-xl border transition-all text-xs font-bold", order === 'FIRST_LAST' ? "bg-primary/10 border-primary text-primary" : "bg-surface-active border-border-dark text-text-muted")}>Prénom + NOM</button>
              <button onClick={() => setStrategy('LAST_FIRST')} className={clsx("p-3 rounded-xl border transition-all text-xs font-bold", order === 'LAST_FIRST' ? "bg-primary/10 border-primary text-primary" : "bg-surface-active border-border-dark text-text-muted")}>NOM + Prénom</button>
            </div>
          </div>
          <div className="space-y-3">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle">Aperçu (Top 5)</h3>
             <div className="bg-background-dark/50 rounded-xl border border-border-dark divide-y divide-border-dark/50 overflow-hidden">
                {preview.map((p, i) => (
                  <div key={i} className="p-2 flex items-center justify-between text-[10px] font-mono"><span className="text-text-muted italic truncate max-w-[80px]">...</span><ArrowRight size={12} className="text-primary opacity-30" /><div className="flex gap-2"><span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">{p.first || '?'}</span><span className="bg-surface-active text-white px-1.5 py-0.5 rounded border border-border-dark uppercase">{p.last || '?'}</span></div></div>
                ))}
             </div>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-text-muted leading-tight italic text-center">Deux nouvelles colonnes seront créées : <br/><strong className="text-primary">"{selectedColumn}_prenom"</strong> et <strong className="text-primary">"{selectedColumn}_nom"</strong></div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs uppercase tracking-widest hover:text-white">ANNULER</button>
          <button disabled={isProcessing} onClick={handleApply} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all">{isProcessing ? <Loader2 size={14} className="animate-spin" /> : <User size={14} />}DÉCOUPER</button>
        </div>
      </div>
    </div>
  );
};