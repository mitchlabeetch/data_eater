import React from 'react';
import { useDataStore } from '../stores/dataStore';
import { Database, FileInput, Sparkles, Wand2, Trash2, Split, CheckCircle2, Clock } from 'lucide-react';
import clsx from 'clsx';

const ICON_MAP: Record<string, any> = {
  'LOAD': Database,
  'TRANSFORM': Wand2,
  'CLEAN': Sparkles,
  'AI': Sparkles,
  'EXPORT': FileInput,
  'DELETE': Trash2,
  'SPLIT': Split
};

export const LineageTree: React.FC = () => {
  const { history } = useDataStore();

  if (history.length === 0) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-500">
      <div className="flex items-center gap-2 px-1">
        <Clock size={12} className="text-text-muted" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Recette de Digestion</h4>
      </div>

      <div className="relative ml-2 space-y-0">
        {/* Timeline Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border-dark" />

        {history.map((step, idx) => {
          const Icon = ICON_MAP[step.type] || Wand2;
          const isLast = idx === history.length - 1;

          return (
            <div key={step.id} className="relative pl-8 pb-6 last:pb-0 group">
              {/* Node Dot */}
              <div className={clsx(
                "absolute left-0 top-1 size-[23px] rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                isLast ? "bg-primary border-primary shadow-[0_0_10px_#13ec5b]" : "bg-background-dark border-border-dark group-hover:border-primary/50"
              )}>
                <Icon size={10} className={isLast ? "text-background-dark" : "text-text-muted group-hover:text-primary"} />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isLast ? "text-white" : "text-text-muted"
                  )}>
                    {step.type}
                  </span>
                  {isLast && (
                    <CheckCircle2 size={10} className="text-primary animate-pulse" />
                  )}
                </div>
                <p className={clsx(
                  "text-[11px] leading-tight transition-colors",
                  isLast ? "text-primary font-medium" : "text-subtle group-hover:text-text-muted"
                )}>
                  {step.description}
                </p>
                <span className="text-[9px] text-text-subtle font-mono mt-1">
                  {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
