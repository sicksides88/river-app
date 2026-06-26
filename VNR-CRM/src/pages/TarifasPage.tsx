import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { Receipt, Edit2, Plus, X, Loader2, Trash2 } from 'lucide-react';
import { tarifasService } from '../services';
import { useToast } from '../context/ToastContext';
import type { ServiceRate, PriceRule, RateServiceType, RateUnitType, PriceRuleType } from '../types/database';

const TarifasPage: React.FC = () => {
  const toast = useToast();

  // State para tarifas
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [showRateModal, setShowRateModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRate, setEditingRate] = useState<ServiceRate | null>(null);
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state para tarifa
  const [rateForm, setRateForm] = useState({
    service_type: 'vuelta_segura' as RateServiceType,
    base_rate: 0,
    per_unit_rate: 0,
    unit_type: 'km' as RateUnitType,
    minimum_price: 0,
    is_active: true,
  });

  // Form state para regla
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    rule_type: 'surcharge' as PriceRuleType,
    percentage: 0,
    is_active: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ratesData, rulesData] = await Promise.all([
        tarifasService.getAllRates(),
        tarifasService.getAllRules(),
      ]);
      setRates(ratesData);
      setRules(rulesData);
    } catch (err) {
      console.error('Error loading tarifas:', err);
      setError('Error al cargar las tarifas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers para tarifas
  const handleEditRate = (rate: ServiceRate) => {
    setEditingRate(rate);
    setRateForm({
      service_type: rate.service_type,
      base_rate: rate.base_rate,
      per_unit_rate: rate.per_unit_rate,
      unit_type: rate.unit_type,
      minimum_price: rate.minimum_price,
      is_active: rate.is_active,
    });
    setShowRateModal(true);
  };

  const handleSaveRate = async () => {
    try {
      setSaving(true);
      if (editingRate) {
        await tarifasService.updateRate(editingRate.id, rateForm);
        toast.success('Tarifa actualizada correctamente');
      } else {
        await tarifasService.createRate(rateForm);
        toast.success('Tarifa creada correctamente');
      }
      setShowRateModal(false);
      setEditingRate(null);
      loadData();
    } catch (err) {
      console.error('Error saving rate:', err);
      toast.error('Error al guardar la tarifa');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRate = async (rate: ServiceRate) => {
    try {
      await tarifasService.toggleRateStatus(rate.id, !rate.is_active);
      toast.success(rate.is_active ? 'Tarifa desactivada' : 'Tarifa activada');
      loadData();
    } catch (err) {
      console.error('Error toggling rate:', err);
      toast.error('Error al cambiar estado');
    }
  };

  // Handlers para reglas
  const handleNewRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      description: '',
      rule_type: 'surcharge',
      percentage: 0,
      is_active: true,
    });
    setShowRuleModal(true);
  };

  const handleEditRule = (rule: PriceRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      percentage: rule.percentage,
      is_active: rule.is_active,
    });
    setShowRuleModal(true);
  };

  const handleSaveRule = async () => {
    try {
      setSaving(true);
      const ruleData = {
        ...ruleForm,
        applies_to: ['vuelta_segura', 'chofer', 'envios', 'fletes'] as RateServiceType[],
        conditions: ruleForm.rule_type === 'cash_discount' ? { payment_method: 'cash' } : {},
        priority: 0,
      };
      if (editingRule) {
        await tarifasService.updateRule(editingRule.id, ruleData);
        toast.success('Regla actualizada correctamente');
      } else {
        await tarifasService.createRule(ruleData);
        toast.success('Regla creada correctamente');
      }
      setShowRuleModal(false);
      setEditingRule(null);
      loadData();
    } catch (err) {
      console.error('Error saving rule:', err);
      toast.error('Error al guardar la regla');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (rule: PriceRule) => {
    if (!window.confirm(`¿Eliminar la regla "${rule.name}"?`)) return;
    try {
      await tarifasService.deleteRule(rule.id);
      toast.success('Regla eliminada');
      loadData();
    } catch (err) {
      console.error('Error deleting rule:', err);
      toast.error('Error al eliminar la regla');
    }
  };

  const handleToggleRule = async (rule: PriceRule) => {
    try {
      await tarifasService.toggleRuleStatus(rule.id, !rule.is_active);
      toast.success(rule.is_active ? 'Regla desactivada' : 'Regla activada');
      loadData();
    } catch (err) {
      console.error('Error toggling rule:', err);
      toast.error('Error al cambiar estado');
    }
  };

  if (loading) {
    return (
      <Layout title="Tarifas y reglas">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tarifas y reglas">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tarifas y Reglas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configuración de precios para los servicios
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Tarifas por servicio */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Tarifas por Servicio</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarifa Base</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Por Unidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rates.map((rate) => (
                    <tr key={rate.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Receipt className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">
                            {tarifasService.getServiceTypeLabel(rate.service_type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        ${rate.base_rate.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        ${rate.per_unit_rate.toLocaleString()} {tarifasService.getUnitTypeLabel(rate.unit_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        ${rate.minimum_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleRate(rate)}
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                            rate.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rate.is_active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditRate(rate)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reglas de precios */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Reglas de Precios</h3>
              <button
                onClick={handleNewRule}
                className="flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva regla
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regla</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ajuste</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{rule.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                        {rule.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rule.rule_type === 'surcharge'
                            ? 'bg-red-100 text-red-800'
                            : rule.rule_type === 'cash_discount'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {rule.rule_type === 'surcharge' ? 'Recargo' : rule.rule_type === 'cash_discount' ? 'Dto. Efectivo' : 'Descuento'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${
                          rule.rule_type === 'surcharge' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {rule.rule_type === 'surcharge' ? '+' : '-'}{Math.abs(rule.percentage)}%
                          {rule.rule_type === 'cash_discount' && <span className="text-xs text-gray-500 ml-1">(efectivo)</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                            rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rule.is_active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No hay reglas de precio configuradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Editar Tarifa */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {editingRate ? 'Editar Tarifa' : 'Nueva Tarifa'}
              </h3>
              <button onClick={() => setShowRateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                <select
                  value={rateForm.service_type}
                  onChange={(e) => setRateForm({ ...rateForm, service_type: e.target.value as RateServiceType })}
                  disabled={!!editingRate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                >
                  <option value="vuelta_segura">Vuelta Segura</option>
                  <option value="chofer">Chofer</option>
                  <option value="envios">Envios</option>
                  <option value="fletes">Fletes</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa Base</label>
                  <input
                    type="number"
                    value={rateForm.base_rate}
                    onChange={(e) => setRateForm({ ...rateForm, base_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select
                    value={rateForm.unit_type}
                    onChange={(e) => setRateForm({ ...rateForm, unit_type: e.target.value as RateUnitType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="km">Por Km</option>
                    <option value="hora">Por Hora</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Por Unidad</label>
                  <input
                    type="number"
                    value={rateForm.per_unit_rate}
                    onChange={(e) => setRateForm({ ...rateForm, per_unit_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
                  <input
                    type="number"
                    value={rateForm.minimum_price}
                    onChange={(e) => setRateForm({ ...rateForm, minimum_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRate}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Regla */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {editingRule ? 'Editar Regla' : 'Nueva Regla'}
              </h3>
              <button onClick={() => setShowRuleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Recargo nocturno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Entre las 22:00 y 06:00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={ruleForm.rule_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, rule_type: e.target.value as PriceRuleType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="surcharge">Recargo</option>
                    <option value="discount">Descuento</option>
                    <option value="cash_discount">Dto. Efectivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje</label>
                  <input
                    type="number"
                    value={ruleForm.percentage}
                    onChange={(e) => setRuleForm({ ...ruleForm, percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: 20"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRuleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRule}
                disabled={saving || !ruleForm.name}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TarifasPage;
