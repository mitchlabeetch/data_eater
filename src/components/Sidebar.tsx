import React from 'react';
import Mascot from './Mascot';
import ColumnStats from './ColumnStats';
import { useDataStore } from '../stores/dataStore';
import { Lock, Database, ArrowLeft, FileText, HardDrive, Hash, HelpCircle } from 'lucide-react';

interface SidebarProps {
  onOpenFAQ: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenFAQ }) => {
  const { fileMeta, rowCount, columns, selectedColumn, selectColumn } = useDataStore();

  return (
    <aside className="w-72 bg-surface-dark border-r border-border-dark flex flex-col h-full shrink-0 transition-all duration-300">
      
      {/* Header / Context Switcher */}
      <div className="p-4 border-b border-border-dark min-h-[64px] flex flex-col justify-center gap-2">
        <div className="flex items-center justify-between">
          {selectedColumn ? (
            <button 
              onClick={() => selectColumn(null)}
              className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Retour
            </button>
          ) : (
            <div className="flex items-center gap-2 text-primary">
               <Database size={16} />
               <h3 className="text-sm font-bold uppercase tracking-wider">Fichier Actuel</h3>
            </div>
          )}
          
          <button 
            onClick={onOpenFAQ}
            className="p-1.5 rounded-lg hover:bg-surface-active text-text-muted hover:text-white transition-colors"
            title="Comment ça marche ?"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {selectedColumn ? (
          // 1. Column Analysis Mode
          <ColumnStats />
        ) : (
          // 2. Global File Mode (Default)
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {fileMeta ? (
               <>
                 {/* Metadata Card */}
                 <div className="space-y-3">
                   <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-2 text-text-muted">
                        <FileText size={12} />
                        <span className="text-[11px] uppercase font-semibold">Nom</span>
                      </div>
                      <span className="text-white text-xs font-mono truncate max-w-[140px]" title={fileMeta.name}>
                        {fileMeta.name}
                      </span>
                   </div>
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-text-muted">
                        <HardDrive size={12} />
                        <span className="text-[11px] uppercase font-semibold">Taille</span>
                      </div>
                      <span className="text-white text-xs">{(fileMeta.size / 1024 / 1024).toFixed(2)} MB</span>
                   </div>
                 </div>

                 {/* Vital Signs (Big Numbers) */}
                 <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-dark">
                   <div className="bg-surface-active p-3 rounded-lg border border-border-dark hover:border-primary/50 transition-colors">
                     <span className="text-[10px] text-subtle uppercase font-bold block mb-1">Lignes</span>
                     <span className="text-lg font-mono font-bold text-white">{rowCount.toLocaleString()}</span>
                   </div>
                   <div className="bg-surface-active p-3 rounded-lg border border-border-dark hover:border-primary/50 transition-colors">
                     <span className="text-[10px] text-subtle uppercase font-bold block mb-1">Colonnes</span>
                     <span className="text-lg font-mono font-bold text-primary">{columns.length}</span>
                   </div>
                 </div>
               </>
            ) : (
              // Empty State
              <div className="h-40 border border-dashed border-border-dark rounded-lg flex flex-col items-center justify-center text-subtle gap-2">
                 <Hash size={24} className="opacity-50" />
                 <p className="text-xs italic">Aucune donnée chargée</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mascot Integration Box (Always Visible) */}
      <div className="p-4 border-t border-border-dark bg-background-dark/30 z-10">
        <Mascot />
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-subtle font-bold uppercase tracking-widest">
          <Lock size={10} className="text-primary" />
          <span>Protection Active</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;