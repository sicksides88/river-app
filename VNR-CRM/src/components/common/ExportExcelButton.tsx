import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportTableToExcel } from '../../utils/exportExcel';

interface ExportExcelButtonProps {
  filename: string;
  headers: string[];
  getRows: () => Promise<(string | number | null | undefined)[][]> | (string | number | null | undefined)[][];
  label?: string;
  className?: string;
  disabled?: boolean;
}

const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  filename,
  headers,
  getRows,
  label = 'Exportar Excel',
  className = '',
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const rows = await getRows();
      exportTableToExcel(filename, headers, rows);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || loading}
      className={
        className ||
        'inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50'
      }
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {label}
    </button>
  );
};

export default ExportExcelButton;
