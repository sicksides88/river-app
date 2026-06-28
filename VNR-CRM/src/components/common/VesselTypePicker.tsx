import React from 'react';
import { Anchor, Sailboat, Zap, Waves } from 'lucide-react';
import { VESSEL_TYPE_OPTIONS, VesselTypeId } from '../../constants/vesselTypes';
import { FieldLabel } from './FieldHelp';

const ICONS: Record<VesselTypeId, React.ReactNode> = {
  Motor: <Anchor className="w-6 h-6" />,
  Vela: <Sailboat className="w-6 h-6" />,
  Jetsky: <Zap className="w-6 h-6" />,
  Remo: <Waves className="w-6 h-6" />,
};

interface VesselTypePickerProps {
  value: VesselTypeId | '';
  onChange: (value: VesselTypeId) => void;
  required?: boolean;
  error?: string;
}

const VesselTypePicker: React.FC<VesselTypePickerProps> = ({
  value,
  onChange,
  required = false,
  error,
}) => (
  <div>
    <FieldLabel
      label="Tipo de embarcación"
      required={required}
      help="Elegí el mismo tipo que en la app móvil: Motor, Vela, Jetsky o Remo. Define cómo se clasifica la embarcación en River Service."
    />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {VESSEL_TYPE_OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.description}
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
              selected
                ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className={selected ? 'text-blue-600' : 'text-gray-400'}>{ICONS[opt.id]}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
    {value && (
      <p className="mt-2 text-xs text-gray-500">
        {VESSEL_TYPE_OPTIONS.find((o) => o.id === value)?.description}
      </p>
    )}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default VesselTypePicker;
