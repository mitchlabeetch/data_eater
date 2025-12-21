import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMascotStore } from '../stores/mascotStore';
import { MASCOT_STATES } from '../lib/constants';

const STATE_TO_GIF: Record<string, string> = {
  [MASCOT_STATES.SLEEPING]: '/idle_state.gif',
  [MASCOT_STATES.EATING]: '/processing_state.gif',
  [MASCOT_STATES.COOKING]: '/query_chef_state.gif',
  [MASCOT_STATES.DETECTIVE]: '/diff_inspect_state.gif',
  [MASCOT_STATES.INDIGESTION]: '/error_state.gif',
};

const Mascot: React.FC = () => {
  const { state, message, setMascot } = useMascotStore();

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state === MASCOT_STATES.SLEEPING && message !== "Petite Sieste...") {
      timer = setTimeout(() => {
        setMascot(MASCOT_STATES.SLEEPING, "Petite Sieste...");
      }, 60000); // 60s timeout
    }
    return () => clearTimeout(timer);
  }, [state, message, setMascot]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-surface-dark rounded-xl border border-border-dark shadow-inner">
      <div className="relative w-32 h-32 flex items-center justify-center bg-background-dark/50 rounded-lg overflow-hidden border border-primary/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full p-2"
          >
            <img 
              src={STATE_TO_GIF[state]} 
              alt={`Le Glouton - ${state}`} 
              className="w-full h-full object-contain"
            />
          </motion.div>
        </AnimatePresence>

        {/* Status Light */}
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getStatusColor(state)} animate-pulse`} />
      </div>

      <div className="w-full text-center space-y-1">
        <p className="text-primary font-retro text-[10px] uppercase tracking-tighter">
          {state}
        </p>
        <div className="h-10 flex items-center justify-center px-2">
          <p className="text-text-muted text-xs font-medium leading-tight line-clamp-2">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

function getStatusColor(state: string) {
  if (state === MASCOT_STATES.INDIGESTION) return "bg-red-500";
  if (state === MASCOT_STATES.SLEEPING) return "bg-blue-500";
  return "bg-primary";
}

export default Mascot;