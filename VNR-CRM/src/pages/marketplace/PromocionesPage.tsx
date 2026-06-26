import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Plus, EyeOff, Eye, Trash2, Loader2 } from 'lucide-react';
import { promotionsService } from '../../services';
import type { Promotion } from '../../types/database';

const PromocionesPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [promoName, setPromoName] = useState('');
  const [discountType, setDiscountType] = useState<'progressive' | 'percentage' | 'fixed'>('progressive');
  const [discountValue, setDiscountValue] = useState('');
  const [buyQuantity, setBuyQuantity] = useState('');
  const [payQuantity, setPayQuantity] = useState('');
  const [applyTo, setApplyTo] = useState<'all' | 'categories' | 'products'>('all');
  const [dateLimit, setDateLimit] = useState<'unlimited' | 'period'>('unlimited');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await promotionsService.getAll(1, 100);
      setPromotions(response.data);
    } catch (err) {
      setError('Error al cargar las promociones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const resetForm = () => {
    setPromoName('');
    setDiscountType('progressive');
    setDiscountValue('');
    setBuyQuantity('');
    setPayQuantity('');
    setApplyTo('all');
    setDateLimit('unlimited');
    setDateFrom('');
    setDateTo('');
  };

  const handleCreatePromotion = async () => {
    if (!promoName.trim()) return;

    try {
      setSaving(true);
      await promotionsService.create({
        name: promoName.trim(),
        discount_type: discountType,
        discount_value: discountType !== 'progressive' ? parseFloat(discountValue) || null : null,
        buy_quantity: discountType === 'progressive' ? parseInt(buyQuantity) || null : null,
        pay_quantity: discountType === 'progressive' ? parseInt(payQuantity) || null : null,
        apply_to: applyTo,
        valid_from: dateLimit === 'period' && dateFrom ? new Date(dateFrom).toISOString() : null,
        valid_until: dateLimit === 'period' && dateTo ? new Date(dateTo).toISOString() : null,
        status: 'active',
      });
      resetForm();
      setShowCreateModal(false);
      loadPromotions();
    } catch (err) {
      setError('Error al crear la promoción');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;

    try {
      await promotionsService.delete(id);
      loadPromotions();
    } catch (err) {
      setError('Error al eliminar la promoción');
      console.error(err);
    }
  };

  const handleToggleStatus = async (promo: Promotion) => {
    try {
      const newStatus = promo.status === 'active' ? 'inactive' : 'active';
      await promotionsService.toggleStatus(promo.id, newStatus);
      loadPromotions();
    } catch (err) {
      setError('Error al cambiar el estado');
      console.error(err);
    }
  };

  const formatDiscountType = (promo: Promotion) => {
    if (promo.discount_type === 'progressive') {
      return `Llevá ${promo.buy_quantity} pagá ${promo.pay_quantity}`;
    }
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}% descuento`;
    }
    return `$${promo.discount_value} descuento`;
  };

  const formatApplyTo = (promo: Promotion) => {
    if (promo.apply_to === 'all') return 'Todos los productos';
    if (promo.apply_to === 'categories') return 'Categorías específicas';
    return 'Productos específicos';
  };

  const formatValidity = (promo: Promotion) => {
    if (!promo.valid_from && !promo.valid_until) return 'Indeterminada';
    const from = promo.valid_from ? new Date(promo.valid_from).toLocaleDateString() : '';
    const to = promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : '';
    return `${from} - ${to}`;
  };

  return (
    <Layout>
      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Promociones</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear promoción
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Cargando promociones...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Tipo de descuento</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Aplicar a</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Vigencia</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => (
                  <tr key={promo.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{promo.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDiscountType(promo)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full border border-gray-200 text-gray-600">
                        {formatApplyTo(promo)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatValidity(promo)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        promo.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {promo.status === 'active' ? 'Activado' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(promo)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {promo.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(promo.id)}
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

          {!loading && promotions.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No se encontraron promociones
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Promoción */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Crear promoción</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Nombre */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Nombre</h3>
                <input
                  type="text"
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="PROMOCION2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-500">
                  Este nombre no será mostrado a tus clientes.
                </p>
              </div>

              {/* Tipo de descuento */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Tipo de descuento</h3>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="progressive">Llevá X y pagá Y (2×1, 3×2, 4×3)</option>
                  <option value="percentage">Descuento porcentual</option>
                  <option value="fixed">Descuento fijo</option>
                </select>

                {discountType === 'progressive' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Llevando</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={buyQuantity}
                          onChange={(e) => setBuyQuantity(e.target.value)}
                          placeholder="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-sm text-gray-600">Productos</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Pagás</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={payQuantity}
                          onChange={(e) => setPayQuantity(e.target.value)}
                          placeholder="2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-sm text-gray-600">Productos</span>
                      </div>
                    </div>
                  </div>
                )}

                {discountType === 'percentage' && (
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="15"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                )}

                {discountType === 'fixed' && (
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="1000"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Aplicar a */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Aplicar a</h3>
                <div className="flex gap-2">
                  {(['all', 'categories', 'products'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setApplyTo(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        applyTo === type
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {type === 'all' ? 'Toda la tienda' : type === 'categories' ? 'Categorías' : 'Productos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vigencia */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Vigencia</h3>
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
                onClick={handleCreatePromotion}
                disabled={saving || !promoName.trim()}
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

export default PromocionesPage;
