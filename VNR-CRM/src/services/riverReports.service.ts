import api from './api';
import { supabase } from './supabase';

export interface AuxilioReportRow {
  id: string;
  status: string;
  riverStatus: string;
  emergencyType?: string;
  navegante: string;
  naveganteEmail: string;
  patron: string;
  embarcacion: string;
  direccion: string;
  lat?: number;
  lng?: number;
  etaMinutes?: number;
  created_at: string;
  completed_at?: string;
}

export const riverReportsService = {
  async listAuxilios(params: {
    from?: string;
    to?: string;
    status?: string;
    limit?: number;
  }) {
    const { data } = await api.get('/admin/reports/auxilios', {
      params: { ...params, format: 'json' },
    });
    return data as { success: boolean; count: number; auxilios: AuxilioReportRow[] };
  },

  async downloadCsv(params: { from?: string; to?: string; status?: string; limit?: number }) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const base = import.meta.env.VITE_API_URL || 'https://river-backend-idio.onrender.com/api';
    const qs = new URLSearchParams();
    qs.set('format', 'csv');
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.status) qs.set('status', params.status);
    if (params.limit) qs.set('limit', String(params.limit));
    const res = await fetch(`${base}/admin/reports/auxilios?${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Error al exportar');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auxilios-river-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export default riverReportsService;
