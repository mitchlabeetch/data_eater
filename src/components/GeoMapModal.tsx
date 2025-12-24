import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDataStore } from '../stores/dataStore';
import { query } from '../services/duckdb';
import { Map as MapIcon, X, Loader2 } from 'lucide-react';

// Fix for default marker icons in Leaflet + Webpack/Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
  data?: any;
}

interface GeoMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Component to auto-center map when points change
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center);
  return null;
};

export const GeoMapModal: React.FC<GeoMapModalProps> = ({ isOpen, onClose }) => {
  const { columns } = useDataStore();
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      detectAndFetchGeo();
    }
  }, [isOpen]);

  const detectAndFetchGeo = async () => {
    setLoading(true);
    setError(null);
    
    // 1. Detect Lat/Lon columns
    const latCol = columns.find(c => /^(lat|latitude)$/i.test(c.name))?.name;
    const lonCol = columns.find(c => /^(lon|long|longitude|lng)$/i.test(c.name))?.name;
    const labelCol = columns.find(c => /^(name|label|city|site|id)$/i.test(c.name))?.name;

    if (!latCol || !lonCol) {
      setError("Colonnes géographiques (lat/lon) non détectées.");
      setLoading(false);
      return;
    }

    try {
      // 2. Fetch data
      const sql = `
        SELECT 
          CAST("${latCol}" AS DOUBLE) as lat, 
          CAST("${lonCol}" AS DOUBLE) as lng 
          ${labelCol ? `, CAST("${labelCol}" AS VARCHAR) as label` : ''}
        FROM current_dataset 
        WHERE "${latCol}" IS NOT NULL AND "${lonCol}" IS NOT NULL
        LIMIT 500
      `;
      const res = await query(sql);
      
      const geoPoints = res
        .map(r => ({
          lat: Number(r.lat),
          lng: Number(r.lng),
          label: r.label
        }))
        .filter(p => !isNaN(p.lat) && !isNaN(p.lng));

      setPoints(geoPoints);
      if (geoPoints.length === 0) setError("Aucune coordonnée valide trouvée.");
    } catch (e) {
      console.error(e);
      setError("Erreur lors de la lecture des coordonnées.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const defaultCenter: [number, number] = points.length > 0 ? [points[0].lat, points[0].lng] : [43.658, 6.926]; // Default to Grasse (Robertet HQ)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-surface-active rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-surface-active flex justify-between items-center bg-background-dark/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapIcon size={20} className="text-primary" />
            Aperçu Géographique
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Map Body */}
        <div className="flex-1 bg-background-dark relative">
          {loading && (
            <div className="absolute inset-0 z-[1001] bg-background-dark/50 flex flex-col items-center justify-center gap-2">
              <Loader2 size={32} className="text-primary animate-spin" />
              <span className="text-xs text-white font-bold uppercase tracking-widest">Cartographie...</span>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted p-8 text-center">
               <MapIcon size={48} className="opacity-20 mb-4" />
               <p className="max-w-xs">{error}</p>
               <p className="text-[10px] mt-4 uppercase">Colonnes attendues: lat, lon, latitude, longitude</p>
            </div>
          ) : (
            <MapContainer 
              center={defaultCenter} 
              zoom={4} 
              style={{ height: '100%', width: '100%' }}
              className="z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {points.map((p, i) => (
                <Marker key={i} position={[p.lat, p.lng]}>
                  {p.label && (
                    <Popup>
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[10px] text-gray-500">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</div>
                    </Popup>
                  )}
                </Marker>
              ))}
              {points.length > 0 && <ChangeView center={defaultCenter} />}
            </MapContainer>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-surface-active bg-surface-dark flex justify-between items-center text-[10px] text-text-muted uppercase font-bold tracking-widest">
           <span>{points.length} points affichés</span>
           <span className="flex items-center gap-1">
             <div className="size-2 rounded-full bg-primary" />
             Source Locale
           </span>
        </div>

      </div>
    </div>
  );
};
