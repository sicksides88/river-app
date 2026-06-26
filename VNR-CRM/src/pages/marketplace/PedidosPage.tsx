import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Plus, Copy, Trash2, ChevronDown, ChevronUp, Loader2, X, Minus } from 'lucide-react';
import { ordersService, productsService } from '../../services';
import type { Order, Product, OrderItem } from '../../types/database';

interface SelectedProduct {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

const PedidosPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states - Products
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantName, setSelectedVariantName] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);

  // Form states - Client
  const [clientName, setClientName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientDni, setClientDni] = useState('');

  // Form states - Payment
  const [paymentStatus, setPaymentStatus] = useState<'not_paid' | 'pending' | 'paid'>('pending');

  // Form states - Shipping
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [floorApt, setFloorApt] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, productsRes] = await Promise.all([
        ordersService.getAll(1, 100),
        productsService.getForSelector(),
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddProduct = () => {
    if (!selectedProductId || !selectedVariantName) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const variant = product.variants?.find(v => v.name === selectedVariantName);
    const price = variant?.price || product.base_price;

    const existingIndex = selectedProducts.findIndex(
      p => p.product_id === selectedProductId && p.variant_name === selectedVariantName
    );

    if (existingIndex >= 0) {
      const updated = [...selectedProducts];
      updated[existingIndex].quantity += productQuantity;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setSelectedProducts(updated);
    } else {
      const newProduct: SelectedProduct = {
        product_id: selectedProductId,
        variant_id: variant?.id || null,
        product_name: product.name,
        variant_name: selectedVariantName,
        quantity: productQuantity,
        unit_price: price,
        total: price * productQuantity,
      };
      setSelectedProducts([...selectedProducts, newProduct]);
    }

    setSelectedProductId('');
    setSelectedVariantName('');
    setProductQuantity(1);
    setShowProductSelector(false);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...selectedProducts];
    const newQuantity = updated[index].quantity + delta;
    if (newQuantity < 1) return;
    updated[index].quantity = newQuantity;
    updated[index].total = updated[index].quantity * updated[index].unit_price;
    setSelectedProducts(updated);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, p) => sum + p.total, 0);
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setShowProductSelector(false);
    setSelectedProductId('');
    setSelectedVariantName('');
    setProductQuantity(1);
    setClientName('');
    setClientLastName('');
    setClientEmail('');
    setClientPhone('');
    setClientDni('');
    setStreet('');
    setStreetNumber('');
    setFloorApt('');
    setPostalCode('');
    setNeighborhood('');
    setCity('');
    setProvince('');
    setOrderNotes('');
    setPaymentStatus('pending');
  };

  const handleCreateOrder = async () => {
    if (selectedProducts.length === 0 || !clientName.trim() || !clientLastName.trim() || !clientEmail.trim()) return;

    try {
      setSaving(true);
      const items: Partial<OrderItem>[] = selectedProducts.map(p => ({
        product_id: p.product_id,
        variant_id: p.variant_id,
        product_name: p.product_name,
        variant_name: p.variant_name,
        quantity: p.quantity,
        unit_price: p.unit_price,
        total: p.total,
      }));

      await ordersService.create({
        customer_name: clientName.trim(),
        customer_lastname: clientLastName.trim(),
        customer_email: clientEmail.trim(),
        customer_phone: clientPhone.trim() || null,
        customer_dni: clientDni.trim() || null,
        shipping_street: street.trim() || null,
        shipping_number: streetNumber.trim() || null,
        shipping_floor: floorApt.trim() || null,
        shipping_postal_code: postalCode.trim() || null,
        shipping_neighborhood: neighborhood.trim() || null,
        shipping_city: city.trim() || null,
        shipping_province: province || null,
        payment_status: paymentStatus,
        notes: orderNotes.trim() || null,
      }, items);

      resetForm();
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      setError('Error al crear el pedido');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este pedido?')) return;

    try {
      await ordersService.delete(id);
      loadData();
    } catch (err) {
      setError('Error al eliminar el pedido');
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar pedido
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}

        {/* Orders Table */}
        <div className="overflow-hidden">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Cargando pedidos...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Pedido</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Productos</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">#{order.order_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {order.customer_name} {order.customer_lastname}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                          order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.payment_status === 'paid' ? 'Pagado' :
                           order.payment_status === 'pending' ? 'Pendiente' : 'Sin pagar'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleOrderExpand(order.id)}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                          {order.items?.length || 0} items
                          {expandedOrders.includes(order.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrders.includes(order.id) && order.items && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <table className="w-full">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Cantidad</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Precio Unit.</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-4 py-3">
                                    <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                                    {item.variant_name && (
                                      <p className="text-xs text-gray-500">Variante: {item.variant_name}</p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                                  <td className="px-4 py-3 text-center text-sm text-gray-900">{formatPrice(item.unit_price)}</td>
                                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatPrice(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}

          {!loading && orders.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No se encontraron pedidos
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar Pedido */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Agregar pedido</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Productos */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
                <p className="text-sm text-gray-600">Agregá productos a tu pedido.</p>

                {/* Lista de productos seleccionados */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-3">
                    {selectedProducts.map((product, index) => (
                      <div key={`${product.product_id}-${product.variant_name}`} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-xs text-gray-500">
                            Variante: {product.variant_name} | {formatPrice(product.unit_price)} c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(index, -1)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-8 text-center">{product.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(index, 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold w-28 text-right">{formatPrice(product.total)}</span>
                          <button onClick={() => handleRemoveProduct(index)} className="p-1 text-gray-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Total:</span>
                      <span className="text-lg font-bold text-gray-900">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                )}

                {/* Selector de producto */}
                {showProductSelector ? (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          setSelectedVariantName('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {formatPrice(product.base_price)} (Stock: {product.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Variante</label>
                        <select
                          value={selectedVariantName}
                          onChange={(e) => setSelectedVariantName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                          <option value="">Seleccionar variante</option>
                          {selectedProduct.variants.map((variant) => (
                            <option key={variant.id} value={variant.name}>
                              {variant.name} - {formatPrice(variant.price)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedProduct && (!selectedProduct.variants || selectedProduct.variants.length === 0) && (
                      <input type="hidden" value="Único" onChange={() => setSelectedVariantName('Único')} />
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={productQuantity}
                        onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowProductSelector(false);
                          setSelectedProductId('');
                          setSelectedVariantName('');
                          setProductQuantity(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          if (selectedProduct && (!selectedProduct.variants || selectedProduct.variants.length === 0)) {
                            setSelectedVariantName('Único');
                          }
                          setTimeout(handleAddProduct, 0);
                        }}
                        disabled={!selectedProductId || (!selectedVariantName && selectedProduct?.variants && selectedProduct.variants.length > 0)}
                        className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:bg-gray-300"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowProductSelector(true)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar productos
                  </button>
                )}
              </div>

              {/* Datos del cliente */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Datos del cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={clientLastName}
                      onChange={(e) => setClientLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI / CUIL</label>
                    <input
                      type="text"
                      value={clientDni}
                      onChange={(e) => setClientDni(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Estado del pago */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Estado del pago</h3>
                <div className="space-y-3">
                  {(['not_paid', 'pending', 'paid'] as const).map((status) => (
                    <label key={status} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={paymentStatus === status}
                        onChange={() => setPaymentStatus(status)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {status === 'not_paid' ? 'Pago no realizado' :
                           status === 'pending' ? 'Pago pendiente' : 'Pago recibido'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {status === 'not_paid' ? 'El stock no será afectado.' :
                           status === 'pending' ? 'Reservar stock para el cliente.' : 'Descontar del stock.'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dirección de entrega */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Dirección de entrega</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calle</label>
                    <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input type="text" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Piso / Depto</label>
                    <input type="text" value={floorApt} onChange={(e) => setFloorApt(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CP</label>
                    <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                    <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                  <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">Seleccionar</option>
                    <option value="Buenos Aires">Buenos Aires</option>
                    <option value="CABA">CABA</option>
                    <option value="Córdoba">Córdoba</option>
                    <option value="Santa Fe">Santa Fe</option>
                    <option value="Mendoza">Mendoza</option>
                  </select>
                </div>
              </div>

              {/* Notas */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Notas</h3>
                <textarea
                  rows={3}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Notas internas sobre el pedido..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
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
                onClick={handleCreateOrder}
                disabled={saving || selectedProducts.length === 0 || !clientName.trim() || !clientLastName.trim() || !clientEmail.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Agregar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PedidosPage;
