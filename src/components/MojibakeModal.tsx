import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { Wand2, X, Loader2, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface MojibakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOJIBAKE_MAP: Record<string, string> = {
  'Ã©': 'é', 'Ã ': 'à', 'Ã¨': 'è', 'Ã¹': 'ù', 'Ã¢': 'â',
  'Ãª': 'ê', 'Ã®': 'î', 'Ã´': 'ô', 'Ã»': 'û', 'Ã«': 'ë',
  'Ã¯': 'ï', 'Ã¼': 'ü', 'Ã§': 'ç', 'Ã': 'À', 'Ã\u0089': 'É',
  'Â°': '°', 'â\u0082¬': '€', 'Ã\u008A': 'Ê', 'â\u0080\u0099': "'",
  'â\u0080\u0093': '–', 'â\u0080\u0094': '—'
};

export const MojibakeModal: React.FC<MojibakeModalProps> = ({ isOpen, onClose }) => {
  const { selectedColumn, executeMutation, fetchRows } = useDataStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [foundCount, setFoundCount] = useState(0);

  useEffect(() => {
    if (isOpen && selectedColumn) {
      loadPreview();
    }
  }, [isOpen, selectedColumn]);

  const loadPreview = async () => {
    if (!selectedColumn) return;
    const rows = await fetchRows(10);
    const results = rows.map(r => {
      let val = String(r[selectedColumn] || '');
      let fixed = val;
      Object.entries(MOJIBAKE_MAP).forEach(([bad, good]) => {
        fixed = fixed.split(bad).join(good);
      });
      return { raw: val, fixed, changed: val !== fixed };
    });
    setPreview(results);
    setFoundCount(results.filter(r => r.changed).length);
  };

  const handleApply = async () => {
    if (!selectedColumn) return;
    setIsProcessing(true);
    try {
      let sql = `"${selectedColumn}"`;
      Object.entries(MOJIBAKE_MAP).forEach(([bad, good]) => {
        const b = bad.replace(/'/g, "''");
        const g = good.replace(/'/g, "''");
        sql = `replace(${sql}, '${b}', '${g}')`;
      });
      await executeMutation(`UPDATE current_dataset SET "${selectedColumn}" = ${sql}`, `Réparation encodage: ${selectedColumn}`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la réparation.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !selectedColumn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Wand2 size={20} className="text-primary" />Réparateur d'Encodage</h2><button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button></div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-muted">Aperçu des Réparations</label>
            <div className="bg-background-dark/50 rounded-xl border border-border-dark divide-y divide-border-dark/50 overflow-hidden font-mono text-[10px]">
               {preview.map((p, i) => (
                 <div key={i} className={clsx("p-2 space-y-1", p.changed ? "bg-primary/5" : "opacity-50")}>
                    <div className="flex justify-between"><span className="text-red-400/70 truncate max-w-[150px]">{p.raw}</span>{p.changed && <CheckCircle2 size={12} className="text-primary" />}</div>
                    {p.changed && (<div className="text-primary font-bold">{p.fixed}</div>)}
                 </div>
               ))}
               {foundCount === 0 && (<div className="p-8 text-center text-subtle italic">Aucun problème d'encodage détecté sur l'échantillon.</div>)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-active/30 border border-border-dark text-[11px] text-text-muted leading-relaxed">Corrige les erreurs de lecture UTF-8 (ex: <code className="text-white">Ã©</code> devient <code className="text-white">é</code>). <br/>Utile pour les vieux exports AS400.</div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs">ANNULER</button>
          <button disabled={isProcessing} onClick={handleApply} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all">{isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}RÉPARER TOUT</button>
        </div>
      </div>
    </div>
  );
};