import { supabase } from './supabase';
import type { Coupon, CouponFilters, PaginatedResponse } from '../types/database';

export const couponsService = {
  async getAll(
    page = 1,
    limit = 20,
    filters?: CouponFilters
  ): Promise<PaginatedResponse<Coupon>> {
    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.code) {
      query = query.ilike('code', `%${filters.code}%`);
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

  async getById(id: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(coupon: Partial<Coupon>): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code: coupon.code?.toUpperCase(),
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value || 0,
        apply_to: coupon.apply_to || 'all',
        apply_to_id: coupon.apply_to_id || null,
        include_shipping: coupon.include_shipping || false,
        min_cart_amount: coupon.min_cart_amount || null,
        max_uses: coupon.max_uses || null,
        max_uses_per_user: coupon.max_uses_per_user || null,
        valid_from: coupon.valid_from || null,
        valid_until: coupon.valid_until || null,
        first_purchase_only: coupon.first_purchase_only || false,
        status: coupon.status || 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .update({
        ...updates,
        code: updates.code?.toUpperCase(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleStatus(id: string, status: Coupon['status']): Promise<Coupon> {
    return this.update(id, { status });
  },

  async incrementUses(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_coupon_uses', { coupon_id: id });
    if (error) throw error;
  },
};
