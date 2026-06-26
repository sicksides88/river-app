import React from 'react';
import { Check, Clock, Truck, MapPin, Package, CheckCircle2 } from 'lucide-react';

const steps = [
  { key: 'pending', label: 'Pendiente', icon: Clock },
  { key: 'confirmed', label: 'Confirmado', icon: Check },
  { key: 'arrived_pickup', label: 'En origen', icon: MapPin },
  { key: 'picked_up', label: 'Recogido', icon: Package },
  { key: 'in_transit', label: 'En camino', icon: Truck },
  { key: 'delivered', label: 'Entregado', icon: CheckCircle2 },
];

interface StatusTimelineProps {
  currentStatus: string;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus }) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl">
        <span className="font-medium">Envío cancelado</span>
      </div>
    );
  }

  const currentIndex = steps.findIndex(s => s.key === currentStatus);

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-green-500 text-white' :
                isCurrent ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              {index < steps.length - 1 && (
                <div className={`w-0.5 h-8 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="pt-1">
              <p className={`text-sm font-medium ${
                isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
