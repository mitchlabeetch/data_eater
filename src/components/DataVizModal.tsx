import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  LineChart, Line
} from 'recharts';
import { useDataStore } from '../stores/dataStore';
import { query } from '../services/duckdb';

interface DataVizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#13ec5b', '#0fa640', '#9db9a6', '#55695e', '#28392e', '#1c2a21'];

export const DataVizModal: React.FC<DataVizModalProps> = ({ isOpen, onClose }) => {
  const { selectedColumn, columnStats, columns } = useDataStore();
  const [vizData, setVizData] = useState<any[]>([]);
  const [vizType, setVizType] = useState<'AUTO' | 'PIE' | 'BAR' | 'LINE' | 'SCATTER'>('AUTO');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedColumn) {
      loadSpecializedData();
    }
  }, [isOpen, selectedColumn]);

  const loadSpecializedData = async () => {
    if (!selectedColumn) return;
    setLoading(true);
    
    const colDef = columns.find(c => c.name === selectedColumn);
    const type = colDef?.type.toUpperCase() || '';

    try {
      if (type.includes('DATE') || type.includes('TIMESTAMP')) {
        const sql = `
          SELECT "${selectedColumn}"::DATE as date, COUNT(*) as count 
          FROM current_dataset 
          WHERE "${selectedColumn}" IS NOT NULL 
          GROUP BY date 
          ORDER BY date ASC 
          LIMIT 100
        `;
        const res = await query(sql);
        setVizData(res.map(r => ({ name: r.date, value: r.count })));
        setVizType('LINE');
      } else {
        setVizData(columnStats?.topValues?.map(v => ({ name: v.value || '(Vide)', value: v.count })) || []);
        setVizType(columnStats?.sum !== undefined ? 'BAR' : 'PIE');
      }
    } catch (e) {
      console.error("Viz Query Failed", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !selectedColumn || !columnStats) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-4xl h-[650px] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-surface-active flex justify-between items-center bg-background-dark/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">analytics</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Analyse Visuelle</h2>
              <p className="text-xs text-text-muted font-mono">{selectedColumn}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-active rounded-lg transition-colors text-text-muted hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 p-8 bg-background-dark/30 relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-surface-dark/50 flex items-center justify-center">
               <span className="text-primary animate-pulse font-bold uppercase tracking-widest">Calcul des graphiques...</span>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            {vizType === 'LINE' ? (
              <LineChart data={vizData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#28392e" vertical={false} />
                <XAxis dataKey="name" stroke="#55695e" fontSize={10} />
                <YAxis stroke="#55695e" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1c2a21', borderColor: '#28392e', color: '#fff' }} itemStyle={{ color: '#13ec5b' }} />
                <Line type="monotone" dataKey="value" stroke="#13ec5b" strokeWidth={3} dot={{ r: 4, fill: '#13ec5b' }} activeDot={{ r: 6 }} />
              </LineChart>
            ) : (
              vizType === 'BAR' ? (
                <BarChart data={vizData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#28392e" horizontal={false} />
                  <XAxis type="number" stroke="#55695e" fontSize={10} />
                  <YAxis dataKey="name" type="category" width={100} stroke="#9db9a6" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1c2a21', borderColor: '#28392e', color: '#fff' }} itemStyle={{ color: '#13ec5b' }} />
                  <Bar dataKey="value" fill="#13ec5b" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie data={vizData} cx="50%" cy="50%" innerRadius={100} outerRadius={160} paddingAngle={8} dataKey="value" animationBegin={0} animationDuration={800}>
                    {vizData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1c2a21" strokeWidth={4} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1c2a21', borderColor: '#28392e', borderRadius: '8px', border: 'none' }} itemStyle={{ color: '#13ec5b' }} />
                </PieChart>
              )
            )}
          </ResponsiveContainer>
        </div>

        <div className="p-4 border-t border-surface-active bg-surface-dark flex justify-between items-center text-xs text-text-muted">
           <div className="flex gap-4">
             <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-primary" /><span>Échantillon: Top 100</span></div>
             <div>Type: <span className="text-white font-mono">{vizType}</span></div>
           </div>
           <div className="text-text-subtle italic">Appuyez sur ESC pour fermer</div>
        </div>
      </div>
    </div>
  );
};
