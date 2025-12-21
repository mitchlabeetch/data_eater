import React, { useState } from 'react';
import { useDataStore } from '../stores/dataStore';
import { X, Clock, MapPin, GitMerge, Check, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import cityTimezones from 'city-timezones';
import { DateTime } from 'luxon';
import fuzzysort from 'fuzzysort';
import { batchGeocode, autocompleteAddress } from '../services/geoService';

interface NormalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'timezone' | 'geo' | 'fuzzy';
}

const NormalizationModal: React.FC<NormalizationModalProps> = ({ isOpen, onClose, initialTab = 'timezone' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-border-dark w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-dark bg-background-dark/50">
          <h2 className="text-xl font-bold text-white">Outils de Normalisation Avancée</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-dark bg-surface-active/20">
          <TabButton 
            id="timezone" 
            label="Heure de Grasse" 
            icon={<Clock size={16} />} 
            active={activeTab === 'timezone'} 
            onClick={() => setActiveTab('timezone')} 
          />
          <TabButton 
            id="geo" 
            label="Géographie" 
            icon={<MapPin size={16} />} 
            active={activeTab === 'geo'} 
            onClick={() => setActiveTab('geo')} 
          />
          <TabButton 
            id="fuzzy" 
            label="Regroupement" 
            icon={<GitMerge size={16} />} 
            active={activeTab === 'fuzzy'} 
            onClick={() => setActiveTab('fuzzy')} 
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-background-dark/30 p-8">
          {activeTab === 'timezone' && <TimezonePanel />}
          {activeTab === 'geo' && <GeoPanel />}
          {activeTab === 'fuzzy' && <div className="text-center text-subtle italic">Module Regroupement en construction...</div>}
        </div>

      </div>
    </div>
  );
};

const TabButton: React.FC<{ id: string, label: string, icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex-1 flex items-center justify-center gap-3 py-4 text-sm font-bold border-b-2 transition-colors",
      active ? "border-primary text-white bg-primary/5" : "border-transparent text-text-muted hover:text-white hover:bg-surface-active/40"
    )}
  >
    {icon}
    {label}
  </button>
);

const TimezonePanel: React.FC = () => {
  const { columns, selectedColumn, executeMutation, queryResult, rowCount } = useDataStore();
  const [targetCol, setTargetCol] = useState(selectedColumn || '');
  const [geoCol, setGeoCol] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Resolution State
  const [step, setStep] = useState<'config' | 'review'>('config');
  const [mappings, setMappings] = useState<Map<string, string>>(new Map());
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [manualMap, setManualMap] = useState<Record<string, string>>({});

  const availableTimezones = React.useMemo(() => {
    try {
      return (Intl as any).supportedValuesOf('timeZone');
    } catch (e) {
      return ['Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'UTC']; // Fallback
    }
  }, []);

  const handleAnalyze = async () => {
    if (!targetCol || !geoCol) return;
    setIsProcessing(true);

    // 1. Fetch ALL distinct locations
    const res = await queryResult(`SELECT DISTINCT "${geoCol}" as loc FROM current_dataset`);
    const distinctLocs = res.map((r: any) => String(r.loc || '')).filter(Boolean);
    
    const newMappings = new Map<string, string>();
    const newUnresolved: string[] = [];

    // Pre-prepare city index
    const cityIndex = cityTimezones.cityMapping.map(c => ({ name: c.city, tz: c.timezone }));

    distinctLocs.forEach(loc => {
      // 1. Exact Match
      let matches = cityTimezones.findFromCityStateProvince(loc);
      if (matches.length > 0) {
        newMappings.set(loc, matches[0].timezone);
        return;
      }

      // 2. Fuzzy Sort
      const fuzzyResult = fuzzysort.go(loc, cityIndex, { key: 'name', limit: 1 });
      if (fuzzyResult.length > 0 && fuzzyResult[0].score > -1000) { 
         newMappings.set(loc, fuzzyResult[0].obj.tz);
         return;
      }
      
      newUnresolved.push(loc);
    });

    setMappings(newMappings);
    setUnresolved(newUnresolved.slice(0, 20)); 
    setStep('review');
    setIsProcessing(false);
  };

  const handleExecute = async () => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const finalMap = new Map(mappings);
      Object.entries(manualMap).forEach(([k, v]) => {
        if (v) finalMap.set(k, v);
      });

      // Prepare Columns
      const colName = overwrite ? `"${targetCol}"` : `"${targetCol}_grasse"`;
      if (!overwrite) {
         await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS ${colName} VARCHAR`);
      }
      
      // Temp ID
      await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS _temp_id INTEGER`);
      await executeMutation(`UPDATE current_dataset SET _temp_id = rowid`);

      // Batch Processing
      const BATCH_SIZE = 50000;
      const totalBatches = Math.ceil(rowCount / BATCH_SIZE);
      const grasseZone = 'Europe/Paris';

      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        const offset = batchIdx * BATCH_SIZE;
        const batchData = await queryResult(`
          SELECT _temp_id, "${geoCol}" as loc, "${targetCol}" as date 
          FROM current_dataset 
          LIMIT ${BATCH_SIZE} OFFSET ${offset}
        `);

        const valuesToUpdate: string[] = [];

        batchData.forEach(row => {
          const loc = String(row.loc);
          const dateStr = String(row.date);
          const id = row._temp_id;
          
          let tz = finalMap.get(loc);
          if (!tz) return;

          let dt = DateTime.fromSQL(dateStr, { zone: tz });
          if (!dt.isValid) dt = DateTime.fromISO(dateStr, { zone: tz });
          
          if (dt.isValid) {
            const grasseTime = dt.setZone(grasseZone);
            const newTimeStr = grasseTime.toFormat('yyyy-MM-dd HH:mm:ss');
            valuesToUpdate.push(`(${id}, '${newTimeStr}')`);
          }
        });

        if (valuesToUpdate.length > 0) {
          const SQL_CHUNK_SIZE = 1000;
          for (let i = 0; i < valuesToUpdate.length; i += SQL_CHUNK_SIZE) {
             const chunk = valuesToUpdate.slice(i, i + SQL_CHUNK_SIZE).join(',');
             await executeMutation(`
               UPDATE current_dataset 
               SET ${colName} = v.val 
               FROM (VALUES ${chunk}) as v(id, val) 
               WHERE current_dataset._temp_id = v.id
             `);
          }
        }

        setProgress(Math.round(((batchIdx + 1) / totalBatches) * 100));
      }

      await executeMutation(`ALTER TABLE current_dataset DROP COLUMN _temp_id`);
      setIsProcessing(false);
      setStep('config'); 

    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  if (step === 'review') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto h-full flex flex-col">
        <div className="space-y-2 shrink-0">
          <h3 className="text-lg font-bold text-white">Vérification des Correspondances</h3>
          <p className="text-sm text-text-muted">
            J'ai trouvé {mappings.size} lieux. Il reste {unresolved.length} lieux inconnus à valider manuellement.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto border border-border-dark rounded-xl bg-background-dark/50 p-4 space-y-2 custom-scrollbar">
          {unresolved.length === 0 && (
            <div className="flex items-center gap-2 text-primary font-bold">
              <Check size={18} /> Tous les lieux ont été identifiés automatiquement !
            </div>
          )}
          {unresolved.map(loc => (
            <div key={loc} className="flex items-center justify-between gap-4 p-2 rounded bg-surface-active/30">
              <span className="text-sm text-white font-mono truncate w-1/3" title={loc}>{loc}</span>
              <ArrowRight size={14} className="text-subtle" />
              <select 
                className="flex-1 bg-surface-dark border border-border-dark rounded h-8 text-xs text-white px-2 focus:border-primary focus:outline-none"
                value={manualMap[loc] || ''}
                onChange={(e) => setManualMap({ ...manualMap, [loc]: e.target.value })}
              >
                <option value="">-- Choisir Timezone --</option>
                {availableTimezones.map((tz: string) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 shrink-0 pt-4 border-t border-border-dark">
          <button onClick={() => setStep('config')} className="px-4 py-2 text-text-muted hover:text-white">Retour</button>
          <button 
            onClick={handleExecute}
            className="px-6 py-2 bg-primary hover:bg-primary-dim text-background-dark rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
          >
            {isProcessing ? <Clock size={18} className="animate-spin" /> : <Clock size={18} />}
            Appliquer les Corrections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white">Mettre à l'heure de Grasse (UTC+1/2)</h3>
        <p className="text-sm text-text-muted">Convertir les horodatages locaux en heure du siège, en fonction du lieu.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-subtle">Colonne Date/Heure</label>
          <select 
            value={targetCol}
            onChange={(e) => setTargetCol(e.target.value)}
            className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
          >
            <option value="">-- Sélectionner --</option>
            {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-subtle">Colonne Lieu (Référence)</label>
          <select 
            value={geoCol}
            onChange={(e) => setGeoCol(e.target.value)}
            className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
          >
            <option value="">-- Sélectionner --</option>
            {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface-active/30 border border-border-dark space-y-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            className="rounded bg-background-dark border-border-dark text-primary focus:ring-0"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">Écraser les données</span>
            <span className="text-xs text-text-muted">Si décoché, une nouvelle colonne "{targetCol}_grasse" sera créée.</span>
          </div>
        </label>
      </div>

      <div className="flex justify-end items-center gap-4">
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <div className="w-24 h-2 bg-background-dark rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}%</span>
          </div>
        )}
        <button 
          onClick={handleAnalyze}
          disabled={!targetCol || !geoCol || isProcessing}
          className="px-8 py-3 bg-primary hover:bg-primary-dim text-background-dark rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Clock size={18} className="animate-spin" /> : <Clock size={18} />}
          {isProcessing ? 'Analyse...' : 'Analyser les Lieux'}
        </button>
      </div>
    </div>
  );
};

const GeoPanel: React.FC = () => {
  const { columns, selectedColumn, queryResult, executeMutation, rowCount } = useDataStore();
  const [targetCol, setTargetCol] = useState(selectedColumn || '');
  const [outputFormat, setOutputFormat] = useState<'full' | 'city' | 'gps'>('full');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGeo = async () => {
    if (!targetCol) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      // 1. Fetch Distinct Values
      const res = await queryResult(`SELECT DISTINCT "${targetCol}" as loc FROM current_dataset`);
      const distinctLocs = res.map((r: any) => String(r.loc || '')).filter(Boolean);

      // 2. Batch Geocode (Auto)
      const results = await batchGeocode(distinctLocs, (done, total) => {
        setProgress(Math.round((done / total) * 100));
      });

      // 3. Apply Updates
      const valuesToUpdate: string[] = [];
      const newCol = `"${targetCol}_geo"`;
      
      await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS ${newCol} VARCHAR`);
      await executeMutation(`ALTER TABLE current_dataset ADD COLUMN IF NOT EXISTS _temp_id INTEGER`);
      await executeMutation(`UPDATE current_dataset SET _temp_id = rowid`);

      const BATCH_SIZE = 50000;
      const totalBatches = Math.ceil(rowCount / BATCH_SIZE);

      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        const offset = batchIdx * BATCH_SIZE;
        const batchData = await queryResult(`
          SELECT _temp_id, "${targetCol}" as loc
          FROM current_dataset 
          LIMIT ${BATCH_SIZE} OFFSET ${offset}
        `);

        const batchUpdates: string[] = [];

        batchData.forEach(row => {
          const loc = String(row.loc);
          const id = row._temp_id;
          const match = results.get(loc);

          if (match && match.properties) {
            let newVal = '';
            if (outputFormat === 'full') newVal = match.properties.label;
            else if (outputFormat === 'city') newVal = `${match.properties.city || ''}, ${match.properties.context || ''}`;
            else if (outputFormat === 'gps') newVal = `${match.geometry.coordinates[1]}, ${match.geometry.coordinates[0]}`;
            
            if (newVal) batchUpdates.push(`(${id}, '${newVal.replace(/'/g, "''")}')`);
          }
        });

        if (batchUpdates.length > 0) {
          const SQL_CHUNK_SIZE = 500; 
          for (let i = 0; i < batchUpdates.length; i += SQL_CHUNK_SIZE) {
             const chunk = batchUpdates.slice(i, i + SQL_CHUNK_SIZE).join(',');
             await executeMutation(`
               UPDATE current_dataset 
               SET ${newCol} = v.val 
               FROM (VALUES ${chunk}) as v(id, val) 
               WHERE current_dataset._temp_id = v.id
             `);
          }
        }
      }

      await executeMutation(`ALTER TABLE current_dataset DROP COLUMN _temp_id`);
      setIsProcessing(false);

    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white">Consolidation Géographique</h3>
        <p className="text-sm text-text-muted">Standardiser les adresses via l'API Géoplateforme (BD TOPO / BAN).</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-subtle">Colonne Adresse</label>
          <select 
            value={targetCol}
            onChange={(e) => setTargetCol(e.target.value)}
            className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
          >
            <option value="">-- Sélectionner --</option>
            {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-subtle">Format de Sortie</label>
          <select 
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as any)}
            className="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
          >
            <option value="full">Adresse Complète (Normalisée)</option>
            <option value="city">Ville, Département</option>
            <option value="gps">Coordonnées GPS (Lat, Lon)</option>
          </select>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface-active/30 border border-border-dark space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => setMode('auto')}
            className={clsx(
              "flex-1 py-3 rounded-lg border text-sm font-bold transition-all",
              mode === 'auto' ? "bg-primary/10 border-primary text-primary" : "bg-surface-dark border-border-dark text-text-muted hover:text-white"
            )}
          >
            Automatique (API)
          </button>
          <button
            onClick={() => setMode('manual')}
            className={clsx(
              "flex-1 py-3 rounded-lg border text-sm font-bold transition-all",
              mode === 'manual' ? "bg-primary/10 border-primary text-primary" : "bg-surface-dark border-border-dark text-text-muted hover:text-white"
            )}
          >
            Manuel (Autocomplétion)
          </button>
        </div>
        <p className="text-xs text-text-muted italic text-center">
          {mode === 'auto' 
            ? "Interroge l'API pour chaque valeur unique. Respecte la limite de 50 req/s." 
            : "Vous validez chaque adresse une par une avec suggestions."}
        </p>
      </div>

      <div className="flex justify-end items-center gap-4">
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <div className="w-24 h-2 bg-background-dark rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}%</span>
          </div>
        )}
        <button 
          onClick={handleGeo}
          disabled={!targetCol || isProcessing || mode === 'manual'} 
          className="px-8 py-3 bg-primary hover:bg-primary-dim text-background-dark rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Clock size={18} className="animate-spin" /> : <MapPin size={18} />}
          Lancer la Consolidation
        </button>
      </div>
    </div>
  );
};

export default NormalizationModal;