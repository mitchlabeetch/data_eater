import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { Banknote, X, Loader2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface CurrencyNormalizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencyNormalizerModal: React.FC<CurrencyNormalizerModalProps> = ({ isOpen, onClose }) => {
  const { selectedColumn, executeMutation, fetchRows } = useDataStore();
  const [decimalSep, setDecimalSep] = useState<'.' | ','>('.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && selectedColumn) {
      loadPreview();
    }
  }, [isOpen, selectedColumn, decimalSep]);

  const loadPreview = async () => {
    if (!selectedColumn) return;
    const rows = await fetchRows(5);
    const results = rows.map(r => {
      const val = String(r[selectedColumn] || '').trim();
      let clean = val.replace(/[^\d.,-]/g, '').replace(/\s/g, '');
      if (decimalSep === ',') {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
      return { raw: val, clean: parseFloat(clean) || 0 };
    });
    setPreview(results);
  };

  const handleApply = async () => {
    if (!selectedColumn) return;
    setIsProcessing(true);

    try {
      let cleanSql = `regexp_replace("${selectedColumn}", '[^0-9.,\\-]', '', 'g')`;
      if (decimalSep === ',') {
        cleanSql = `replace(replace(${cleanSql}, '.', ''), ',', '.')`;
      } else {
        cleanSql = `replace(${cleanSql}, ',', '')`;
      }

      await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS "${selectedColumn}_num" DOUBLE`);
      await executeMutation(`UPDATE current_dataset SET "${selectedColumn}_num" = CAST(${cleanSql} AS DOUBLE)`, `Normalisation monétaire: ${selectedColumn}`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la conversion numérique.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !selectedColumn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Banknote size={20} className="text-primary" />
            Normalisation Monétaire
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-text-muted">Séparateur Décimal Actuel</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setDecimalSep('.')}
                className={clsx(
                  "flex-1 p-3 rounded-xl border transition-all text-sm font-bold",
                  decimalSep === '.' ? "bg-primary/10 border-primary text-primary" : "bg-surface-active border-border-dark text-text-muted"
                )}
              >
                Point (US: 1,200.50)
              </button>
              <button 
                onClick={() => setDecimalSep(',')}
                className={clsx(
                  "flex-1 p-3 rounded-xl border transition-all text-sm font-bold",
                  decimalSep === ',' ? "bg-primary/10 border-primary text-primary" : "bg-surface-active border-border-dark text-text-muted"
                )}
              >
                Virgule (EU: 1.200,50)
              </button>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle">Aperçu Numérique</h3>
             <div className="bg-background-dark/50 rounded-xl border border-border-dark divide-y divide-border-dark/50 overflow-hidden font-mono">
                {preview.map((p, i) => (
                  <div key={i} className="p-2 flex items-center justify-between text-[10px]">
                    <span className="text-text-muted truncate max-w-[100px]">{p.raw || '...'}</span>
                    <ArrowRight size={12} className="text-primary opacity-30" />
                    <span className="text-primary font-bold">{p.clean.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-active/30 border border-border-dark text-[11px] text-text-muted leading-relaxed italic text-center">
            Une nouvelle colonne <strong className="text-white">"{selectedColumn}_num"</strong> sera créée avec des valeurs numériques pures.
          </div>
        </div>

        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">ANNULER</button>
          <button 
            disabled={isProcessing}
            onClick={handleApply}
            className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
            CONVERTIR
          </button>
        </div>
      </div>
    </div>
  );
};