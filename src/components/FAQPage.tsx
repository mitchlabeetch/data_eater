import React, { useState } from 'react';
import { X, ChevronRight, ShieldCheck, HelpCircle, Database, Search, AlertTriangle } from 'lucide-react';
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
          Ma mission est simple : digérer vos fichiers Excel ou CSV bruts, vous aider à les nettoyer sans jamais modifier l'original, et vous fournir un fichier "prêt à l'emploi" pour l'AS400 ou PowerBI.
        </p>
        <p>
          Je fonctionne selon un principe strict : <strong>Zero Data Loss</strong>. Je ne touche jamais à votre fichier source. Je travaille toujours sur une copie en mémoire.
        </p>
      </div>
    )
  },
  {
    id: 'diff',
    title: "L'Inspecteur de Différences",
    icon: <Search size={20} />,
    gif: '/diff_inspect_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Vous avez deux versions d'un fichier (ex: <em>Paye_V1.xlsx</em> et <em>Paye_V2.xlsx</em>) et vous ne savez pas ce qui a changé ?
        </p>
        <p>
          Utilisez l'outil <strong>Comparer Jeux</strong> dans la boîte à outils.
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li>Je charge le second fichier en mémoire.</li>
          <li>Je compare ligne par ligne.</li>
          <li>Je vous dis exactement combien de lignes ont été ajoutées ou supprimées.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'query',
    title: "Le Chef des Requêtes",
    icon: <HelpCircle size={20} />,
    gif: '/query_chef_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Parfois, le nettoyage manuel ne suffit pas. Vous avez besoin de poser des questions complexes à vos données.
        </p>
        <p>
          Mon mode <strong>Smart Query</strong> (disponible via l'API Cloud) me permet de comprendre le langage naturel. Vous pouvez me demander :
          <br/>
          <em className="text-primary">"Montre-moi toutes les ventes de Jasmin supérieures à 1000€"</em>
        </p>
        <p>
          Je traduis cela en SQL et je vous montre le résultat. Et n'oubliez pas : vous pouvez cacher les colonnes sensibles avant que je pose la question au Cloud !
        </p>
      </div>
    )
  },
  {
    id: 'processing',
    title: "Nettoyage & Sécurité",
    icon: <ShieldCheck size={20} />,
    gif: '/processing_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Ma spécialité, c'est la <strong>conformité</strong>.
        </p>
        <p>
          Pour l'AS400 (IBM iSeries), je vérifie :
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li>Que vos noms de colonnes ne dépassent pas 30 caractères.</li>
          <li>Qu'il n'y a pas de caractères interdits (Emojis, accents exotiques) qui briseraient l'import.</li>
          <li>Que l'encodage est bien compatible (Windows-1252).</li>
        </ul>
        <p>
          Je peux aussi réparer vos dates automatiquement (US vs FR) et nettoyer les espaces inutiles.
        </p>
      </div>
    )
  },
  {
    id: 'errors',
    title: "Gestion des Erreurs",
    icon: <AlertTriangle size={20} />,
    gif: '/error_state.gif',
    content: (
      <div className="space-y-4">
        <p>
          Si je deviens rouge (Indigestion), c'est qu'il y a un problème critique.
        </p>
        <p>
          Les causes les plus fréquentes :
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li>Le fichier est corrompu.</li>
          <li>Vous essayez de comparer deux fichiers qui n'ont pas du tout la même structure (colonnes différentes).</li>
          <li>Une requête SQL personnalisée est invalide.</li>
        </ul>
        <p>
          Pas de panique ! Rien n'est cassé sur votre ordinateur. Rechargez simplement le fichier ou annulez la dernière action.
        </p>
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
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Comment ça marche ?</h2>
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
                      v1.2
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
