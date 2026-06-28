import React from 'react';
import { HelpCircle } from 'lucide-react';

interface FieldHelpProps {
  text: string;
}

/** Icono de ayuda con tooltip al pasar el mouse */
const FieldHelp: React.FC<FieldHelpProps> = ({ text }) => (
  <span className="relative group inline-flex ml-1.5 align-middle">
    <HelpCircle
      className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors"
      aria-label="Ayuda"
    />
    <span
      role="tooltip"
      className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute z-50 left-6 top-1/2 -translate-y-1/2 w-64 p-3 text-xs leading-relaxed text-white bg-gray-900 rounded-lg shadow-xl"
    >
      {text}
    </span>
  </span>
);

interface FieldLabelProps {
  htmlFor?: string;
  label: string;
  help: string;
  required?: boolean;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ htmlFor, label, help, required }) => (
  <label htmlFor={htmlFor} className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
    {label}
    {required && <span className="text-red-500 ml-0.5">*</span>}
    <FieldHelp text={help} />
  </label>
);

export default FieldHelp;
