import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { Ruler, X, Play, Loader2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface UnitConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONVERSIONS: Record<string, any> = {
  MASS: [
    { label: 'kg -> lb', factor: 2.20462 },
    { label: 'lb -> kg', factor: 0.453592 },
    { label: 'g -> oz', factor: 0.035274 },
    { label: 'oz -> g', factor: 28.3495 }
  ],
  DISTANCE: [
    { label: 'm -> ft', factor: 3.28084 },
    { label: 'ft -> m', factor: 0.3048 },
    { label: 'km -> mi', factor: 0.621371 },
    { label: 'mi -> km', factor: 1.60934 }
  ],
  VOLUME: [
    { label: 'L -> gal (US)', factor: 0.264172 },
    { label: 'gal (US) -> L', factor: 3.78541 }
  ]
};

export const UnitConverterModal: React.FC<UnitConverterModalProps> = ({ isOpen, onClose }) => {
  const { selectedColumn, executeMutation, fetchRows } = useDataStore();
  const [category, setCategory] = useState('MASS');
  const [selectedConv, setSelectedConv] = useState(CONVERSIONS.MASS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && selectedColumn) { loadPreview(); }
  }, [isOpen, selectedColumn, selectedConv]);

  const loadPreview = async () => {
    if (!selectedColumn) return;
    const rows = await fetchRows(5);
    const results = rows.map(r => {
      const val = Number(r[selectedColumn] || 0);
      return { raw: val, converted: val * selectedConv.factor };
    });
    setPreview(results);
  };

  const handleApply = async () => {
    if (!selectedColumn) return;
    setIsProcessing(true);
    try {
      const newCol = `${selectedColumn}_conv`;
      await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS "${newCol}" DOUBLE`);
      await executeMutation(`UPDATE current_dataset SET "${newCol}" = "${selectedColumn}" * ${selectedConv.factor}`, `Conversion d'unité: ${selectedConv.label}`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la conversion.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !selectedColumn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Ruler size={20} className="text-primary" />Convertisseur d'Unités</h2><button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button></div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-text-muted">Type de Mesure</label>
            <div className="flex gap-2">
              {Object.keys(CONVERSIONS).map(cat => (<button key={cat} onClick={() => { setCategory(cat); setSelectedConv(CONVERSIONS[cat][0]); }} className={clsx("flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all", category === cat ? "bg-primary/10 border-primary text-primary" : "bg-surface-active border-border-dark text-text-muted")}>{cat}</button>))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-muted">Conversion</label>
            <div className="grid grid-cols-1 gap-1">
              {CONVERSIONS[category].map((c: any) => (<button key={c.label} onClick={() => setSelectedConv(c)} className={clsx("w-full text-left px-3 py-2 rounded text-xs font-bold border transition-all", selectedConv.label === c.label ? "bg-primary text-background-dark border-primary" : "bg-background-dark border-border-dark text-white hover:border-primary/50")}>{c.label}</button>))}
            </div>
          </div>
          <div className="space-y-3">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle">Aperçu (Top 5)</h3>
             <div className="bg-background-dark/50 rounded-xl border border-border-dark divide-y divide-border-dark/50 overflow-hidden font-mono">
                {preview.map((p, i) => (<div key={i} className="p-2 flex items-center justify-between text-[10px]"><span className="text-text-muted">{p.raw}</span><ArrowRight size={12} className="text-primary opacity-30" /><span className="text-primary font-bold">{p.converted.toFixed(3)}</span></div>))}
             </div>
          </div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">ANNULER</button>
          <button disabled={isProcessing} onClick={handleApply} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all">{isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}CONVERTIR</button>
        </div>
      </div>
    </div>
  );
};