import React from 'react';
import { useViewStore, Rule, Operator } from '../stores/viewStore';
import { useDataStore } from '../stores/dataStore';
import { Trash2, Copy, Save, Power, PowerOff, GripVertical } from 'lucide-react';
import clsx from 'clsx';

interface RuleBuilderProps {
  rule: Rule;
  index: number;
}

const OPERATORS: { value: Operator; label: string }[] = [
  { value: 'contains', label: 'Contient' },
  { value: 'not_contains', label: 'Ne contient pas' },
  { value: 'equals', label: 'Égal à' },
  { value: 'not_equals', label: 'Différent de' },
  { value: 'greater_than', label: 'Supérieur à' },
  { value: 'less_than', label: 'Inférieur à' },
  { value: 'starts_with', label: 'Commence par' },
  { value: 'ends_with', label: 'Finit par' },
  { value: 'is_empty', label: 'Est vide' },
  { value: 'is_not_empty', label: 'N\'est pas vide' },
];

const RuleBuilder: React.FC<RuleBuilderProps> = ({ rule, index }) => {
  const { updateRule, deleteRule, duplicateRule, toggleRule, saveFavorite } = useViewStore();
  const { columns } = useDataStore();

  return (
    <div className={clsx(
      "flex items-start gap-3 p-4 rounded-xl border transition-all relative group",
      rule.active 
        ? "bg-surface-active/30 border-border-dark" 
        : "bg-background-dark/50 border-transparent opacity-60"
    )}>
      
      {/* Priority Badge */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="size-6 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center text-xs font-mono font-bold text-text-muted">
          {rule.priority}
        </div>
        <GripVertical size={16} className="text-subtle cursor-grab active:cursor-grabbing" />
      </div>

      <div className="flex-1 space-y-3">
        
        {/* Header: Title & Actions */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            Règle #{index + 1}
            <span className="text-xs font-normal text-text-muted italic">
              {rule.column ? `${rule.column} ${rule.operator} ${rule.value}` : "Nouvelle règle"}
            </span>
          </h4>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionButton 
              icon={<Save size={14} />} 
              tooltip="Sauvegarder en favori" 
              onClick={() => {
                const name = prompt("Nom du favori (ex: Filtre Clients US) :\n");
                if (name) saveFavorite(name);
              }}
            />
            <ActionButton 
              icon={<Copy size={14} />} 
              tooltip="Dupliquer" 
              onClick={() => duplicateRule(rule.id)} 
            />
            <ActionButton 
              icon={rule.active ? <Power size={14} /> : <PowerOff size={14} />} 
              tooltip={rule.active ? "Désactiver" : "Activer"} 
              onClick={() => toggleRule(rule.id)}
              active={!rule.active} 
            />
            <ActionButton 
              icon={<Trash2 size={14} />} 
              tooltip="Supprimer" 
              variant="danger" 
              onClick={() => deleteRule(rule.id)} 
            />
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-12 gap-3">
          
          {/* Column Select */}
          <div className="col-span-4">
            <select 
              value={rule.column}
              onChange={(e) => updateRule(rule.id, { column: e.target.value })}
              className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
            >
              <option value="">-- Colonne --</option>
              {columns.map(col => (
                <option key={col.name} value={col.name}>{col.name} ({col.type})</option>
              ))}
            </select>
          </div>

          {/* Operator Select */}
          <div className="col-span-3">
            <select 
              value={rule.operator}
              onChange={(e) => updateRule(rule.id, { operator: e.target.value as Operator })}
              className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
            >
              {OPERATORS.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          <div className="col-span-5">
            {['is_empty', 'is_not_empty'].includes(rule.operator) ? (
              <div className="w-full h-full bg-surface-dark/50 border border-transparent rounded-lg flex items-center px-3 text-xs text-subtle italic">
                Pas de valeur requise
              </div>
            ) : (
              <input 
                type="text" 
                value={rule.value}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                placeholder="Valeur..."
                className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs text-white focus:border-primary focus:outline-none placeholder:text-subtle"
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode; tooltip: string; onClick: () => void; variant?: 'default' | 'danger'; active?: boolean }> = ({ icon, tooltip, onClick, variant = 'default', active }) => (
  <button 
    onClick={onClick}
    title={tooltip}
    className={clsx(
      "p-1.5 rounded-lg transition-colors",
      active ? "bg-yellow-500/20 text-yellow-500" :
      variant === 'danger' ? "text-subtle hover:bg-red-500/10 hover:text-red-400" : "text-subtle hover:bg-surface-active hover:text-white"
    )}
  >
    {icon}
  </button>
);

export default RuleBuilder;
