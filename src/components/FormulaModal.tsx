import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { query } from '../services/duckdb';
import { Calculator, X, Loader2, Plus, Info } from 'lucide-react';
import clsx from 'clsx';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaModal: React.FC<FormulaModalProps> = ({ isOpen, onClose }) => {
  const { columns, executeMutation } = useDataStore();
  const [formula, setFormula] = useState<string>('');
  const [newColName, setNewColName] = useState<string>('calcul_resultat');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericColumns = columns.filter(c => 
    ['DOUBLE', 'DECIMAL', 'INTEGER', 'BIGINT'].includes(c.type.toUpperCase())
  );

  useEffect(() => {
    if (isOpen && formula) {
      const timer = setTimeout(loadPreview, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, formula]);

  const loadPreview = async () => {
    if (!formula) return;
    setError(null);
    try {
      const sql = `SELECT ${formula} as result FROM current_dataset LIMIT 5`;
      const res = await query(sql);
      setPreviewData(res.map(r => r.result));
    } catch (e: any) {
      setError("Expression invalide. Vérifiez les noms de colonnes et les opérateurs.");
    }
  };

  const handleApply = async () => {
    if (!formula || !newColName) return;
    setIsProcessing(true);

    try {
      await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS "${newColName}" DOUBLE`);
      await executeMutation(`UPDATE current_dataset SET "${newColName}" = ${formula}`, `Calcul: ${newColName}`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'application de la formule.");
    } finally {
      setIsProcessing(false);
    }
  };

  const insertCol = (name: string) => {
    setFormula(prev => prev + ` "${name}" `);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Calculator size={20} className="text-primary" />Calculateur de Colonne</h2><button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button></div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-muted">Nom de la nouvelle colonne</label><input type="text" value={newColName} onChange={e => setNewColName(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-sm text-white focus:border-primary outline-none" /></div><div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-2"><Info size={14} className="text-primary mt-0.5 shrink-0" /><p className="text-[10px] text-text-muted leading-tight">Utilisez les noms de colonnes entre guillemets. <br/>Ex: <code className="text-white">("Prix" * "Quantite") * 1.2</code></p></div></div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-muted">Formule Mathématique</label>
            <textarea value={formula} onChange={e => setFormula(e.target.value)} placeholder='Ex: "ColA" + "ColB" / 2' className={clsx("w-full h-24 bg-background-dark border rounded-lg p-3 text-sm font-mono focus:outline-none transition-colors", error ? "border-red-500/50" : "border-border-dark focus:border-primary")} />
            {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}
          </div>
          <div className="space-y-3">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle">Insérer une Colonne</h3>
             <div className="flex flex-wrap gap-2">
                {numericColumns.map(c => (<button key={c.name} onClick={() => insertCol(c.name)} className="px-2 py-1 rounded bg-surface-active border border-border-dark text-[10px] font-mono text-white hover:border-primary transition-all">{c.name}</button>))}
                {numericColumns.length === 0 && <span className="text-[10px] text-text-subtle italic">Aucune colonne numérique détectée.</span>}
             </div>
          </div>
          <div className="space-y-2">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle">Aperçu du résultat (Top 5)</h3>
             <div className="bg-background-dark rounded border border-border-dark p-2 flex flex-wrap gap-2 min-h-[40px]">
                {previewData.map((v, i) => (<span key={i} className="text-xs font-mono bg-surface-active px-2 py-1 rounded text-primary">{v === null ? 'NULL' : String(v)}</span>))}
                {!formula && <span className="text-xs text-text-subtle italic p-1">En attente de formule...</span>}
             </div>
          </div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs">ANNULER</button>
          <button disabled={!formula || !newColName || isProcessing || !!error} onClick={handleApply} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all">{isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}CRÉER LA COLONNE</button>
        </div>
      </div>
    </div>
  );
};