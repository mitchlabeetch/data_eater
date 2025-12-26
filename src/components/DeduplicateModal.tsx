import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { query } from '../services/duckdb';
import { CopyX, X, Loader2, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import clsx from 'clsx';

interface DeduplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeduplicateModal: React.FC<DeduplicateModalProps> = ({ isOpen, onClose }) => {
  const { columns, executeMutation, rowCount } = useDataStore();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<'FIRST' | 'LAST'>('FIRST');
  const [matchMode, setMatchMode] = useState<'EXACT' | 'SMART'>('EXACT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      if (selectedKeys.length === 0) {
        setPreviewCount(null);
        return;
      }
      try {
        // Build keys based on mode
        const cols = selectedKeys.map(k => 
          matchMode === 'EXACT' ? `"${k}"` : `TRIM(UPPER("${k}"))`
        ).join(', ');

        // Count total rows minus distinct combinations of selected columns
        const sql = `
          SELECT (SELECT count(*) FROM current_dataset) - 
                 (SELECT count(*) FROM (SELECT DISTINCT ${cols} FROM current_dataset)) as removed_count
        `;
        const res = await query(sql);
        setPreviewCount(Number(res[0].removed_count));
      } catch (e) {
        console.error("Preview Dedup Error", e);
      }
    };
    const timeout = setTimeout(fetchPreview, 300); // Debounce
    return () => clearTimeout(timeout);
  }, [selectedKeys, matchMode]);

  const handleDedup = async () => {
    if (selectedKeys.length === 0) return;
    setIsProcessing(true);

    try {
      // Build partition keys
      const partitionCols = selectedKeys.map(k => 
        matchMode === 'EXACT' ? `"${k}"` : `TRIM(UPPER("${k}"))`
      ).join(', ');
      
      const orderDir = strategy === 'FIRST' ? 'ASC' : 'DESC';
      
      const sql = `
        CREATE OR REPLACE TABLE dedup_temp AS 
        SELECT * EXCLUDE (rn) FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY ${partitionCols} ORDER BY rowid ${orderDir}) as rn 
          FROM current_dataset
        ) WHERE rn = 1;
        
        DROP TABLE current_dataset;
        ALTER TABLE dedup_temp RENAME TO current_dataset;
      `;
      
      await executeMutation(sql, `Dédoublonnage (${matchMode === 'SMART' ? 'Intelligent' : 'Strict'}) : -${previewCount} lignes`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors du dédoublonnage. Vérifiez la console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleKey = (col: string) => {
    setSelectedKeys(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const selectAll = () => setSelectedKeys(columns.map(c => c.name));
  const selectNone = () => setSelectedKeys([]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><CopyX size={20} className="text-primary" />Dédoublonnage Avancé</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">1. Colonnes Clés (Définition du Doublon)</label>
                <div className="flex gap-2">
                    <button onClick={selectAll} className="text-[10px] flex items-center gap-1 text-primary hover:text-white transition-colors"><CheckSquare size={12}/> Tout</button>
                    <button onClick={selectNone} className="text-[10px] flex items-center gap-1 text-text-muted hover:text-white transition-colors"><Square size={12}/> Rien</button>
                </div>
            </div>
            
            {/* MATCH MODE TOGGLE */}
            <div className="flex p-1 bg-background-dark border border-border-dark rounded-lg mb-2">
               <button onClick={() => setMatchMode('EXACT')} className={clsx("flex-1 py-1.5 rounded text-[10px] font-bold transition-all", matchMode === 'EXACT' ? "bg-surface-active text-white shadow-sm" : "text-text-muted hover:text-white")}>
                 STRICT (Identique)
               </button>
               <button onClick={() => setMatchMode('SMART')} className={clsx("flex-1 py-1.5 rounded text-[10px] font-bold transition-all", matchMode === 'SMART' ? "bg-primary text-background-dark shadow-sm" : "text-text-muted hover:text-white")}>
                 INTELLIGENT (Sans casse/espaces)
               </button>
            </div>

            <p className="text-[11px] text-text-muted italic">Les lignes ayant les mêmes valeurs pour <strong className="text-white">toutes</strong> les colonnes cochées seront considérées comme des doublons.</p>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
              {columns.map(c => (
                <button key={c.name} onClick={() => toggleKey(c.name)} className={clsx("text-left px-2 py-1.5 rounded border text-[10px] font-mono transition-all truncate", selectedKeys.includes(c.name) ? "bg-primary/20 border-primary text-primary font-bold" : "bg-background-dark border-border-dark text-text-muted hover:border-primary/30")}>{c.name}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">2. Stratégie de Conservation</label>
            <div className="flex gap-4">
              <button onClick={() => setStrategy('FIRST')} className={clsx("flex-1 p-4 rounded-xl border transition-all text-left space-y-1", strategy === 'FIRST' ? "bg-primary/5 border-primary" : "bg-surface-active/30 border-border-dark opacity-50")}>
                <p className="text-xs font-bold text-white">Garder la première</p>
                <p className="text-[10px] text-text-muted">Conserve la ligne apparaissant en premier (Originale).</p>
              </button>
              <button onClick={() => setStrategy('LAST')} className={clsx("flex-1 p-4 rounded-xl border transition-all text-left space-y-1", strategy === 'LAST' ? "bg-primary/5 border-primary" : "bg-surface-active/30 border-border-dark opacity-50")}>
                <p className="text-xs font-bold text-white">Garder la dernière</p>
                <p className="text-[10px] text-text-muted">Conserve la ligne la plus récente (Dernière).</p>
              </button>
            </div>
          </div>
          
          <div className="bg-surface-active/50 rounded-lg p-3 border border-border-dark flex items-center justify-between">
             <span className="text-xs font-medium text-text-muted">Lignes à supprimer (Doublons) :</span>
             <span className={clsx("text-sm font-black mono", previewCount && previewCount > 0 ? "text-red-400" : "text-emerald-400")}>
                {previewCount !== null ? (
                    <>{previewCount.toLocaleString()} ligne{previewCount > 1 ? 's' : ''} ({((previewCount / rowCount) * 100).toFixed(1)}%)</>
                ) : (
                    "Sélectionnez des colonnes..."
                )}
             </span>
          </div>
          
          {previewCount !== null && (previewCount / rowCount) > 0.9 && (
             <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
               <span className="text-xl">🚨</span>
               <p className="text-[11px] text-red-200 leading-relaxed font-bold">
                 Attention : Vous allez supprimer plus de 90% de vos données !
                 <br/><span className="font-normal opacity-80">Vérifiez que vous avez sélectionné assez de colonnes pour définir l'unicité (ex: ID, Date...).</span>
               </p>
             </div>
          )}

        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs">ANNULER</button>
          <button disabled={selectedKeys.length === 0 || isProcessing || previewCount === 0} onClick={handleDedup} className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {previewCount ? `SUPPRIMER ${previewCount}` : 'DÉDOUBLONNER'}
          </button>
        </div>
      </div>
    </div>
  );
};