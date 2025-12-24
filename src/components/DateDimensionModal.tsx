import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { query } from '../services/duckdb';
import { CalendarDays, X, Loader2, ArrowRight, Table } from 'lucide-react';

interface DateDimensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DateDimensionModal: React.FC<DateDimensionModalProps> = ({ isOpen, onClose }) => {
  const { columns, queryResult } = useDataStore();
  const [dateCol, setDateCol] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<{ min: string, max: string, count: number } | null>(null);

  const dateColumns = columns.filter(c => 
    /date|timestamp/i.test(c.type) || /date|time/i.test(c.name)
  );

  useEffect(() => {
    if (isOpen && dateCol) {
      loadStats();
    }
  }, [isOpen, dateCol]);

  const loadStats = async () => {
    try {
      const res = await queryResult(`SELECT MIN("${dateCol}")::DATE as min_date, MAX("${dateCol}")::DATE as max_date FROM current_dataset`);
      if (res.length > 0) {
        const min = new Date(res[0].min_date);
        const max = new Date(res[0].max_date);
        const diffTime = Math.abs(max.getTime() - min.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setStats({ min: res[0].min_date, max: res[0].max_date, count: diffDays });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async () => {
    if (!dateCol || !stats) return;
    setIsProcessing(true);

    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS calendar_dimension AS
        SELECT 
          d::DATE as Date,
          year(d) as Year,
          month(d) as Month,
          day(d) as Day,
          dayname(d) as DayName,
          extract('quarter' from d) as Quarter,
          extract('week' from d) as Week,
          CASE WHEN dayofweek(d) IN (0, 6) THEN true ELSE false END as IsWeekend
        FROM generate_series(
          '${stats.min}'::DATE, 
          '${stats.max}'::DATE, 
          interval '1 day'
        ) as s(d)
      `;

      await query(`DROP TABLE IF EXISTS calendar_dimension`);
      await query(sql);
      alert("Table 'calendar_dimension' créée avec succès !");
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du calendrier.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><CalendarDays size={20} className="text-primary" />Générateur de Calendrier (PowerBI)</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-text-muted leading-relaxed">Génère une table de dimension <code className="text-white bg-surface-active px-1 rounded">calendar_dimension</code> couvrant toute la plage de dates de votre fichier.</p>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-muted">Colonne de Date Source</label>
            <select value={dateCol} onChange={e => setDateCol(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-sm text-white focus:border-primary outline-none">
              <option value="">Sélectionner...</option>
              {dateColumns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          {stats && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
               <h4 className="text-[10px] font-bold text-primary uppercase">Résumé de la plage</h4>
               <div className="flex items-center justify-between">
                  <div className="text-center flex-1"><p className="text-[10px] text-text-muted uppercase">Début</p><p className="text-xs font-bold text-white">{stats.min}</p></div>
                  <ArrowRight size={14} className="text-primary opacity-30" /><div className="text-center flex-1"><p className="text-[10px] text-text-muted uppercase">Fin</p><p className="text-xs font-bold text-white">{stats.max}</p></div>
               </div>
               <div className="pt-2 border-t border-primary/10 text-center"><p className="text-[10px] text-text-muted italic"><span className="text-primary font-bold">{stats.count}</span> jours seront générés.</p></div>
            </div>
          )}
          <div className="space-y-2">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle">Attributs inclus</h3>
             <div className="flex flex-wrap gap-1.5">{['Year', 'Month', 'Day', 'Quarter', 'Week', 'DayName', 'IsWeekend'].map(a => (<span key={a} className="px-2 py-1 rounded bg-surface-active text-[9px] font-mono text-text-muted border border-border-dark">{a}</span>))}</div>
          </div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs uppercase tracking-widest hover:text-white">ANNULER</button>
          <button disabled={!dateCol || isProcessing} onClick={handleApply} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all">{isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Table size={14} />}GÉNÉRER LA TABLE</button>
        </div>
      </div>
    </div>
  );
};