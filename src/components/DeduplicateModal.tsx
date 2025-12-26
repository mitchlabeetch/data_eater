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
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      if (selectedKeys.length === 0) {
        setPreviewCount(null);
        return;
      }
      try {
        const cols = selectedKeys.map(k => `"${k}"`).join(', ');
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
  }, [selectedKeys]);

  const handleDedup = async () => {
    if (selectedKeys.length === 0) return;
    setIsProcessing(true);

    try {
      const partitionCols = selectedKeys.map(k => `"${k}"`).join(', ');
      const orderDir = strategy === 'FIRST' ? 'ASC' : 'DESC';
      const sql = `CREATE TABLE dedup_temp AS SELECT * EXCLUDE (rn) FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY ${partitionCols} ORDER BY rowid ${orderDir}) as rn FROM current_dataset) WHERE rn = 1`;
      await query(sql);
      await executeMutation(`DROP TABLE current_dataset`, "Préparation dédoublonnage");
      await executeMutation(`ALTER TABLE dedup_temp RENAME TO current_dataset`, `Dédoublonnage sur ${selectedKeys.length} colonnes`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors du dédoublonnage.");
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
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">1. Colonnes à vérifier (Unicité)</label>
                <div className="flex gap-2">
                    <button onClick={selectAll} className="text-[10px] flex items-center gap-1 text-primary hover:text-white transition-colors"><CheckSquare size={12}/> Tout Cocher</button>
                    <button onClick={selectNone} className="text-[10px] flex items-center gap-1 text-text-muted hover:text-white transition-colors"><Square size={12}/> Tout Décocher</button>
                </div>
            </div>
            <p className="text-[11px] text-text-muted italic">Si ces colonnes sont identiques, la ligne est considérée comme un doublon.</p>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
              {columns.map(c => (
                <button key={c.name} onClick={() => toggleKey(c.name)} className={clsx("text-left px-2 py-1.5 rounded border text-[10px] font-mono transition-all", selectedKeys.includes(c.name) ? "bg-primary/20 border-primary text-primary font-bold" : "bg-background-dark border-border-dark text-text-muted hover:border-primary/30")}>{c.name}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">2. Règle de Conservation</label>
            <div className="flex gap-4">
              <button onClick={() => setStrategy('FIRST')} className={clsx("flex-1 p-4 rounded-xl border transition-all text-left space-y-1", strategy === 'FIRST' ? "bg-primary/5 border-primary" : "bg-surface-active/30 border-border-dark opacity-50")}>
                <p className="text-xs font-bold text-white">Garder le premier</p>
                <p className="text-[10px] text-text-muted">Conserve la ligne qui apparaît en premier dans le fichier.</p>
              </button>
              <button onClick={() => setStrategy('LAST')} className={clsx("flex-1 p-4 rounded-xl border transition-all text-left space-y-1", strategy === 'LAST' ? "bg-primary/5 border-primary" : "bg-surface-active/30 border-border-dark opacity-50")}>
                <p className="text-xs font-bold text-white">Garder le dernier</p>
                <p className="text-[10px] text-text-muted">Conserve la version la plus récente (dernière ligne).</p>
              </button>
            </div>
          </div>
          
          <div className="bg-surface-active/50 rounded-lg p-3 border border-border-dark flex items-center justify-between">
             <span className="text-xs font-medium text-text-muted">Estimation suppression :</span>
             <span className={clsx("text-sm font-black mono", previewCount && previewCount > 0 ? "text-red-400" : "text-emerald-400")}>
                {previewCount !== null ? (
                    <>{previewCount.toLocaleString()} ligne{previewCount > 1 ? 's' : ''} ({((previewCount / rowCount) * 100).toFixed(1)}%)</>
                ) : (
                    "Sélectionnez des colonnes..."
                )}
             </span>
          </div>

        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs">ANNULER</button>
          <button disabled={selectedKeys.length === 0 || isProcessing || previewCount === 0} onClick={handleDedup} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {previewCount ? `SUPPRIMER ${previewCount}` : 'DÉDOUBLONNER'}
          </button>
        </div>
      </div>
    </div>
  );
};