import { supabase } from './supabase';
import type { Order, OrderItem, OrderFilters, PaginatedResponse } from '../types/database';

export const ordersService = {
  async getAll(
    page = 1,
    limit = 20,
    filters?: OrderFilters
  ): Promise<PaginatedResponse<Order>> {
    let query = supabase
      .from('orders')
      .select('*, items:order_items(*), user:profiles(*)', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }
    if (filters?.customer_email) {
      query = query.ilike('customer_email', `%${filters.customer_email}%`);
    }
    if (filters?.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,customer_lastname.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`
      );
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
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

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*), user:profiles(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(order: Partial<Order>, items: Partial<OrderItem>[]): Promise<Order> {
    // Generar número de pedido único
    const orderNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const total = subtotal + (order.shipping_cost || 0) - (order.discount || 0);

    // Crear orden
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: order.user_id || null,
        customer_name: order.customer_name,
        customer_lastname: order.customer_lastname,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone || null,
        customer_dni: order.customer_dni || null,
        shipping_street: order.shipping_street || null,
        shipping_number: order.shipping_number || null,
        shipping_floor: order.shipping_floor || null,
        shipping_postal_code: order.shipping_postal_code || null,
        shipping_neighborhood: order.shipping_neighborhood || null,
        shipping_city: order.shipping_city || null,
        shipping_province: order.shipping_province || null,
        subtotal,
        shipping_cost: order.shipping_cost || 0,
        discount: order.discount || 0,
        total,
        status: order.status || 'pending',
        payment_status: order.payment_status || 'not_paid',
        notes: order.notes || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Crear items del pedido
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.product_id || null,
      variant_id: item.variant_id || null,
      product_name: item.product_name,
      variant_name: item.variant_name || null,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total: item.total || 0,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Retornar orden con items
    return this.getById(orderData.id) as Promise<Order>;
  },

  async update(id: string, updates: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    return this.update(id, { status });
  },

  async updatePaymentStatus(id: string, payment_status: Order['payment_status']): Promise<Order> {
    return this.update(id, { payment_status });
  },

  async getStats() {
    const { data, error } = await supabase
      .from('orders')
      .select('status, payment_status, total');

    if (error) throw error;

    return {
      totalOrders: data?.length || 0,
      pendingOrders: data?.filter(o => o.status === 'pending').length || 0,
      completedOrders: data?.filter(o => o.status === 'delivered').length || 0,
      totalRevenue: data?.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0) || 0,
      pendingPayments: data?.filter(o => o.payment_status === 'pending').length || 0,
    };
  },
};
