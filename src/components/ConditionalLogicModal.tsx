import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { query } from '../services/duckdb';
import { GitBranch, X, Loader2, ArrowRight } from 'lucide-react';

interface ConditionalLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConditionalLogicModal: React.FC<ConditionalLogicModalProps> = ({ isOpen, onClose }) => {
  const { columns, executeMutation } = useDataStore();
  const [newColName, setNewColName] = useState<string>('categorie_calculee');
  const [conditionCol, setConditionCol] = useState<string>('');
  const [operator, setOperator] = useState<string>('=');
  const [matchValue, setMatchValue] = useState<string>('');
  const [thenValue, setThenValue] = useState<string>('');
  const [elseValue, setElseValue] = useState<string>('');
  
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && conditionCol && matchValue) {
      loadPreview();
    }
  }, [isOpen, conditionCol, operator, matchValue, thenValue, elseValue]);

  const loadPreview = async () => {
    setError(null);
    try {
      const sql = `
        SELECT 
          CASE 
            WHEN "${conditionCol}" ${operator} '${matchValue.replace(/'/g, "''")}' 
            THEN '${thenValue.replace(/'/g, "''")}' 
            ELSE '${elseValue.replace(/'/g, "''")}' 
          END as result 
        FROM current_dataset LIMIT 5
      `;
      const res = await query(sql);
      setPreviewData(res.map(r => r.result));
    } catch (e: any) {
      setError("Erreur dans la condition. Vérifiez les types.");
    }
  };

  const handleApply = async () => {
    if (!newColName || !conditionCol) return;
    setIsProcessing(true);

    try {
      await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS "${newColName}" VARCHAR`);
      const sql = `
        UPDATE current_dataset SET "${newColName}" = 
        CASE 
          WHEN "${conditionCol}" ${operator} '${matchValue.replace(/'/g, "''")}' 
          THEN '${thenValue.replace(/'/g, "''")}' 
          ELSE '${elseValue.replace(/'/g, "''")}' 
        END
      `;
      await executeMutation(sql, `Logique SI/ALORS: ${newColName}`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'application de la logique.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitBranch size={20} className="text-primary" />
            Logique Conditionnelle (SI / ALORS)
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-muted">Nom de la nouvelle colonne</label>
            <input 
              type="text"
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-sm text-white focus:border-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-muted italic text-primary">SI (Colonne)</label>
              <select 
                value={conditionCol}
                onChange={e => setConditionCol(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-xs text-white focus:border-primary outline-none"
              >
                <option value="">Choisir...</option>
                {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <select 
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-xs text-white focus:border-primary outline-none"
              >
                <option value="=">=</option>
                <option value="!=">!=</option>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="LIKE">Contient</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-text-muted">Valeur de test</label>
              <input 
                type="text"
                value={matchValue}
                onChange={e => setMatchValue(e.target.value)}
                placeholder="Ex: Robertet"
                className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-xs text-white focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <label className="text-[10px] font-black uppercase text-primary">ALORS (Résultat)</label>
              <input 
                type="text"
                value={thenValue}
                onChange={e => setThenValue(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded p-2 text-xs text-white outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-2 p-4 bg-surface-active/30 border border-border-dark rounded-xl">
              <label className="text-[10px] font-black uppercase text-text-muted">SINON (Défaut)</label>
              <input 
                type="text"
                value={elseValue}
                onChange={e => setElseValue(e.target.value)}
                className="w-full bg-background-dark border border-border-dark rounded p-2 text-xs text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle">Aperçu (Top 5)</h3>
             <div className="bg-background-dark rounded border border-border-dark p-2 flex flex-wrap gap-2 min-h-[40px]">
                {previewData.map((v, i) => (
                  <span key={i} className="text-xs font-mono bg-surface-active px-2 py-1 rounded text-primary border border-primary/10">
                    {v === null ? 'NULL' : String(v)}
                  </span>
                ))}
                {!matchValue && <span className="text-xs text-text-subtle italic p-1">Configurez la condition...</span>}
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">ANNULER</button>
          <button 
            disabled={!conditionCol || isProcessing || !!error}
            onClick={handleApply}
            className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-30"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            CRÉER LA COLONNE
          </button>
        </div>
      </div>
    </div>
  );
};