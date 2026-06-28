import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import FieldHelp from './FieldHelp';

export interface SearchSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
  selectedLabel?: string;
  onChange: (id: string, option: SearchSelectOption | null) => void;
  onSearch: (query: string) => Promise<SearchSelectOption[]>;
  minSearchLength?: number;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  allowClear?: boolean;
  help?: string;
}

const SearchSelect: React.FC<SearchSelectProps> = ({
  label,
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Buscar…',
  value,
  selectedLabel,
  onChange,
  onSearch,
  minSearchLength = 0,
  required = false,
  disabled = false,
  emptyMessage = 'Sin resultados',
  allowClear = true,
  help,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      const trimmed = query.trim();

      if (trimmed.length < minSearchLength) {
        if (minSearchLength === 0) {
          setLoading(true);
          try {
            const results = await onSearch('');
            setOptions(results);
          } catch {
            setOptions([]);
          } finally {
            setLoading(false);
          }
        } else {
          setOptions([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const results = await onSearch(trimmed);
        setOptions(results);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, query, minSearchLength, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayLabel = selectedLabel || (value ? 'Seleccionado' : '');

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && !value && <span className="text-red-500 ml-0.5">*</span>}
        {help && <FieldHelp text={help} />}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm text-left bg-white ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
        } ${required && !value ? 'border-gray-300' : 'border-gray-300'}`}
      >
        <span className={displayLabel ? 'text-gray-900' : 'text-gray-400'}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {value && allowClear && !disabled && (
        <button
          type="button"
          onClick={() => {
            onChange('', null);
            setQuery('');
          }}
          className="absolute right-8 top-9 text-gray-400 hover:text-gray-600"
          aria-label="Limpiar selección"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : query.trim().length < minSearchLength ? (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">
                {minSearchLength > 0
                  ? `Escribí al menos ${minSearchLength} caracteres para buscar`
                  : emptyMessage}
              </p>
            ) : options.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">{emptyMessage}</p>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id, option);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0 ${
                    value === option.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="font-medium text-gray-900">{option.label}</span>
                  {option.sublabel && (
                    <span className="block text-xs text-gray-500 mt-0.5">{option.sublabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
