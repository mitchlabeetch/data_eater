import React, { useState } from 'react';
import { useDataStore } from '../stores/dataStore';
import { Play, Eraser, History, Terminal } from 'lucide-react';

interface SQLConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SQLConsoleModal: React.FC<SQLConsoleModalProps> = ({ isOpen, onClose }) => {
  const { queryResult, fetchCurrentView } = useDataStore();
  const [sql, setSql] = useState('SELECT * FROM current_dataset LIMIT 10');
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleExecute = async () => {
    setIsExecuting(true);
    setError(null);
    setResults([]);
    try {
      const isMutation = /UPDATE|DELETE|DROP|ALTER|CREATE|INSERT/i.test(sql);
      const res = await queryResult(sql);
      if (isMutation) {
        await fetchCurrentView();
        setResults([{ status: "Commande exécutée avec succès.", rows_affected: res.length }]);
        setColumns(["status", "rows_affected"]);
      } else {
        setResults(res);
        if (res.length > 0) setColumns(Object.keys(res[0]));
      }
      if (!history.includes(sql)) setHistory(prev => [sql, ...prev].slice(0, 10));
    } catch (e: any) {
      setError(String(e));
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Terminal size={20} className="text-primary" />Console SQL (DuckDB)</h2><button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button></div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-1/3 flex flex-col border-b border-surface-active"><div className="flex-1 p-4 bg-background-dark relative"><textarea value={sql} onChange={(e) => setSql(e.target.value)} className="w-full h-full bg-transparent text-white font-mono text-sm outline-none resize-none placeholder-subtle" placeholder="Entrez votre requête SQL ici..." spellCheck={false} />{isExecuting && (<div className="absolute inset-0 bg-background-dark/50 flex items-center justify-center"><span className="text-primary animate-pulse font-mono">Exécution...</span></div>)}</div><div className="h-12 bg-surface-dark border-t border-surface-active flex items-center px-4 gap-2"><button onClick={handleExecute} className="px-4 py-1.5 bg-primary hover:bg-primary-dim text-background-dark rounded font-bold text-xs flex items-center gap-2 transition-colors"><Play size={14} /> Exécuter</button><div className="w-px h-6 bg-surface-active mx-2" /><button onClick={() => setSql('')} className="p-2 hover:bg-surface-active rounded text-text-muted hover:text-white" title="Effacer"><Eraser size={16} /></button><div className="relative group"><button className="p-2 hover:bg-surface-active rounded text-text-muted hover:text-white flex items-center gap-1"><History size={16} /><span className="text-xs">Historique</span></button><div className="absolute bottom-full left-0 mb-2 w-64 bg-surface-dark border border-surface-active rounded-lg shadow-xl hidden group-hover:block max-h-48 overflow-y-auto z-20">{history.map((h, i) => (<button key={i} onClick={() => setSql(h)} className="w-full text-left p-2 text-xs text-text-muted hover:bg-surface-active hover:text-white truncate font-mono border-b border-surface-active/50 last:border-0">{h}</button>))}{history.length === 0 && <div className="p-2 text-xs text-subtle italic">Vide</div>}</div></div></div></div>
          <div className="flex-1 bg-background-dark/30 overflow-hidden flex flex-col">
            {error ? (<div className="p-6 text-error font-mono text-sm bg-error/5 h-full overflow-auto"><strong>Erreur SQL:</strong><br/>{error}</div>) : results.length > 0 ? (
              <div className="flex-1 overflow-auto custom-scrollbar"><table className="w-full text-left border-collapse"><thead className="bg-surface-active sticky top-0 z-10"><tr>{columns.map(col => (<th key={col} className="p-2 text-xs font-mono text-text-muted border-b border-surface-active whitespace-nowrap">{col}</th>))}</tr></thead><tbody className="text-sm font-mono text-gray-300">{results.map((row, i) => (<tr key={i} className="hover:bg-surface-active/20">{columns.map(col => (<td key={col + i} className="p-2 border-b border-surface-active/30 truncate max-w-[200px]" title={String(row[col])}>{String(row[col])}</td>))}</tr>))}</tbody></table></div>
            ) : (<div className="flex-1 flex items-center justify-center text-subtle italic text-sm">Les résultats apparaîtront ici.</div>)}
            <div className="h-8 bg-surface-dark border-t border-surface-active flex items-center px-4 justify-between text-[10px] text-text-muted font-mono"><span>{results.length} lignes</span><span>DuckDB WASM</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};