import { supabase } from './supabase';
import type { Promotion, PromotionFilters, PaginatedResponse } from '../types/database';

export const promotionsService = {
  async getAll(
    page = 1,
    limit = 20,
    filters?: PromotionFilters
  ): Promise<PaginatedResponse<Promotion>> {
    let query = supabase
      .from('promotions')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getById(id: string): Promise<Promotion | null> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(promotion: Partial<Promotion>): Promise<Promotion> {
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        name: promotion.name,
        discount_type: promotion.discount_type || 'percentage',
        discount_value: promotion.discount_value || null,
        buy_quantity: promotion.buy_quantity || null,
        pay_quantity: promotion.pay_quantity || null,
        apply_to: promotion.apply_to || 'all',
        valid_from: promotion.valid_from || null,
        valid_until: promotion.valid_until || null,
        status: promotion.status || 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Promotion>): Promise<Promotion> {
    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleStatus(id: string, status: Promotion['status']): Promise<Promotion> {
    return this.update(id, { status });
  },

  async getActive(): Promise<Promotion[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
