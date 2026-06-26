import api from './api';
import type { Business } from './auth.service';

export interface DeliveryDriver {
  id: string;
  nombre: string;
  apellido: string;
  telefono_numero: string;
  avatar: string | null;
}

export interface Delivery {
  id: string;
  user_id: string;
  business_id: string;
  driver_id: string | null;
  service_type: string;
  delivery_type: string;
  status: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_contact_name: string | null;
  pickup_contact_phone: string | null;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  dropoff_contact_name: string | null;
  dropoff_contact_phone: string | null;
  package_description: string | null;
  notes: string | null;
  estimated_price: number | null;
  actual_price: number | null;
  distance: number | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  driver?: DeliveryDriver;
}

export interface DriverLocation {
  current_latitude: number;
  current_longitude: number;
  last_location_update: string;
}

export interface PriceEstimate {
  price: number;
  distance: number;
  duration: number;
  breakdown: {
    base: number;
    perKm: number;
    distanceKm: number;
  };
  commission: {
    platform: number;
    driver: number;
  };
}

export interface BusinessCharge {
  id: string;
  business_id: string;
  delivery_id: string;
  amount: number;
  platform_fee: number;
  driver_amount: number;
  status: 'pending' | 'invoiced' | 'paid';
  invoiced_at: string | null;
  paid_at: string | null;
  invoice_number: string | null;
  created_at: string;
  delivery?: {
    id: string;
    tracking_number: string;
    dropoff_address: string;
    created_at: string;
  };
}

export const businessService = {
  // Profile
  async getProfile(): Promise<Business> {
    const { data } = await api.get('/business/profile');
    return data.business;
  },

  async updateProfile(updates: Partial<Business>): Promise<Business> {
    const { data } = await api.put('/business/profile', updates);
    return data.business;
  },

  // Deliveries
  async createDelivery(deliveryData: {
    pickup: {
      address: string;
      lat?: number;
      lng?: number;
      contactName?: string;
      contactPhone?: string;
    };
    dropoff: {
      address: string;
      lat?: number;
      lng?: number;
      contactName?: string;
      contactPhone?: string;
    };
    packageDescription?: string;
    notes?: string;
  }): Promise<Delivery> {
    const { data } = await api.post('/business/deliveries', deliveryData);
    return data.delivery;
  },

  async getDeliveries(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    data: Delivery[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { data } = await api.get('/business/deliveries', { params });
    return data;
  },

  async getDeliveryById(id: string): Promise<{
    delivery: Delivery;
    driverLocation: DriverLocation | null;
  }> {
    const { data } = await api.get(`/business/deliveries/${id}`);
    return data;
  },

  async cancelDelivery(id: string): Promise<void> {
    await api.put(`/business/deliveries/${id}/cancel`);
  },

  // Estimación de precio
  async estimatePrice(pickup: {
    address: string;
    lat?: number;
    lng?: number;
  }, dropoff: {
    address: string;
    lat?: number;
    lng?: number;
  }): Promise<PriceEstimate> {
    const { data } = await api.post('/business/estimate-price', { pickup, dropoff });
    return data.estimate;
  },

  // Repetir envío
  async repeatDelivery(deliveryId: string): Promise<Delivery> {
    const { data } = await api.post(`/business/deliveries/${deliveryId}/repeat`);
    return data.delivery;
  },

  // Cargos/Facturación
  async getCharges(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    data: BusinessCharge[];
    totals: { total: number; pending: number; paid: number };
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { data } = await api.get('/business/charges', { params });
    return data;
  },
};
