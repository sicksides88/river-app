import { supabase } from './supabase';
import type { Product, ProductVariant, ProductFilters, PaginatedResponse } from '../types/database';

export const productsService = {
  async getAll(
    page = 1,
    limit = 20,
    filters?: ProductFilters
  ): Promise<PaginatedResponse<Product>> {
    let query = supabase
      .from('products')
      .select('*, category:categories(*), variants:product_variants(*)', { count: 'exact' });

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
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

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), variants:product_variants(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(product: Partial<Product>, variants?: Partial<ProductVariant>[]): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        category_id: product.category_id || null,
        name: product.name,
        description: product.description || null,
        base_price: product.base_price || 0,
        promotional_price: product.promotional_price || null,
        images: product.images || null,
        image_url: product.image_url || null,
        status: product.status || 'active',
        stock: product.stock,
        sku: product.sku || null,
        barcode: product.barcode || null,
        show_price: product.show_price ?? true,
        free_shipping: product.free_shipping ?? false,
        product_type: product.product_type || 'sale',
      })
      .select()
      .single();

    if (error) throw error;

    // Create variants if provided
    if (variants && variants.length > 0) {
      const variantsToInsert = variants.map(v => ({
        product_id: data.id,
        name: v.name,
        price: v.price || data.base_price,
        stock: v.stock || 0,
        is_active: true,
      }));

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

      if (variantError) throw variantError;
    }

    return this.getById(data.id) as Promise<Product>;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Variantes
  async getVariants(productId: string): Promise<ProductVariant[]> {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createVariant(variant: Partial<ProductVariant>): Promise<ProductVariant> {
    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: variant.product_id,
        name: variant.name,
        sku: variant.sku || null,
        price: variant.price || 0,
        stock: variant.stock || 0,
        is_active: variant.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant> {
    const { data, error } = await supabase
      .from('product_variants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteVariant(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Obtener productos con variantes para selector
  async getForSelector(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
