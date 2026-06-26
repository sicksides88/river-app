import { supabase } from './supabase';
import type {
  ServiceRate,
  PriceRule,
  ServiceRateFilters,
  PriceRuleFilters,
  RateServiceType,
} from '../types/database';

export const tarifasService = {
  // ============================================
  // SERVICE RATES
  // ============================================

  async getAllRates(filters?: ServiceRateFilters): Promise<ServiceRate[]> {
    let query = supabase.from('service_rates').select('*');

    if (filters?.service_type) {
      query = query.eq('service_type', filters.service_type);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query.order('service_type');
    if (error) throw error;
    return data || [];
  },

  async getRateById(id: string): Promise<ServiceRate | null> {
    const { data, error } = await supabase
      .from('service_rates')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getRateByServiceType(serviceType: RateServiceType): Promise<ServiceRate | null> {
    const { data, error } = await supabase
      .from('service_rates')
      .select('*')
      .eq('service_type', serviceType)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createRate(
    rate: Omit<ServiceRate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceRate> {
    const { data, error } = await supabase
      .from('service_rates')
      .insert(rate)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRate(
    id: string,
    updates: Partial<Omit<ServiceRate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceRate> {
    const { data, error } = await supabase
      .from('service_rates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleRateStatus(id: string, is_active: boolean): Promise<ServiceRate> {
    return this.updateRate(id, { is_active });
  },

  async deleteRate(id: string): Promise<void> {
    const { error } = await supabase.from('service_rates').delete().eq('id', id);

    if (error) throw error;
  },

  // ============================================
  // PRICE RULES
  // ============================================

  async getAllRules(filters?: PriceRuleFilters): Promise<PriceRule[]> {
    let query = supabase.from('price_rules').select('*');

    if (filters?.rule_type) {
      query = query.eq('rule_type', filters.rule_type);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query.order('priority', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getRuleById(id: string): Promise<PriceRule | null> {
    const { data, error } = await supabase
      .from('price_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createRule(
    rule: Omit<PriceRule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PriceRule> {
    const { data, error } = await supabase
      .from('price_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRule(
    id: string,
    updates: Partial<Omit<PriceRule, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<PriceRule> {
    const { data, error } = await supabase
      .from('price_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleRuleStatus(id: string, is_active: boolean): Promise<PriceRule> {
    return this.updateRule(id, { is_active });
  },

  async deleteRule(id: string): Promise<void> {
    const { error } = await supabase.from('price_rules').delete().eq('id', id);

    if (error) throw error;
  },

  // ============================================
  // LABELS (for UI)
  // ============================================

  getServiceTypeLabel(serviceType: RateServiceType): string {
    const labels: Record<RateServiceType, string> = {
      vuelta_segura: 'Vuelta Segura',
      chofer: 'Chofer',
      envios: 'Envios',
      fletes: 'Fletes',
    };
    return labels[serviceType] || serviceType;
  },

  getUnitTypeLabel(unitType: string): string {
    const labels: Record<string, string> = {
      km: 'por km',
      hora: 'por hora',
    };
    return labels[unitType] || unitType;
  },
};
