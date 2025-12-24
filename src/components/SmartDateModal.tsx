import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { Calendar, X, Play, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { DateTime } from 'luxon';

interface SmartDateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POSSIBLE_FORMATS = [
  { label: 'Français (DD/MM/YYYY)', fmt: 'dd/MM/yyyy', sql: '%d/%m/%Y' },
  { label: 'US (MM/DD/YYYY)', fmt: 'MM/dd/yyyy', sql: '%m/%d/%Y' },
  { label: 'ISO (YYYY-MM-DD)', fmt: 'yyyy-MM-dd', sql: '%Y-%m-%d' },
  { label: 'Compact (YYYYMMDD)', fmt: 'yyyyMMdd', sql: '%Y%m%d' }
];

export const SmartDateModal: React.FC<SmartDateModalProps> = ({ isOpen, onClose }) => {
  const { selectedColumn, fetchRows, executeMutation } = useDataStore();
  const [detectedFormat, setDetectedFormat] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && selectedColumn) { detectFormat(); }
  }, [isOpen, selectedColumn]);

  const detectFormat = async () => {
    if (!selectedColumn) return;
    setIsAnalyzing(true);
    setDetectedFormat(null);
    try {
      const rows = await fetchRows(50);
      const values = rows.map(r => String(r[selectedColumn] || '')).filter(v => v.length > 4);
      if (values.length === 0) { setIsAnalyzing(false); return; }
      const scores = POSSIBLE_FORMATS.map(f => {
        const matches = values.filter(v => DateTime.fromFormat(v, f.fmt).isValid).length;
        return { ...f, score: matches };
      });
      const best = scores.sort((a, b) => b.score - a.score)[0];
      if (best.score > 0) {
        setDetectedFormat(best);
        setPreview(values.slice(0, 5).map(v => { const dt = DateTime.fromFormat(v, best.fmt); return dt.isValid ? dt.toISODate()! : 'ERR'; }));
      }
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  const handleApply = async () => {
    if (!selectedColumn || !detectedFormat) return;
    setIsApplying(true);
    try {
      const sql = `UPDATE current_dataset SET "${selectedColumn}" = strftime(strptime("${selectedColumn}", '${detectedFormat.sql}'), '%Y-%m-%d') WHERE "${selectedColumn}" IS NOT NULL`;
      await executeMutation(sql, `Smart Date Fix: ${selectedColumn} as ${detectedFormat.label}`);
      onClose();
    } catch (e) { console.error(e); alert("Erreur lors de la conversion des dates."); } finally { setIsApplying(false); }
  };

  if (!isOpen || !selectedColumn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Calendar size={20} className="text-primary" />Standardisation Inteligente</h2><button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button></div>
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2"><p className="text-xs text-text-muted uppercase font-black tracking-widest">Format Détecté</p>{isAnalyzing ? (<div className="flex items-center justify-center gap-2 text-primary font-mono py-4"><Loader2 size={18} className="animate-spin" />Analyse en cours...</div>) : detectedFormat ? (<div className="py-2 px-4 bg-primary/10 border border-primary/30 rounded-xl inline-block"><span className="text-primary font-bold">{detectedFormat.label}</span></div>) : (<div className="text-red-400 flex items-center justify-center gap-2 py-4 italic text-sm"><AlertCircle size={16} />Format inconnu ou colonne vide.</div>)}</div>
          {detectedFormat && (
            <div className="space-y-3"><h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle text-center">Aperçu de la Conversion</h3><div className="bg-background-dark/50 rounded-xl border border-border-dark overflow-hidden">{preview.map((p, i) => (<div key={i} className="flex items-center justify-between p-2 border-b border-border-dark/50 last:border-0 text-xs font-mono"><span className="text-text-subtle">...</span><ArrowRight size={12} className="text-primary opacity-50" /><span className="text-primary font-bold">{p}</span></div>))}</div></div>
          )}
          <div className="p-4 rounded-xl bg-surface-active/30 border border-border-dark text-[11px] text-text-muted leading-relaxed">Toutes les dates seront converties au format <strong>ISO (AAAA-MM-JJ)</strong> pour une compatibilité maximale.</div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs">ANNULER</button>
          <button disabled={!detectedFormat || isApplying} onClick={handleApply} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all">{isApplying ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}CONVERTIR TOUT</button>
        </div>
      </div>
    </div>
  );
};
