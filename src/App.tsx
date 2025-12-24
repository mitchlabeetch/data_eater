import { useEffect, useCallback, useState } from "react";
import Sidebar from "./components/Sidebar";
import Toolbox from "./components/Toolbox";
import ExportModal from "./components/ExportModal";
import FAQPage from "./components/FAQPage";
import FilterModal from "./components/FilterModal";
import NormalizationModal from "./components/NormalizationModal";
import { HealthDashboardModal } from "./components/HealthDashboardModal";
import { DataVizModal } from "./components/DataVizModal";
import { SplitModal } from "./components/SplitModal";
import { SQLConsoleModal } from "./components/SQLConsoleModal";
import { GeoMapModal } from "./components/GeoMapModal";
import { MagicJoinModal } from "./components/MagicJoinModal";
import { PivotModal } from "./components/PivotModal";
import { UnpivotModal } from "./components/UnpivotModal";
import { RegexExtractorModal } from "./components/RegexExtractorModal";
import { FormulaModal } from "./components/FormulaModal";
import { ConditionalLogicModal } from "./components/ConditionalLogicModal";
import { DeduplicateModal } from "./components/DeduplicateModal";
import { SmartDateModal } from "./components/SmartDateModal";
import { NameSplitterModal } from "./components/NameSplitterModal";
import { PhoneStandardizerModal } from "./components/PhoneStandardizerModal";
import { EmailValidatorModal } from "./components/EmailValidatorModal";
import { CurrencyNormalizerModal } from "./components/CurrencyNormalizerModal";
import { UnitConverterModal } from "./components/UnitConverterModal";
import { MojibakeModal } from "./components/MojibakeModal";
import { MainframizerModal } from "./components/MainframizerModal";
import { FixedWidthModal } from "./components/FixedWidthModal";
import { DateDimensionModal } from "./components/DateDimensionModal";
import { DAXModal } from "./components/DAXModal";
import { useDataStore } from "./stores/dataStore";
import { useViewStore } from "./stores/viewStore";
import { useMascotStore } from "./stores/mascotStore";
import { MASCOT_STATES } from "./lib/constants";
import { useDropzone } from 'react-dropzone';
import { Upload, Search, Filter, Save, FileOutput, Shield, Loader2, ArrowDownUp, LogOut, Terminal, Map as MapIcon, LayoutGrid } from "lucide-react";
import clsx from "clsx";

function App() {
  const { 
    initializeEngine, 
    loadFile, 
    isReady, 
    rows, 
    columns, 
    rowCount, 
    fileMeta, 
    isLoading, 
    selectedColumn, 
    selectColumn,
    searchQuery,
    setSearchQuery,
    sortConfig,
    setSort,
    hasUnsavedChanges,
    resetData,
    healthReport,
    restoreSession
  } = useDataStore();
  const { openFilter, isNormalizationOpen, closeNormalization } = useViewStore();
  const { setMascot, resetMascot } = useMascotStore();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isVizOpen, setIsVizOpen] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [isSQLOpen, setIsSQLOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isPivotOpen, setIsPivotOpen] = useState(false);
  const [isUnpivotOpen, setIsUnpivotOpen] = useState(false);
  const [isRegexOpen, setIsRegexOpen] = useState(false);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isLogicOpen, setIsLogicOpen] = useState(false);
  const [isDedupOpen, setIsDedupOpen] = useState(false);
  const [isSmartDateOpen, setIsSmartDateOpen] = useState(false);
  const [isNameOpen, setIsNameOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [isMojibakeOpen, setIsMojibakeOpen] = useState(false);
  const [isMainframeOpen, setIsMainframeOpen] = useState(false);
  const [isFixedOpen, setIsFixedOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDAXOpen, setIsDAXOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  const openModal = (setter: (v: boolean) => void, msg: string) => {
    setMascot(MASCOT_STATES.COOKING, msg);
    setter(true);
    resetMascot(5000); 
  };

  useEffect(() => {
    initializeEngine();
    restoreSession().then(found => {
      if (found) {
        setMascot(MASCOT_STATES.DETECTIVE, "J'ai retrouvé votre session précédente !");
        setIsRestoreOpen(true);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const setters = [
          setIsExportOpen, setIsFAQOpen, setIsHealthOpen, setIsVizOpen, setIsSplitOpen,
          setIsSQLOpen, setIsMapOpen, setIsJoinOpen, setIsPivotOpen, setIsUnpivotOpen,
          setIsRegexOpen, setIsFormulaOpen, setIsLogicOpen, setIsDedupOpen, setIsSmartDateOpen,
          setIsNameOpen, setIsPhoneOpen, setIsEmailOpen, setIsCurrencyOpen, setIsUnitOpen,
          setIsMojibakeOpen, setIsMainframeOpen, setIsFixedOpen, setIsCalendarOpen, setIsDAXOpen,
          setIsRestoreOpen
        ];
        setters.forEach(s => s(false));
        resetMascot(1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initializeEngine, restoreSession, setMascot, resetMascot]);

  const handleQuit = async () => {
    if (hasUnsavedChanges) {
      if (!confirm("Attention : vous avez effectué des modifications sur ce fichier sans exporter la nouvelle version. Êtes-vous sûre de vouloir quitter la gestion de ce fichier ?")) {
        return;
      }
    }
    await resetData();
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      loadFile(acceptedFiles[0]);
    }
  }, [loadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    noClick: !!fileMeta 
  });

  const getColumnColor = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('INT') || t.includes('DOUBLE') || t.includes('DECIMAL')) return 'bg-emerald-500/5 hover:bg-emerald-500/10';
    if (t.includes('DATE') || t.includes('TIMESTAMP')) return 'bg-purple-500/5 hover:bg-purple-500/10';
    if (t.includes('BOOL')) return 'bg-yellow-500/5 hover:bg-yellow-500/10';
    return 'bg-blue-500/5 hover:bg-blue-500/10'; 
  };
  
  const getTypeBadgeColor = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('INT') || t.includes('DOUBLE')) return 'text-emerald-400 bg-emerald-400/10';
    if (t.includes('DATE') || t.includes('TIMESTAMP')) return 'text-purple-400 bg-purple-400/10';
    if (t.includes('BOOL')) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-blue-400 bg-blue-400/10';
  };

  const hasGeo = columns.some(c => /lat|lon|longitude|latitude/i.test(c.name));

  return (
    <div className="h-screen w-screen flex flex-col bg-background-dark text-white overflow-hidden font-display">
      <header className="h-16 border-b border-border-dark flex items-center justify-between px-6 bg-background-dark/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-surface-active p-1 rounded-lg border border-border-dark flex items-center justify-center overflow-hidden">
            <img src="/DE_ICON.png" alt="Data Eater Icon" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              DATA EATER <span className="text-[10px] font-normal text-text-muted border border-border-dark px-2 py-0.5 rounded-full">v1.4</span>
            </h1>
          </div>
          {fileMeta && (
            <button 
              onClick={handleQuit}
              className="ml-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/20"
            >
              <LogOut size={12} />
              Quitter cette table
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => openModal(setIsExportOpen, "Préparation de l'export...")}
            className="flex items-center gap-2 px-4 h-9 bg-border-dark hover:bg-surface-active rounded-lg text-sm font-bold transition-all border border-transparent hover:border-text-muted"
          >
            <FileOutput size={16} />
            Exporter
          </button>
          <button 
            onClick={() => openModal(setIsExportOpen, "Sauvegarde rapide...")}
            className="flex items-center gap-2 px-4 h-9 bg-primary hover:bg-primary-dim text-background-dark rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)]"
          >
            <Save size={16} />
            Sauvegarder
          </button>
        </div>
      </header>

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <FAQPage isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />
      <FilterModal />
      <NormalizationModal isOpen={isNormalizationOpen} onClose={closeNormalization} />
      <HealthDashboardModal isOpen={isHealthOpen} onClose={() => setIsHealthOpen(false)} />
      <DataVizModal isOpen={isVizOpen} onClose={() => setIsVizOpen(false)} />
      <SplitModal isOpen={isSplitOpen} onClose={() => setIsSplitOpen(false)} />
      <SQLConsoleModal isOpen={isSQLOpen} onClose={() => setIsSQLOpen(false)} />
      <GeoMapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />
      <MagicJoinModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <PivotModal isOpen={isPivotOpen} onClose={() => setIsPivotOpen(false)} />
      <UnpivotModal isOpen={isUnpivotOpen} onClose={() => setIsUnpivotOpen(false)} />
      <RegexExtractorModal isOpen={isRegexOpen} onClose={() => setIsRegexOpen(false)} />
      <FormulaModal isOpen={isFormulaOpen} onClose={() => setIsFormulaOpen(false)} />
      <ConditionalLogicModal isOpen={isLogicOpen} onClose={() => setIsLogicOpen(false)} />
      <DeduplicateModal isOpen={isDedupOpen} onClose={() => setIsDedupOpen(false)} />
      <SmartDateModal isOpen={isSmartDateOpen} onClose={() => setIsSmartDateOpen(false)} />
      <NameSplitterModal isOpen={isNameOpen} onClose={() => setIsNameOpen(false)} />
      <PhoneStandardizerModal isOpen={isPhoneOpen} onClose={() => setIsPhoneOpen(false)} />
      <EmailValidatorModal isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)} />
      <CurrencyNormalizerModal isOpen={isCurrencyOpen} onClose={() => setIsCurrencyOpen(false)} />
      <UnitConverterModal isOpen={isUnitOpen} onClose={() => setIsUnitOpen(false)} />
      <MojibakeModal isOpen={isMojibakeOpen} onClose={() => setIsMojibakeOpen(false)} />
      <MainframizerModal isOpen={isMainframeOpen} onClose={() => setIsMainframeOpen(false)} />
      <FixedWidthModal isOpen={isFixedOpen} onClose={() => setIsFixedOpen(false)} />
      <DateDimensionModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      <DAXModal isOpen={isDAXOpen} onClose={() => setIsDAXOpen(false)} />

      {isRestoreOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-surface-dark border-2 border-primary/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(19,236,91,0.2)] max-w-sm w-full text-center space-y-6">
            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
              <Upload size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-white italic">Reprendre le travail ?</h2>
              <p className="text-sm text-text-muted"> Une recette de nettoyage a été trouvée pour <br/><span className="text-primary font-mono font-bold break-all">{fileMeta?.name}</span></p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setIsRestoreOpen(false)} className="w-full h-12 bg-primary text-background-dark rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">Continuer</button>
              <button onClick={() => { resetData(); setIsRestoreOpen(false); }} className="w-full h-12 bg-transparent border border-border-dark text-subtle rounded-xl font-bold text-xs uppercase hover:text-white transition-colors">Effacer & Nouveau</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenFAQ={() => openModal(setIsFAQOpen, "Je consulte le manuel...")} onOpenHealth={() => openModal(setIsHealthOpen, "Diagnostic complet en cours...")} onOpenViz={() => openModal(setIsVizOpen, "Génération des graphiques...")} />
        <main className="flex-1 flex flex-col bg-background-dark relative min-w-0">
          <div className="h-14 border-b border-border-dark flex items-center justify-between px-6 bg-background-dark/30 shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher (SQL)..." className="bg-surface-dark border border-border-dark rounded-md h-8 pl-9 pr-4 text-xs w-64 focus:outline-none focus:border-primary transition-colors placeholder:text-subtle" />
              </div>
              <button onClick={openFilter} className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-white transition-colors">
                <Filter size={14} /> Filtres
              </button>
              <button onClick={() => openModal(setIsSQLOpen, "Ouverture de la console SQL...")} className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-white transition-colors">
                <Terminal size={14} /> SQL
              </button>
              <button onClick={() => openModal(setIsPivotOpen, "Préparation du tableau croisé...")} className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-white transition-colors">
                <LayoutGrid size={14} /> Pivot
              </button>
              {hasGeo && (
                <button onClick={() => openModal(setIsMapOpen, "Génération de la carte...")} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dim transition-colors animate-in fade-in zoom-in duration-500">
                  <MapIcon size={14} /> Carte
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-subtle tracking-widest">
              <Shield size={12} className="text-primary" /> Chiffrement Local
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 z-50 bg-background-dark/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-white font-bold text-lg animate-pulse">Digestion en cours...</p>
              </div>
            )}
            {!fileMeta ? (
              <div {...getRootProps()} className={clsx("flex-1 flex flex-col items-center justify-center p-12 transition-colors cursor-pointer m-12 rounded-3xl relative overflow-hidden", isDragActive ? "bg-primary/5" : "hover:bg-surface-dark/30")}>
                <input {...getInputProps()} />
                <div className="max-w-md text-center space-y-8 z-10 pointer-events-none">
                  <div className={clsx("size-24 rounded-2xl flex items-center justify-center mx-auto transition-colors", isDragActive ? "text-primary bg-primary/20" : "bg-surface-dark text-subtle")}>
                    <Upload size={48} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black uppercase italic">{isDragActive ? "MIAM ! Lâchez ici" : "Prêt à Digérer"}</h2>
                    <p className="text-text-muted text-base font-medium max-w-sm mx-auto">Déposez vos fichiers CSV ou exports AS400 pour lancer l'analyse locale sécurisée.</p>
                  </div>
                  <div className="pt-4">
                    <button className="px-10 h-14 bg-primary text-background-dark rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,91,0.2)] hover:shadow-[0_0_30px_rgba(19,236,91,0.4)] hover:scale-105 transition-all">Sélectionner un Fichier</button>
                  </div>
                </div>
                <div className={clsx("absolute inset-0 border-2 border-dashed rounded-3xl transition-colors duration-300", isDragActive ? "border-primary shadow-[inset_0_0_40px_rgba(19,236,91,0.1)]" : "border-border-dark")} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="overflow-x-auto overflow-y-hidden bg-surface-active shadow-md shrink-0 border-b border-border-dark">
                  <table className="w-full text-left border-collapse table-fixed min-w-full">
                    <thead className="bg-surface-active text-text-muted text-xs uppercase font-medium">
                      <tr>
                        <th className="w-12 h-12 flex items-center justify-center border-r border-border-dark shrink-0 sticky left-0 bg-surface-active z-20">#</th>
                        {columns.map((col) => {
                          const isSelected = selectedColumn === col.name;
                          const sort = sortConfig?.column === col.name ? sortConfig.direction : null;
                          const health = healthReport?.columnHealth[col.name];
                          return (
                            <th key={col.name} className={clsx("px-3 py-2 border-r border-border-dark font-semibold tracking-wider whitespace-nowrap cursor-pointer transition-colors group select-none relative h-12", isSelected ? "bg-primary/20 text-white border-b-primary border-b-2" : getColumnColor(col.type))} style={{ minWidth: '200px' }}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="truncate" onClick={() => selectColumn(isSelected ? null : col.name)}>{col.name}</span>
                                <span className={clsx("text-[10px] px-1.5 py-0.5 rounded transition-colors font-mono shrink-0", getTypeBadgeColor(col.type))}>{col.type}</span>
                                <button onClick={(e) => { e.stopPropagation(); setSort(col.name); }} className={clsx("p-1 rounded hover:bg-white/10 transition-all", sort ? "text-primary opacity-100" : "text-subtle opacity-0 group-hover:opacity-100")}><ArrowDownUp size={12} className={clsx(sort === 'DESC' && "rotate-180")} /></button>
                              </div>
                              {health && (
                                <div className="w-full h-1 bg-background-dark/50 rounded-full overflow-hidden flex shrink-0" title={`${health.nullPercent.toFixed(1)}% vide`}>
                                  <div className={clsx("h-full transition-all duration-500", health.nullPercent > 50 ? "bg-red-500" : health.nullPercent > 5 ? "bg-yellow-500" : "bg-primary")} style={{ width: `${100 - health.nullPercent}%` }} />
                                </div>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                  </table>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar bg-background-dark/20 text-sm font-mono text-gray-300">
                   <table className="w-full text-left border-collapse table-fixed min-w-full">
                      <tbody>
                        {rows.slice(0, 100).map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface-dark/50 transition-colors border-b border-border-dark">
                            <td className="w-12 p-3 text-center text-subtle text-xs border-r border-border-dark bg-background-dark/30 sticky left-0 z-10">{idx + 1}</td>
                            {columns.map((col) => {
                              const isSelected = selectedColumn === col.name;
                              return (
                                <td key={col.name + idx} className={clsx("px-3 py-2 truncate border-r border-transparent", isSelected ? "bg-primary/5 border-r-primary/10" : getColumnColor(col.type))} style={{ width: '200px' }} title={String(row[col.name])}>
                                  {String(row[col.name])}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            )}
          </div>
          
          <footer className="h-8 border-t border-border-dark bg-background-dark flex items-center justify-between px-4 text-[10px] font-medium text-subtle uppercase tracking-widest shrink-0">
             <div className="flex gap-4">
               <span>{fileMeta ? fileMeta.name : "Aucun fichier"}</span>
               <span>{rowCount.toLocaleString()} Lignes</span>
               {selectedColumn && <span className="text-primary">Colonne: {selectedColumn}</span>}
             </div>
             <div className="flex items-center gap-2">
               <div className={clsx("size-1.5 rounded-full animate-pulse", isReady ? "bg-primary" : "bg-red-500")} /> Moteur DuckDB {isReady ? "Prêt" : "Non initialisé"}
             </div>
          </footer>
        </main>
        <Toolbox 
          onOpenSplit={() => openModal(setIsSplitOpen, "Configuration de la découpe...")} 
          onOpenJoin={() => openModal(setIsJoinOpen, "Préparation de la jointure...")} 
          onOpenUnpivot={() => openModal(setIsUnpivotOpen, "Analyse de la structure...")}
          onOpenRegex={() => openModal(setIsRegexOpen, "Chargement du moteur Regex...")}
          onOpenFormula={() => openModal(setIsFormulaOpen, "Calculatrice prête !")}
          onOpenLogic={() => openModal(setIsLogicOpen, "Logique booléenne activée.")}
          onOpenDedup={() => openModal(setIsDedupOpen, "Recherche de doublons...")}
          onOpenSmartDate={() => openModal(setIsSmartDateOpen, "Analyse des formats de date...")}
          onOpenName={() => openModal(setIsNameOpen, "Détection des noms...")}
          onOpenPhone={() => openModal(setIsPhoneOpen, "Chargement de l'annuaire...")}
          onOpenEmail={() => openModal(setIsEmailOpen, "Vérification des protocoles...")}
          onOpenCurrency={() => openModal(setIsCurrencyOpen, "Taux de change... (blague)")}
          onOpenUnit={() => openModal(setIsUnitOpen, "Calibration des mesures...")}
          onOpenMojibake={() => openModal(setIsMojibakeOpen, "Décodage des hiéroglyphes...")}
          onOpenMainframe={() => openModal(setIsMainframeOpen, "Connexion au Mainframe...")}
          onOpenFixed={() => openModal(setIsFixedOpen, "Calibrage de l'écran vert...")}
          onOpenCalendar={() => openModal(setIsCalendarOpen, "Génération du temps...")}
          onOpenDAX={() => openModal(setIsDAXOpen, "Rédaction des mesures...")}
        />
      </div>
    </div>
  );
}

export default App;