import React, { useState } from 'react';
import { Shield, Lock, EyeOff, Server, Info } from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import clsx from 'clsx';

interface CloudPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hiddenColumns: string[]) => void;
}

const CloudPrivacyModal: React.FC<CloudPrivacyModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { columns } = useDataStore();
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleCol = (colName: string) => {
    const newSet = new Set(selectedCols);
    if (newSet.has(colName)) newSet.delete(colName);
    else newSet.add(colName);
    setSelectedCols(newSet);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-primary/30 w-full max-w-2xl rounded-xl shadow-[0_0_50px_rgba(19,236,91,0.1)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border-dark bg-background-dark/80 rounded-t-xl space-y-2">
          <div className="flex items-center gap-3 text-primary">
             <Shield size={28} className="animate-pulse" />
             <h2 className="text-xl font-bold text-white">Sécurisation Avant Envoi</h2>
          </div>
          <p className="text-sm text-white font-medium">
            Pour effectuer cette mission, je vais devoir regarder vos données de plus près à l'aide de mon serveur sécurisé.
          </p>
          <p className="text-xs text-text-muted">
            Ce processus sera conduit via mon API cryptée et privée et les données seront supprimées automatiquement du serveur après exécution.
          </p>
        </div>

        {/* Logic Explanation */}
        <div className="p-6 bg-surface-active/30 space-y-4">
          <div className="flex gap-3 text-xs text-subtle leading-relaxed bg-background-dark/50 p-4 rounded-lg border border-border-dark">
            <Info size={16} className="shrink-0 text-primary mt-0.5" />
            <p>
              <strong className="text-white">Si vous le souhaitez, nous pouvons malgré tout supprimer certaines colonnes de votre table avant envoi.</strong> Un duplicata sera créé pour chaque fichier, auquel une colonne <code className="text-primary">data_eater_id</code> sera ajoutée avec un identifiant unique pour chaque ligne afin d'éviter toute confusion en cas de suppression ou modifications de certaines entrées. Au retour des fichiers temporaires traités, les fichiers seront comparés aux données originales via la clé générée précédemment afin d'appliquer localement les mêmes modifications aux colonnes concernées. Enfin, la colonne <code className="text-primary">data_eater_id</code> sera supprimée.
            </p>
          </div>

          {/* Column Selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <EyeOff size={16} />
              Sélectionnez les colonnes à cacher
            </h3>
            <p className="text-xs text-text-muted">Ces colonnes ne quitteront jamais votre ordinateur.</p>
            
            <div className="border border-border-dark rounded-lg bg-background-dark/50 max-h-[300px] overflow-y-auto p-2 grid grid-cols-2 gap-2 custom-scrollbar">
              {columns.map(col => {
                const isHidden = selectedCols.has(col.name);
                return (
                  <button
                    key={col.name}
                    onClick={() => toggleCol(col.name)}
                    className={clsx(
                      "flex items-center gap-3 p-2 rounded text-xs font-mono text-left transition-colors border",
                      isHidden 
                        ? "bg-red-500/10 border-red-500/30 text-red-300" 
                        : "bg-surface-active border-transparent text-text-muted hover:text-white"
                    )}
                  >
                    <div className={clsx(
                      "size-4 rounded flex items-center justify-center border",
                      isHidden ? "bg-red-500 border-red-500 text-black" : "border-subtle"
                    )}>
                      {isHidden && <Lock size={10} />}
                    </div>
                    <span className="truncate">{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-dark flex justify-end gap-3 bg-surface-active/30 rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-transparent hover:bg-surface-active text-text-muted hover:text-white rounded-lg text-sm font-bold transition-colors"
          >
            Annuler
          </button>
          <button 
            onClick={() => onConfirm(Array.from(selectedCols))}
            className="px-6 py-2 bg-primary hover:bg-primary-dim text-background-dark rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(19,236,91,0.3)] transition-all flex items-center gap-2"
          >
            <Server size={16} />
            Confirmer et Envoyer
          </button>
        </div>

      </div>
    </div>
  );
};

export default CloudPrivacyModal;
