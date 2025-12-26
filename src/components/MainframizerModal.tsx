import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { Database, X, Play, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

interface MainframizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainframize = (name: string): string => {
  let clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  if (clean.length <= 10) return clean;
  const noUnderscore = clean.replace(/_/g, '');
  if (noUnderscore.length <= 10) return noUnderscore;
  return noUnderscore.substring(0, 10);
};

export const MainframizerModal: React.FC<MainframizerModalProps> = ({ isOpen, onClose }) => {
  const { columns, executeMutation } = useDataStore();
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const map: Record<string, string> = {};
      columns.forEach(c => { map[c.name] = mainframize(c.name); });
      setMappings(map);
    }
  }, [isOpen, columns]);

  const [copybookText, setCopybookText] = useState('');

  const handleParseCopybook = () => {
    // Simple heuristic: extract first word of each line as column name
    const lines = copybookText.split('\n').filter(l => l.trim().length > 0);
    const newMappings = { ...mappings };
    
    columns.forEach((col, idx) => {
      if (idx < lines.length) {
        // Basic extraction: take first token, strip standard Cobol prefixes like '01', '05'
        let name = lines[idx].trim().split(/\s+/)[0];
        if (/^\d+$/.test(name) && lines[idx].trim().split(/\s+/).length > 1) {
           // It was likely a level number (e.g. 05 CUSTOMER-NAME PIC X...), take second word
           name = lines[idx].trim().split(/\s+/)[1];
        }
        // Apply mainframing to the extracted name
        newMappings[col.name] = mainframize(name);
      }
    });
    setMappings(newMappings);
  };

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      for (const [oldName, newName] of Object.entries(mappings)) {
        if (oldName !== newName) {
          await executeMutation(`ALTER TABLE current_dataset RENAME COLUMN "${oldName}" TO "${newName}"`, `Mainframize: ${newName}`);
        }
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors du renommage des colonnes.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Database size={20} className="text-primary" />Mainframizer (Standard IBM i)</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-text-muted leading-relaxed">Cette opération va renommer toutes vos colonnes pour respecter les contraintes strictes de l'AS400 : <strong className="text-white"> 10 caractères maximum, majuscules, sans caractères spéciaux.</strong></p>
          
          <div className="space-y-2 p-3 bg-surface-active/30 rounded-lg border border-border-dark">
             <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Import Copybook / Définition</h3>
                <button onClick={handleParseCopybook} disabled={!copybookText} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded border border-primary/30 hover:bg-primary/20 disabled:opacity-50 font-bold">APPLIQUER SUR L'ORDRE ACTUEL</button>
             </div>
             <textarea 
               value={copybookText}
               onChange={(e) => setCopybookText(e.target.value)}
               placeholder="Collez ici votre définition (ex: 01 CUST-NAME PIC X(10)...) ou liste de noms. L'ordre doit correspondre aux colonnes."
               className="w-full h-20 bg-background-dark text-xs font-mono text-text-muted p-2 rounded border border-border-dark focus:border-primary outline-none resize-none"
             />
          </div>

          <div className="space-y-2">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle px-1">Plan de Renommage</h3>
             <div className="bg-background-dark/50 rounded-xl border border-border-dark max-h-64 overflow-y-auto custom-scrollbar divide-y divide-border-dark/50">
                {columns.map(c => (
                  <div key={c.name} className="p-3 flex items-center justify-between group hover:bg-primary/5 transition-colors">
                    <span className="text-xs font-mono text-text-muted truncate max-w-[180px]" title={c.name}>{c.name}</span>
                    <ArrowRight size={14} className="text-primary opacity-30 group-hover:opacity-100" />
                    <input type="text" maxLength={10} value={mappings[c.name] || ''} onChange={e => setMappings({ ...mappings, [c.name]: e.target.value.toUpperCase() })} className="bg-surface-active border border-border-dark rounded px-2 py-1 text-xs font-mono font-bold text-primary w-28 focus:border-primary outline-none" />
                  </div>
                ))}
             </div>
          </div>
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3"><CheckCircle2 size={16} className="text-orange-400 mt-0.5" /><p className="text-[11px] text-orange-200/70">Attention : Renommer les colonnes peut casser vos filtres ou scripts externes basés sur les noms d'origine.</p></div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs">ANNULER</button>
          <button disabled={isProcessing} onClick={handleApply} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all">{isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}RENOMMER TOUT</button>
        </div>
      </div>
    </div>
  );
};