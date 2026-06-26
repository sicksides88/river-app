import { supabase } from './supabase';
import type { Banner, BannerFilters, PaginatedResponse } from '../types/database';

export const bannersService = {
  async getAll(
    page = 1,
    limit = 20,
    filters?: BannerFilters
  ): Promise<PaginatedResponse<Banner>> {
    let query = supabase
      .from('banners')
      .select('*', { count: 'exact' });

    if (filters?.location) {
      query = query.eq('location', filters.location);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('order_index', { ascending: true })
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

  async getById(id: string): Promise<Banner | null> {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(banner: Partial<Banner>): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .insert({
        title: banner.title,
        description: banner.description || null,
        image_url: banner.image_url || null,
        button_text: banner.button_text || null,
        action_type: banner.action_type || 'none',
        action_value: banner.action_value || null,
        location: banner.location || 'home',
        order_index: banner.order_index || 0,
        is_active: banner.is_active ?? true,
        starts_at: banner.starts_at || null,
        ends_at: banner.ends_at || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Banner>): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // First get the banner to check if it has an image
    const banner = await this.getById(id);

    // Delete image from storage if exists
    if (banner?.image_url) {
      await this.deleteImage(banner.image_url);
    }

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleStatus(id: string, isActive: boolean): Promise<Banner> {
    return this.update(id, { is_active: isActive });
  },

  async updateOrder(id: string, orderIndex: number): Promise<Banner> {
    return this.update(id, { order_index: orderIndex });
  },

  // Image upload to Supabase Storage
  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async deleteImage(imageUrl: string): Promise<void> {
    // Extract the file path from the URL
    const urlParts = imageUrl.split('/images/');
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
    }
  },

  // Reorder banners
  async reorderBanners(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => ({
      id,
      order_index: index,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('banners')
        .update({ order_index: update.order_index, updated_at: update.updated_at })
        .eq('id', update.id);

      if (error) throw error;
    }
  },
};
