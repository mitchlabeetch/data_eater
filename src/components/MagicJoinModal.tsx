import React, { useState, useCallback } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useDropzone } from 'react-dropzone';
import { query, registerFile } from '../services/duckdb';
import { Merge, Upload, X, ArrowRight, Table, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface MagicJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MagicJoinModal: React.FC<MagicJoinModalProps> = ({ isOpen, onClose }) => {
  const { columns: mainColumns, executeMutation } = useDataStore();
  const [lookupFile, setLookupFile] = useState<File | null>(null);
  const [lookupColumns, setLookupColumns] = useState<any[]>([]);
  const [leftKey, setLeftKey] = useState<string>('');
  const [rightKey, setRightKey] = useState<string>('');
  const [selectedJoinCols, setSelectedJoinCols] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setLookupFile(file);
      try {
        const tableName = await registerFile(file);
        await query(`DROP TABLE IF EXISTS lookup_temp`);
        await query(`CREATE TABLE lookup_temp AS SELECT * FROM read_csv_auto('${tableName}')`);
        const schema = await query(`PRAGMA table_info('lookup_temp')`);
        setLookupColumns(schema);
        if (schema.length > 0) setRightKey(schema[0].name);
      } catch (e) {
        console.error(e);
        alert("Erreur lors de la lecture du fichier de jointure.");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  const handleJoin = async () => {
    if (!lookupFile || !leftKey || !rightKey || selectedJoinCols.length === 0) return;
    setIsJoining(true);
    try {
      const fileName = await registerFile(lookupFile);
      await query(`DROP TABLE IF EXISTS lookup_dataset`);
      await query(`CREATE TABLE lookup_dataset AS SELECT * FROM read_csv_auto('${fileName}')`);
      const mainColNames = mainColumns.map(c => `t1."${c.name}"`).join(', ');
      const lookupColNames = selectedJoinCols.map(c => `t2."${c}"`).join(', ');
      const joinSql = `CREATE TABLE joined_temp AS SELECT ${mainColNames}, ${lookupColNames} FROM current_dataset t1 LEFT JOIN lookup_dataset t2 ON t1."${leftKey}" = t2."${rightKey}"`;
      await query(joinSql);
      await executeMutation(`DROP TABLE current_dataset`, "Fusion de tables");
      await executeMutation(`ALTER TABLE joined_temp RENAME TO current_dataset`, `Jointure avec ${lookupFile.name}`);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Échec de la jointure SQL.");
    } finally {
      setIsJoining(false);
    }
  };

  const toggleCol = (col: string) => {
    setSelectedJoinCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active bg-background-dark/50 flex justify-between items-center"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Merge size={20} className="text-primary" />Jointure Magique</h2><button onClick={onClose} className="text-text-muted hover:text-white"><X size={20} /></button></div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 p-6 border-r border-surface-active space-y-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-widest text-text-muted">1. Fichier Référentiel</label>{!lookupFile ? (<div {...getRootProps()} className={clsx("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all", isDragActive ? "border-primary bg-primary/5" : "border-border-dark hover:border-primary/50")}><input {...getInputProps()} /><Upload size={24} className="mx-auto mb-2 text-subtle" /><p className="text-xs text-text-muted">Chargez le fichier à fusionner</p></div>) : (<div className="bg-background-dark p-3 rounded-lg border border-primary/30 flex items-center justify-between"><div className="flex items-center gap-2"><Table size={16} className="text-primary" /><span className="text-xs font-mono text-white truncate max-w-[150px]">{lookupFile.name}</span></div><button onClick={() => setLookupFile(null)} className="text-text-muted hover:text-red-400"><X size={14} /></button></div>)}</div>
            <div className={clsx("space-y-4 transition-opacity", !lookupFile && "opacity-30 pointer-events-none")}><label className="text-[10px] font-black uppercase tracking-widest text-text-muted">2. Clés de Réconciliation</label><div className="flex items-center gap-3"><div className="flex-1 space-y-1"><span className="text-[9px] text-subtle font-bold">Ma Table</span><select value={leftKey} onChange={(e) => setLeftKey(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded p-2 text-xs text-white outline-none focus:border-primary"><option value="">Sélectionner...</option>{mainColumns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div><ArrowRight size={14} className="text-primary mt-4" /><div className="flex-1 space-y-1"><span className="text-[9px] text-subtle font-bold">Leurs Données</span><select value={rightKey} onChange={(e) => setRightKey(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded p-2 text-xs text-white outline-none focus:border-primary"><option value="">Sélectionner...</option>{lookupColumns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div></div></div>
            <div className={clsx("space-y-3 transition-opacity", (!lookupFile || !rightKey) && "opacity-30 pointer-events-none")}><label className="text-[10px] font-black uppercase tracking-widest text-text-muted">3. Colonnes à importer</label><div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">{lookupColumns.filter(c => c.name !== rightKey).map(c => (<button key={c.name} onClick={() => toggleCol(c.name)} className={clsx("text-left px-2 py-1.5 rounded border text-[10px] font-mono transition-all", selectedJoinCols.includes(c.name) ? "bg-primary/20 border-primary text-primary font-bold" : "bg-surface-active border-border-dark text-text-muted")}>{c.name}</button>))}</div></div>
          </div>
          <div className="w-1/2 bg-background-dark/20 p-8 flex flex-col items-center justify-center text-center">
             {!lookupFile ? (<div className="space-y-4"><Merge size={64} className="mx-auto text-surface-active" /><p className="text-text-muted text-sm italic">Prêt à croiser vos données ?<br/>Commencez par charger un second fichier.</p></div>) : (<div className="space-y-8 animate-in zoom-in-95 duration-300 w-full max-w-sm"><div className="relative flex justify-between items-center px-8"><div className="size-16 rounded-2xl bg-surface-active border border-border-dark flex items-center justify-center"><Table size={24} className="text-white" /></div><div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"><div className="h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" /><span className="text-[9px] font-black text-primary uppercase mt-1">LEFT JOIN</span></div><div className="size-16 rounded-2xl bg-primary/10 border border-primary/50 flex items-center justify-center"><Merge size={24} className="text-primary" /></div></div><div className="bg-surface-dark border border-border-dark rounded-xl p-4 text-left space-y-3"><h4 className="text-xs font-bold text-white uppercase tracking-wider">Résumé du Plan</h4><div className="space-y-2"><div className="flex items-center gap-2 text-xs"><CheckCircle2 size={12} className={leftKey ? "text-primary" : "text-subtle"} /><span className="text-text-muted">Lien via <span className="text-white font-mono">{leftKey || '?'}</span></span></div><div className="flex items-center gap-2 text-xs"><CheckCircle2 size={12} className={selectedJoinCols.length > 0 ? "text-primary" : "text-subtle"} /><span className="text-text-muted">Ajout de <span className="text-white">{selectedJoinCols.length}</span> colonnes</span></div></div></div>{leftKey && rightKey && (<div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3 text-left"><AlertTriangle size={16} className="text-yellow-500 shrink-0" /><p className="text-[10px] text-yellow-200/70 leading-relaxed">Note: Les lignes sans correspondance dans le référentiel seront conservées avec des valeurs vides (NULL).</p></div>)}</div>)}
          </div>
        </div>
        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-surface-active text-text-muted font-bold text-xs transition-colors">ANNULER</button><button disabled={!leftKey || !rightKey || selectedJoinCols.length === 0 || isJoining} onClick={handleJoin} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dim text-background-dark font-black text-xs shadow-lg shadow-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">{isJoining ? <Loader2 size={14} className="animate-spin" /> : <Merge size={14} />}EXÉCUTER LA FUSION</button></div>
      </div>
    </div>
  );
};