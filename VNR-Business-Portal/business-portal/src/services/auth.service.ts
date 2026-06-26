import api from './api';

export interface Business {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  address_lat: number | null;
  address_lng: number | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cuit?: string;
    responsable_nombre?: string;
    responsable_dni?: string;
    domicilio_real?: string;
    address?: string;
    address_lat?: number;
    address_lng?: number;
  }) {
    const response = await api.post('/business/register', data);
    if (response.data.success) {
      // Si el auto-login falló, el token viene null — hay que hacer login manual
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('business', JSON.stringify(response.data.business));
      } else {
        // Hacer login automático con las mismas credenciales
        return await this.login(data.email, data.password);
      }
    }
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await api.post('/business/login', { email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('business', JSON.stringify(response.data.business));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('business');
  },

  getStoredUser(): BusinessUser | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getStoredBusiness(): Business | null {
    const biz = localStorage.getItem('business');
    return biz ? JSON.parse(biz) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
