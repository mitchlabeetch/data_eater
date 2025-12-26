import React, { useState } from 'react';
import { X, ChevronRight, ShieldCheck, HelpCircle, Database, BarChart3, FileOutput, Wand2, Layers, Map as MapIcon } from 'lucide-react';
import clsx from 'clsx';

interface FAQPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    id: 'intro',
    title: "Bienvenue dans ma Data Chamber",
    icon: <Database size={20} />,
    gif: '/idle_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Bonjour ! Je suis <strong>Le Glouton</strong> (Data Eater), votre assistant personnel pour le nettoyage et la validation de données chez Robertet.
        </p>
        <p>
          Ma mission est simple : digérer vos fichiers Excel, CSV, JSON ou même PDF (via guidage), vous aider à les nettoyer sans jamais modifier l'original, et vous fournir un fichier "prêt à l'emploi" pour l'AS400 ou PowerBI.
        </p>
        <p>
          Je fonctionne selon un principe strict : <strong>Zero Data Loss</strong>. Je ne touche jamais à votre fichier source. Je travaille toujours sur une copie en mémoire.
        </p>
      </div>
    )
  },
  {
    id: 'dataviz',
    title: "Analyse Visuelle Complète",
    icon: <BarChart3 size={20} />,
    gif: '/processing_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Visualisez vos données instantanément via le bouton <strong>Analyse Visuelle</strong> :
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li><strong>Histogrammes :</strong> Distribution statistique automatique pour les colonnes numériques.</li>
          <li><strong>Outliers (Z-Score) :</strong> Détection des anomalies statistiques (valeurs extrêmes).</li>
          <li><strong>Dual KPI :</strong> Comparez deux métriques (ex: Nombre de ventes vs Montant Total) sur un même graphique.</li>
          <li><strong>Timeline :</strong> Visualisez la densité temporelle de vos événements.</li>
          <li><strong>Bullet Chart :</strong> Idéal pour comparer une performance (barre) à un objectif (cible).</li>
          <li><strong>Nuage de Mots :</strong> Analysez rapidement les termes les plus fréquents dans vos textes.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'geo',
    title: "Cartographie Interactive",
    icon: <MapIcon size={20} />,
    gif: '/processing_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Si je détecte des colonnes GPS (lat/lon), je génère une carte interactive.
        </p>
        <p>
          <strong>Nouveau (v1.5) : Drilldown !</strong><br/>
          Cliquez sur une région ou un point pour <strong>filtrer</strong> automatiquement l'ensemble du jeu de données sur cette zone géographique. Idéal pour analyser des performances régionales.
        </p>
      </div>
    )
  },
  {
    id: 'legacy',
    title: "Gestionnaire de Schéma & AS400",
    icon: <Layers size={20} />,
    gif: '/diff_inspect_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Préparez vos fichiers pour l'AS400 (IBM i) avec précision :
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li><strong>Mode AS400 :</strong> Renommage forcé en majuscules, sans accent, max 10 caractères.</li>
          <li><strong>Réorganisation :</strong> Changez l'ordre des colonnes par simple glisser-déposer (ou flèches).</li>
          <li><strong>Import Copybook :</strong> Collez vos définitions COBOL (ex: <code>01 NOM PIC X(10)</code>) pour mapper automatiquement les noms de colonnes !</li>
        </ul>
      </div>
    )
  },
  {
    id: 'dedup',
    title: "Dédoublonnage Intelligent",
    icon: <Wand2 size={20} />,
    gif: '/processing_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Ne laissez plus passer les doublons.
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li><strong>Mode Strict :</strong> Supprime les lignes 100% identiques.</li>
          <li><strong>Mode Intelligent (Fuzzy) :</strong> Détecte les doublons même avec des différences de casse ou d'espaces (ex: "Robertet" = " robertet ").</li>
          <li><strong>Prévisualisation :</strong> Je vous dis exactement combien de lignes vont sauter AVANT que vous cliquiez.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'security',
    title: "Sécurité & Anonymisation",
    icon: <ShieldCheck size={20} />,
    gif: '/processing_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          La sécurité est ma priorité.
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li><strong>Scan de Secrets :</strong> Le Bulletin de Santé scanne vos colonnes pour détecter des fuites potentielles (mots clés : password, api_key, token...).</li>
          <li><strong>Anonymisation (PII) :</strong> Un nouvel outil dans la boîte à outils permet de remplacer le contenu d'une colonne sensible par des astérisques (*****).</li>
        </ul>
      </div>
    )
  },
  {
    id: 'export',
    title: "Export & PowerBI",
    icon: <FileOutput size={20} />,
    gif: '/query_chef_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Une fois nettoyées, exportez vos données où vous voulez :
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li><strong>Formats :</strong> CSV, Excel, JSON (Web), Parquet (Big Data).</li>
          <li><strong>Thème PowerBI :</strong> Vous aimez mes couleurs ? Téléchargez le fichier de thème <code>.json</code> pour l'appliquer à vos rapports PowerBI !</li>
        </ul>
      </div>
    )
  }
];

const FAQPage: React.FC<FAQPageProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  if (!isOpen) return null;

  const currentContent = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-50 bg-background-dark flex animate-in slide-in-from-bottom-10 duration-300">
      
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-surface-dark border-r border-border-dark flex flex-col">
        <div className="p-6 border-b border-border-dark flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <HelpCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Guide v1.5</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={clsx(
                "w-full flex items-center justify-between p-4 rounded-xl text-sm font-medium transition-all group",
                activeSection === section.id 
                  ? "bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,91,0.3)]" 
                  : "bg-surface-active/50 text-text-muted hover:bg-surface-active hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                {section.icon}
                <span>{section.title.split(' ').slice(0, 3).join(' ')}...</span>
              </div>
              {activeSection === section.id && <ChevronRight size={16} />}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border-dark">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-surface-active hover:bg-border-dark text-white rounded-xl font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <X size={18} />
            Retour à l'App
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto bg-background-dark p-12 flex justify-center">
        <div className="max-w-3xl w-full space-y-8 pb-20">
          
          {currentContent && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 key={currentContent.id}">
              
              {/* Header with GIF */}
              <div className="flex items-start gap-8 border-b border-border-dark pb-8">
                <div className="size-48 shrink-0 bg-surface-dark rounded-2xl border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-2xl relative group">
                   <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                   <img src={currentContent.gif} alt="" className="w-full h-full object-contain p-4" />
                </div>
                <div className="space-y-4 pt-4">
                  <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                    {currentContent.title}
                  </h1>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-surface-active border border-border-dark text-xs text-text-muted uppercase font-bold">
                      Guide
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface-active border border-border-dark text-xs text-primary uppercase font-bold">
                      v1.5
                    </span>
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <div className="prose prose-invert prose-lg text-gray-300 leading-relaxed">
                {currentContent.content}
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
};

export default FAQPage;