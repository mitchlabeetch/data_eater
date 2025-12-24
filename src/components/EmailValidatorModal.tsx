import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { Mail, X, Loader2, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

interface EmailValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailValidatorModal: React.FC<EmailValidatorModalProps> = ({ isOpen, onClose }) => {
  const { selectedColumn, executeMutation, fetchRows } = useDataStore();
  const [extractDomain, setExtractDomain] = useState(true);
  const [flagInvalid, setFlagInvalid] = useState(true);
  const [preview, setPreview] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && selectedColumn) {
      loadPreview();
    }
  }, [isOpen, selectedColumn, extractDomain, flagInvalid]);

  const loadPreview = async () => {
    if (!selectedColumn) return;
    const rows = await fetchRows(5);
    const regex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
    const results = rows.map(r => {
      const email = String(r[selectedColumn] || '').trim();
      const match = email.match(regex);
      return { email, valid: !!match, domain: match ? match[1] : '' };
    });
    setPreview(results);
  };

  const handleApply = async () => {
    if (!selectedColumn) return;
    setIsProcessing(true);

    try {
      const emailRegex = '^[\\w\\.-]+@[\\w\\.-]+\\.[\\w\\.-]+$';
      const domainRegex = '@([\\w\\.-]+)$';

      if (flagInvalid) {
        const validCol = `${selectedColumn}_valide`;
        await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS "${validCol}" BOOLEAN`);
        await executeMutation(`UPDATE current_dataset SET "${validCol}" = regexp_matches("${selectedColumn}", '${emailRegex}')`, `Validation emails: ${selectedColumn}`);
      }

      if (extractDomain) {
        const domainCol = `${selectedColumn}_domaine`;
        await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS "${domainCol}" VARCHAR`);
        await executeMutation(`UPDATE current_dataset SET "${domainCol}" = regexp_extract("${selectedColumn}", '${domainRegex}', 1)`, `Extraction domaines: ${selectedColumn}`);
      }

      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la validation des emails.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !selectedColumn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Mail size={20} className="text-primary" />Validateur d'Emails</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={flagInvalid} onChange={e => setFlagInvalid(e.target.checked)} className="rounded bg-background-dark border-border-dark text-primary focus:ring-0" />
              <div className="flex flex-col"><span className="text-sm font-medium text-white group-hover:text-primary transition-colors">Marquer les emails invalides</span><span className="text-[10px] text-text-muted">Crée une colonne BOOLEAN (Vrai/Faux).</span></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={extractDomain} onChange={e => setExtractDomain(e.target.checked)} className="rounded bg-background-dark border-border-dark text-primary focus:ring-0" />
              <div className="flex flex-col"><span className="text-sm font-medium text-white group-hover:text-primary transition-colors">Extraire les domaines</span><span className="text-[10px] text-text-muted">Ex: robertet.com</span></div>
            </label>
          </div>
          <div className="space-y-3">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-subtle">Aperçu (Top 5)</h3>
             <div className="bg-background-dark/50 rounded-xl border border-border-dark divide-y divide-border-dark/50 overflow-hidden font-mono">
                {preview.map((p, i) => (
                  <div key={i} className="p-2 flex items-center justify-between text-[9px]"><span className="text-white truncate max-w-[120px]">{p.email || '...'}</span><div className="flex gap-2 items-center">{flagInvalid && (<span className={clsx("px-1 rounded", p.valid ? "bg-primary/20 text-primary" : "bg-red-500/20 text-red-400")}>{p.valid ? 'VALIDE' : 'INVALID'}</span>)}{extractDomain && p.valid && (<span className="text-text-muted">{p.domain}</span>)}</div></div>
                ))}
             </div>
          </div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted font-bold text-xs">ANNULER</button>
          <button disabled={isProcessing || (!flagInvalid && !extractDomain)} onClick={handleApply} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg flex items-center gap-2 transition-all">{isProcessing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}VALIDER & APPLIQUER</button>
        </div>
      </div>
    </div>
  );
};