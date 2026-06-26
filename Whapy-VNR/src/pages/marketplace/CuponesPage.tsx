import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Search, Plus, EyeOff, Eye, Trash2, Loader2 } from 'lucide-react';
import { couponsService } from '../../services';
import type { Coupon } from '../../types/database';

const CuponesPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [applyTo, setApplyTo] = useState<'all' | 'category' | 'product'>('all');
  const [includeShipping, setIncludeShipping] = useState(false);
  const [limitPerCoupon, setLimitPerCoupon] = useState<'unlimited' | 'limited'>('unlimited');
  const [maxUses, setMaxUses] = useState('');
  const [limitPerClient, setLimitPerClient] = useState<'unlimited' | 'limited' | 'first'>('unlimited');
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('');
  const [dateLimit, setDateLimit] = useState<'unlimited' | 'period'>('unlimited');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minCartAmount, setMinCartAmount] = useState('');

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await couponsService.getAll(1, 100, {
        code: searchTerm || undefined,
      });
      setCoupons(response.data);
    } catch (err) {
      setError('Error al cargar los cupones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCoupons();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const resetForm = () => {
    setCouponCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setApplyTo('all');
    setIncludeShipping(false);
    setLimitPerCoupon('unlimited');
    setMaxUses('');
    setLimitPerClient('unlimited');
    setMaxUsesPerUser('');
    setDateLimit('unlimited');
    setDateFrom('');
    setDateTo('');
    setMinCartAmount('');
  };

  const handleCreateCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      setSaving(true);
      await couponsService.create({
        code: couponCode.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountType === 'free_shipping' ? 0 : parseFloat(discountValue) || 0,
        apply_to: applyTo,
        include_shipping: includeShipping,
        max_uses: limitPerCoupon === 'limited' ? parseInt(maxUses) || null : null,
        max_uses_per_user: limitPerClient === 'limited' ? parseInt(maxUsesPerUser) || null : (limitPerClient === 'first' ? 1 : null),
        first_purchase_only: limitPerClient === 'first',
        valid_from: dateLimit === 'period' && dateFrom ? new Date(dateFrom).toISOString() : null,
        valid_until: dateLimit === 'period' && dateTo ? new Date(dateTo).toISOString() : null,
        min_cart_amount: minCartAmount ? parseFloat(minCartAmount) : null,
        status: 'active',
      });
      resetForm();
      setShowCreateModal(false);
      loadCoupons();
    } catch (err) {
      setError('Error al crear el cupón');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;

    try {
      await couponsService.delete(id);
      loadCoupons();
    } catch (err) {
      setError('Error al eliminar el cupón');
      console.error(err);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
      await couponsService.toggleStatus(coupon.id, newStatus);
      loadCoupons();
    } catch (err) {
      setError('Error al cambiar el estado del cupón');
      console.error(err);
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'free_shipping') return 'Envío gratis';
    if (coupon.discount_type === 'percentage') return `${coupon.discount_value}%`;
    return `$${coupon.discount_value.toLocaleString()}`;
  };

  const formatValidity = (coupon: Coupon) => {
    if (!coupon.valid_from && !coupon.valid_until) return 'Indeterminada';
    const from = coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString() : '';
    const to = coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : '';
    return `${from} - ${to}`;
  };

  const formatLimits = (coupon: Coupon) => {
    if (!coupon.max_uses && !coupon.max_uses_per_user && !coupon.first_purchase_only) return 'Sin límites';
    if (coupon.first_purchase_only) return 'Primera compra';
    if (coupon.max_uses) return `${coupon.max_uses} usos máx.`;
    return 'Con límites';
  };

  return (
    <Layout>
      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cupones</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear cupón
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <button className="px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Filtrar
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Cargando cupones...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Código</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Descuento</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Envío</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Vigencia</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Usos</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Límites</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{coupon.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDiscount(coupon)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {coupon.include_shipping ? 'Incluido' : 'No incluido'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatValidity(coupon)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{coupon.current_uses} Usos</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatLimits(coupon)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        coupon.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {coupon.status === 'active' ? 'Activado' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title={coupon.status === 'active' ? 'Desactivar' : 'Activar'}
                        >
                          {coupon.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && coupons.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No se encontraron cupones
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Cupón */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Crear cupón</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Código */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Código del cupón</h3>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="ENEROPROMO"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-500">
                  Este es el código que tu cliente deberá ingresar en el momento de la compra.
                </p>
              </div>

              {/* Tipo de descuento */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Tipo de descuento</h3>
                <div className="flex gap-2">
                  {(['percentage', 'fixed', 'free_shipping'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDiscountType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        discountType === type
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {type === 'percentage' ? 'Porcentaje' : type === 'fixed' ? 'Monto fijo' : 'Envío gratis'}
                    </button>
                  ))}
                </div>
                {discountType !== 'free_shipping' && (
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {discountType === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeShipping}
                    onChange={(e) => setIncludeShipping(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Incluir el costo de envío en el descuento</span>
                </label>
              </div>

              {/* Aplicar a */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Aplicar a</h3>
                <div className="flex gap-2">
                  {(['all', 'category', 'product'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setApplyTo(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        applyTo === type
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {type === 'all' ? 'Toda la tienda' : type === 'category' ? 'Categoría' : 'Producto'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Límites */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Límites de uso</h3>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Por cupón</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLimitPerCoupon('unlimited')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        limitPerCoupon === 'unlimited' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Ilimitado
                    </button>
                    <button
                      onClick={() => setLimitPerCoupon('limited')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        limitPerCoupon === 'limited' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Limitado
                    </button>
                  </div>
                  {limitPerCoupon === 'limited' && (
                    <input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Cantidad máxima de usos"
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Por cliente</p>
                  <div className="flex gap-2">
                    {(['unlimited', 'limited', 'first'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setLimitPerClient(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          limitPerClient === type ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {type === 'unlimited' ? 'Ilimitado' : type === 'limited' ? 'Limitado' : 'Primera compra'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Fecha</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDateLimit('unlimited')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        dateLimit === 'unlimited' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Ilimitado
                    </button>
                    <button
                      onClick={() => setDateLimit('period')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        dateLimit === 'period' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Período
                    </button>
                  </div>
                  {dateLimit === 'period' && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Desde</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hasta</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Monto mínimo del carrito</p>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={minCartAmount}
                      onChange={(e) => setMinCartAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCoupon}
                disabled={saving || !couponCode.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CuponesPage;
