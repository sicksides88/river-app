// Types basados en el esquema de base de datos VNR (tables.md)

export type UserRole = 'user' | 'driver' | 'admin' | 'business' | 'operator' | 'auditor';
export type DriverStatus = 'pending_documents' | 'pending_review' | 'active' | 'suspended';
export type DriverType = 'particular' | 'profesional';
export type TrustLevel = 'bronce' | 'plata' | 'oro' | 'platino';

export type RideStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceType = 'vuelta_segura' | 'chofer';

export type DeliveryStatus = 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
export type DeliveryType = 'envio' | 'flete';
export type DeliveryServiceType = 'envios' | 'fletes';

export type DocumentType = 'dni_frente' | 'dni_dorso' | 'licencia_frente' | 'licencia_dorso' | 'cedula_verde' | 'seguro' | 'vtv' | 'certificado_buena_conducta' | 'seguro_accidentes_personales';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export type VehicleType = 'auto' | 'moto' | 'camioneta' | 'camion';

export type LocationType = 'origin' | 'destination' | 'both';
export type LocationLabel = 'home' | 'work' | 'other';

export type TrustPointReason =
  | 'ride_completed'
  | 'delivery_completed'
  | 'good_rating'
  | 'bad_rating'
  | 'cancellation'
  | 'late_arrival'
  | 'early_arrival'
  | 'bonus_weekend'
  | 'bonus_holiday'
  | 'bonus_night'
  | 'complaint'
  | 'accident'
  | 'manual_adjustment'
  | 'first_trip';

export type ReferenceType = 'ride' | 'delivery';

// ============================================
// PROFILES (Usuarios)
// ============================================
export type DriverService = 'vuelta_segura' | 'fletes' | 'cadete' | 'chofer';

export interface Profile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono_codigo_pais: string;
  telefono_numero: string;
  direccion: string;
  role: UserRole;
  is_verified: boolean;
  avatar: string | null;
  created_at: string;
  updated_at: string;
  is_driver: boolean;
  driver_status: DriverStatus | null;
  driver_type: DriverType | null;
  trust_points: number;
  trust_level: TrustLevel;
  driver_approved_at: string | null;
  driver_suspended_at: string | null;
  suspension_reason: string | null;
  selected_services: DriverService[] | null;
}

// ============================================
// RIDES (Viajes)
// ============================================
export interface Ride {
  id: string;
  user_id: string;
  driver_id: string | null;
  service_type: ServiceType;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  scheduled_date: string | null;
  scheduled_hour: number | null;
  scheduled_minute: number | null;
  status: RideStatus;
  estimated_price: number | null;
  actual_price: number | null;
  distance: number | null;
  duration: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  user?: Profile;
  driver?: Profile;
}

// ============================================
// DELIVERIES (Envíos/Fletes)
// ============================================
export interface Delivery {
  id: string;
  user_id: string;
  driver_id: string | null;
  service_type: DeliveryServiceType;
  delivery_type: DeliveryType;
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
  scheduled_date: string | null;
  scheduled_hour: number | null;
  scheduled_minute: number | null;
  package_description: string | null;
  package_weight: number | null;
  package_length: number | null;
  package_width: number | null;
  package_height: number | null;
  package_is_fragile: boolean;
  status: DeliveryStatus;
  estimated_price: number | null;
  actual_price: number | null;
  distance: number | null;
  tracking_number: string | null;
  notes: string | null;
  business_id: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  user?: Profile;
  driver?: Profile;
}

// ============================================
// SAVED_LOCATIONS (Ubicaciones guardadas)
// ============================================
export interface SavedLocation {
  id: string;
  user_id: string;
  address: string;
  formatted_address: string | null;
  lat: number;
  lng: number;
  location_type: LocationType;
  label: LocationLabel;
  last_used: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// DRIVER_DOCUMENTS (Documentos de conductores)
// ============================================
export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string | null;
  status: DocumentStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  driver?: Profile;
  reviewer?: Profile;
}

// ============================================
// DRIVER_VEHICLES (Vehículos de conductores)
// ============================================
export interface DriverVehicle {
  id: string;
  driver_id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vehicle_type: VehicleType;
  is_active: boolean;
  is_verified: boolean;
  verified_at: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  driver?: Profile;
}

// ============================================
// DRIVER_AVAILABILITY (Disponibilidad de conductores)
// ============================================
export interface DriverAvailability {
  driver_id: string;
  is_available: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  current_vehicle_id: string | null;
  last_location_update: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  driver?: Profile;
}

// ============================================
// TRUST_POINTS_LOG (Historial de puntos)
// ============================================
export interface TrustPointsLog {
  id: string;
  driver_id: string;
  points: number;
  reason: TrustPointReason;
  description: string | null;
  reference_type: ReferenceType | null;
  reference_id: string | null;
  points_before: number;
  points_after: number;
  created_at: string;
  created_by: string | null;
  // Relations
  driver?: Profile;
  creator?: Profile;
}

// ============================================
// TRUST_POINTS_CONFIG (Configuración de puntos)
// ============================================
export interface TrustPointsConfig {
  reason: TrustPointReason;
  points: number;
  description: string | null;
}

// ============================================
// API Response Types
// ============================================
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// Dashboard Stats
// ============================================
export interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  pendingDrivers: number;
  activeDrivers: number;
  totalRides: number;
  completedRides: number;
  totalDeliveries: number;
  completedDeliveries: number;
  totalRevenue: number;
  pendingDocuments: number;
}

// ============================================
// Filters
// ============================================
export interface ProfileFilters {
  role?: UserRole;
  driver_status?: DriverStatus;
  is_verified?: boolean;
  search?: string;
}

export interface RideFilters {
  status?: RideStatus;
  service_type?: ServiceType;
  user_id?: string;
  driver_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface DeliveryFilters {
  status?: DeliveryStatus;
  service_type?: DeliveryServiceType;
  delivery_type?: DeliveryType;
  user_id?: string;
  driver_id?: string;
  tracking_number?: string;
  date_from?: string;
  date_to?: string;
}

export interface DocumentFilters {
  driver_id?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
}

// ============================================
// MARKETPLACE - CATEGORIES
// ============================================
export interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// MARKETPLACE - PRODUCTS
// ============================================
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
}

export type ProductType = 'sale' | 'rental';

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number;
  promotional_price: number | null;
  images: string[] | null;
  image_url: string | null;
  status: ProductStatus;
  stock: number | null;
  sku: string | null;
  barcode: string | null;
  show_price: boolean;
  free_shipping: boolean;
  product_type: ProductType;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  variants?: ProductVariant[];
}

// ============================================
// MARKETPLACE - COUPONS
// ============================================
export type CouponDiscountType = 'percentage' | 'fixed' | 'free_shipping';
export type CouponApplyTo = 'all' | 'category' | 'product';
export type CouponStatus = 'active' | 'inactive' | 'expired';

export interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  apply_to: CouponApplyTo;
  apply_to_id: string | null;
  include_shipping: boolean;
  min_cart_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  first_purchase_only: boolean;
  status: CouponStatus;
  created_at: string;
  updated_at: string;
}

// ============================================
// MARKETPLACE - PROMOTIONS
// ============================================
export type PromotionDiscountType = 'progressive' | 'percentage' | 'fixed';
export type PromotionApplyTo = 'all' | 'categories' | 'products';
export type PromotionStatus = 'active' | 'inactive' | 'expired';

export interface Promotion {
  id: string;
  name: string;
  discount_type: PromotionDiscountType;
  discount_value: number | null;
  buy_quantity: number | null;
  pay_quantity: number | null;
  apply_to: PromotionApplyTo;
  valid_from: string | null;
  valid_until: string | null;
  status: PromotionStatus;
  created_at: string;
  updated_at: string;
}

// ============================================
// MARKETPLACE - ORDERS
// ============================================
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'not_paid' | 'pending' | 'paid' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  // Relations
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_lastname: string;
  customer_email: string;
  customer_phone: string | null;
  customer_dni: string | null;
  shipping_street: string | null;
  shipping_number: string | null;
  shipping_floor: string | null;
  shipping_postal_code: string | null;
  shipping_neighborhood: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  user?: Profile;
  items?: OrderItem[];
}

// ============================================
// MARKETPLACE - FILTERS
// ============================================
export interface CategoryFilters {
  is_active?: boolean;
  search?: string;
}

export interface ProductFilters {
  category_id?: string;
  status?: ProductStatus;
  search?: string;
}

export interface CouponFilters {
  status?: CouponStatus;
  code?: string;
}

export interface PromotionFilters {
  status?: PromotionStatus;
  search?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  customer_email?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ============================================
// AUDITORIA (Audit Logs)
// ============================================
export type AuditActionType =
  | 'driver_approved'
  | 'driver_rejected'
  | 'driver_suspended'
  | 'driver_reactivated'
  | 'document_approved'
  | 'document_rejected'
  | 'user_suspended'
  | 'user_reactivated'
  | 'rate_created'
  | 'rate_updated'
  | 'rate_deleted'
  | 'rule_created'
  | 'rule_updated'
  | 'rule_deleted'
  | 'order_status_changed'
  | 'ride_cancelled'
  | 'delivery_cancelled'
  | 'settlement_paid';

export type AuditEntityType =
  | 'profile'
  | 'driver_document'
  | 'service_rate'
  | 'price_rule'
  | 'order'
  | 'ride'
  | 'delivery'
  | 'driver_settlement';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Relations
  user?: Profile;
}

export interface AuditLogFilters {
  user_id?: string;
  action_type?: AuditActionType;
  entity_type?: AuditEntityType;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ============================================
// TARIFAS (Service Rates & Price Rules)
// ============================================
export type RateServiceType = 'vuelta_segura' | 'chofer' | 'envios' | 'fletes';
export type RateUnitType = 'km' | 'hora';
export type PriceRuleType = 'surcharge' | 'discount' | 'cash_discount';

export interface ServiceRate {
  id: string;
  service_type: RateServiceType;
  base_rate: number;
  per_unit_rate: number;
  unit_type: RateUnitType;
  minimum_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: PriceRuleType;
  percentage: number;
  applies_to: RateServiceType[];
  conditions: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceRateFilters {
  service_type?: RateServiceType;
  is_active?: boolean;
}

export interface PriceRuleFilters {
  rule_type?: PriceRuleType;
  is_active?: boolean;
  search?: string;
}

// ============================================
// PAGOS (Payments & Driver Settlements)
// ============================================
export type SettlementStatus = 'pending' | 'paid' | 'cancelled';
export type SettlementReferenceType = 'ride' | 'delivery';
export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'ride' | 'delivery' | 'order' | 'settlement';

export interface DriverSettlement {
  id: string;
  driver_id: string;
  reference_type: SettlementReferenceType;
  reference_id: string;
  gross_amount: number;
  commission_percentage: number;
  commission_amount: number;
  net_amount: number;
  status: SettlementStatus;
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  driver?: Profile;
  payer?: Profile;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  source: TransactionSource;
  source_id: string;
  concept: string;
  amount: number;
  status: 'completed' | 'pending';
  date: string;
  driver_id?: string;
  driver_name?: string;
}

export interface PaymentsSummary {
  totalIncome: number;
  totalExpenses: number;
  pendingPayments: number;
  balance: number;
}

export interface PaymentFilters {
  type?: TransactionType;
  source?: TransactionSource;
  status?: 'completed' | 'pending';
  date_from?: string;
  date_to?: string;
  driver_id?: string;
}

export interface SettlementFilters {
  driver_id?: string;
  status?: SettlementStatus;
  date_from?: string;
  date_to?: string;
}

// ============================================
// BANNERS (Carrusel)
// ============================================
export type BannerActionType = 'none' | 'url' | 'product' | 'category' | 'promotion';
export type BannerLocation = 'home' | 'marketplace' | 'services';

export interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  action_type: BannerActionType;
  action_value: string | null;
  location: BannerLocation;
  order_index: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  clicks_count: number;
  created_at: string;
  updated_at: string;
}

export interface BannerFilters {
  location?: BannerLocation;
  is_active?: boolean;
  search?: string;
}

// ============================================
// BUSINESSES (Comercios)
// ============================================
export interface Business {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessDelivery extends Delivery {
  business_id: string | null;
  business?: Business;
}

export interface BusinessFilters {
  is_active?: boolean;
  search?: string;
}

export interface BusinessDeliveryFilters {
  status?: DeliveryStatus;
  business_id?: string;
  date_from?: string;
  date_to?: string;
}

export type BusinessChargeStatus = 'pending' | 'invoiced' | 'paid';

export interface BusinessCharge {
  id: string;
  business_id: string;
  delivery_id: string;
  amount: number;
  platform_fee: number;
  driver_amount: number;
  status: BusinessChargeStatus;
  invoiced_at: string | null;
  paid_at: string | null;
  invoice_number: string | null;
  created_at: string;
  business?: {
    id: string;
    name: string;
    phone: string | null;
  };
  delivery?: {
    id: string;
    tracking_number: string;
    dropoff_address: string;
    created_at: string;
  };
}

export interface BusinessChargeFilters {
  status?: BusinessChargeStatus;
  business_id?: string;
}
