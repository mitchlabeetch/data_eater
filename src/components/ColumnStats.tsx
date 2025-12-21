import React from 'react';
import { useDataStore } from '../stores/dataStore';
import { BarChart2, AlertTriangle, Hash, Type } from 'lucide-react';

const ColumnStats: React.FC = () => {
  const { selectedColumn, columnStats, columns, rowCount } = useDataStore();

  if (!selectedColumn || !columnStats) return null;

  const colType = columns.find(c => c.name === selectedColumn)?.type || 'UNKNOWN';
  const nullPercentage = ((columnStats.nullCount / rowCount) * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-dark">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-subtle tracking-wider">Colonne</span>
          <h3 className="text-white font-mono font-bold text-sm truncate max-w-[160px]" title={selectedColumn}>
            {selectedColumn}
          </h3>
        </div>
        <div className="bg-surface-active px-2 py-1 rounded flex items-center gap-1 text-[10px] font-mono text-primary">
          {colType === 'VARCHAR' ? <Type size={10} /> : <Hash size={10} />}
          {colType}
        </div>
      </div>

      {/* Null Check (Quality) */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-text-muted">Valeurs Nulles</span>
          <span className={columnStats.nullCount > 0 ? "text-glouton-red font-bold" : "text-primary font-bold"}>
            {columnStats.nullCount.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 w-full bg-background-dark rounded-full overflow-hidden">
          <div 
            className={`h-full ${columnStats.nullCount > 0 ? "bg-glouton-red" : "bg-primary"}`} 
            style={{ width: `${Math.min(Number(nullPercentage), 100)}%` }}
          />
        </div>
        {columnStats.nullCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-glouton-red mt-1">
            <AlertTriangle size={10} />
            <span>{nullPercentage}% manquant</span>
          </div>
        )}
      </div>

      {/* Distinct / Unique */}
      <div className="bg-surface-active/50 p-3 rounded-lg border border-border-dark flex justify-between items-center">
        <span className="text-xs text-text-muted">Valeurs Uniques</span>
        <span className="text-sm font-mono text-white font-bold">{columnStats.distinctCount?.toLocaleString()}</span>
      </div>

      {/* Distribution (Top Values) */}
      {columnStats.topValues && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
            <BarChart2 size={12} />
            <span>Top 5 Valeurs</span>
          </div>
          <div className="space-y-1.5">
            {columnStats.topValues.map((val: { value: string; count: number }, idx: number) => {
              const percent = ((val.count / rowCount) * 100);
              return (
                <div key={idx} className="group relative">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-0.5 relative z-10">
                    <span className="truncate max-w-[120px]" title={val.value}>{val.value === '' ? '(Vide)' : val.value}</span>
                    <span className="font-mono">{val.count}</span>
                  </div>
                  <div className="h-5 w-full bg-background-dark rounded overflow-hidden relative">
                    <div 
                      className="h-full bg-primary/20 group-hover:bg-primary/30 transition-colors"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Numeric Stats */}
      {columnStats.sum !== undefined && (
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-surface-active/50 p-2 rounded border border-border-dark">
             <span className="text-[10px] text-subtle uppercase">Somme</span>
             <p className="text-xs font-mono text-primary truncate" title={String(columnStats.sum)}>
               {columnStats.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </p>
           </div>
           <div className="bg-surface-active/50 p-2 rounded border border-border-dark">
             <span className="text-[10px] text-subtle uppercase">Moyenne</span>
             <p className="text-xs font-mono text-white truncate" title={String(columnStats.avg)}>
               {columnStats.avg?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
             </p>
           </div>
           <div className="bg-surface-active/50 p-2 rounded border border-border-dark">
             <span className="text-[10px] text-subtle uppercase">Min</span>
             <p className="text-xs font-mono text-white truncate">{String(columnStats.min)}</p>
           </div>
           <div className="bg-surface-active/50 p-2 rounded border border-border-dark">
             <span className="text-[10px] text-subtle uppercase">Max</span>
             <p className="text-xs font-mono text-white truncate">{String(columnStats.max)}</p>
           </div>
        </div>
      )}

    </div>
  );
};

export default ColumnStats;
