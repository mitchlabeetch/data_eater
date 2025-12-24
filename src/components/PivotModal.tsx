import React, { useState } from 'react';
import { useDataStore } from '../stores/dataStore';
import { query } from '../services/duckdb';
import { Table, LayoutGrid, X, Play, Loader2, Download, AlertTriangle } from 'lucide-react';
import { generateExport } from '../services/exportService';
import clsx from 'clsx';

interface PivotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PivotModal: React.FC<PivotModalProps> = ({ isOpen, onClose }) => {
  const { columns } = useDataStore();
  const [rowDim, setRowDim] = useState<string>('');
  const [colDim, setColDim] = useState<string>('');
  const [valCol, setValCol] = useState<string>('');
  const [aggFunc, setAggFunc] = useState<string>('COUNT');
  const [results, setResults] = useState<any[]>([]);
  const [resCols, setResCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePivot = async () => {
    if (!rowDim || !valCol) return;
    setLoading(true);
    setError(null);
    try {
      let sql = '';
      if (colDim) {
        sql = `PIVOT current_dataset ON "${colDim}" USING ${aggFunc}("${valCol}") GROUP BY "${rowDim}"`;
      } else {
        sql = `SELECT "${rowDim}", ${aggFunc}("${valCol}") as "${aggFunc}_${valCol}" FROM current_dataset GROUP BY "${rowDim}" ORDER BY 1`;
      }
      const res = await query(sql);
      setResults(res);
      if (res.length > 0) {
        setResCols(Object.keys(res[0]));
      } else {
        setError("Aucun résultat pour cette configuration.");
      }
    } catch (e: any) {
      console.error(e);
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPivot = async () => {
    if (results.length === 0) return;
    const cols = resCols.map(c => ({ name: c }));
    await generateExport(results, cols, {
      filename: `pivot_${rowDim}_by_${colDim || 'total'}`,
      format: 'csv',
      encoding: 'utf-8',
      delimiter: ',',
      includeHeaders: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center"><h2 className="text-lg font-bold text-white flex items-center gap-2"><LayoutGrid size={20} className="text-primary" />Générateur de Table Pivot (TCD)</h2><button onClick={onClose} className="text-text-muted hover:text-white"><X size={20} /></button></div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-72 border-r border-surface-active p-6 space-y-6 bg-background-dark/20 overflow-y-auto custom-scrollbar">
            <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Lignes (Grouper par)</label><select value={rowDim} onChange={(e) => setRowDim(e.target.value)} className="w-full bg-surface-active border border-border-dark rounded p-2 text-xs text-white outline-none focus:border-primary"><option value="">Sélectionner...</option>{columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Colonnes (Optionnel)</label><select value={colDim} onChange={(e) => setColDim(e.target.value)} className="w-full bg-surface-active border border-border-dark rounded p-2 text-xs text-white outline-none focus:border-primary"><option value="">(Aucune - Liste simple)</option>{columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Valeurs (Donnée)</label><select value={valCol} onChange={(e) => setValCol(e.target.value)} className="w-full bg-surface-active border border-border-dark rounded p-2 text-xs text-white outline-none focus:border-primary"><option value="">Sélectionner...</option>{columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Calcul</label>
              <div className="grid grid-cols-2 gap-1">{['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].map(fn => (<button key={fn} onClick={() => setAggFunc(fn)} className={clsx("px-2 py-1.5 rounded text-[10px] font-bold transition-all border", aggFunc === fn ? "bg-primary border-primary text-background-dark" : "bg-surface-active border-border-dark text-text-muted hover:border-primary/50")}>{fn}</button>))}</div>
            </div>
            <button onClick={handlePivot} disabled={!rowDim || !valCol || loading} className="w-full bg-primary hover:bg-primary-dim text-background-dark py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-30 transition-all">{loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}Générer</button>
          </div>
          <div className="flex-1 bg-background-dark/40 flex flex-col min-w-0">
            {error ? (<div className="flex-1 flex flex-col items-center justify-center p-8 text-center"><AlertTriangle size={48} className="text-red-500 opacity-50 mb-4" /><p className="text-red-400 font-mono text-xs max-w-md">{error}</p></div>) : results.length > 0 ? (
              <>
                <div className="flex-1 overflow-auto custom-scrollbar"><table className="w-full text-left border-collapse min-w-max"><thead className="bg-surface-active sticky top-0 z-10 shadow-sm border-b border-border-dark"><tr>{resCols.map(c => (<th key={c} className="p-3 text-[10px] uppercase font-bold text-text-muted border-r border-border-dark last:border-0">{c}</th>))}</tr></thead><tbody className="text-xs font-mono text-gray-300">{results.map((row, i) => (<tr key={i} className="hover:bg-surface-active/30 border-b border-border-dark/50 last:border-0">{resCols.map(c => (<td key={c} className="p-3 border-r border-border-dark/30 last:border-0 truncate max-w-[200px]" title={String(row[c])}>{String(row[c])}</td>))}</tr>))}</tbody></table></div>
                <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-between items-center"><span className="text-[10px] text-text-muted font-bold uppercase">{results.length} lignes générées</span><button onClick={handleExportPivot} className="flex items-center gap-2 px-4 py-1.5 bg-surface-active hover:bg-border-dark rounded-lg text-[10px] font-bold text-white transition-all border border-border-dark"><Download size={12} />EXPORTER CE TABLEAU</button></div>
              </>
            ) : (<div className="flex-1 flex flex-col items-center justify-center text-subtle italic text-sm"><Table size={64} className="opacity-10 mb-4" />Configurez le TCD à gauche pour commencer.</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};
