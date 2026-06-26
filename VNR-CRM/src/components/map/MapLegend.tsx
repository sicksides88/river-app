import React from 'react';
import { Car, Truck, Bike, User } from 'lucide-react';

interface MapLegendProps {
  onlineCount: number;
  busyCount: number;
}

const serviceTypes = [
  { id: 'vuelta_segura', label: 'Remis', color: '#22c55e', Icon: Car },
  { id: 'fletes', label: 'Flete', color: '#3b82f6', Icon: Truck },
  { id: 'cadete', label: 'Cadete', color: '#f59e0b', Icon: Bike },
  { id: 'chofer', label: 'Chofer', color: '#8b5cf6', Icon: User },
];

const MapLegend: React.FC<MapLegendProps> = ({ onlineCount }) => {
  return (
    <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-lg p-4 z-10">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Tipos de Servicio</h4>

      <div className="space-y-2">
        {serviceTypes.map(({ id, label, color, Icon }) => (
          <div key={id} className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <Icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Conductores activos</span>
          <span className="text-sm font-bold text-gray-900">{onlineCount}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span>Gris = No disponible</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
