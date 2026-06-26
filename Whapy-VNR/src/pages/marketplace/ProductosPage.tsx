import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Search, Plus, Upload, Share2, Copy, Trash2, Loader2, X } from 'lucide-react';
import { productsService, categoriesService } from '../../services';
import type { Product, Category, ProductVariant } from '../../types/database';

interface VariantForm {
  name: string;
  price: number;
  stock: number;
}

const ProductosPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [stock, setStock] = useState('');
  const [stockType, setStockType] = useState<'limited' | 'unlimited'>('limited');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showInStore, setShowInStore] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [freeShipping, setFreeShipping] = useState(false);
  const [productType, setProductType] = useState<'sale' | 'rental'>('sale');
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsRes, categoriesRes] = await Promise.all([
        productsService.getAll(1, 100, searchTerm ? { search: searchTerm } : undefined),
        categoriesService.getAll(1, 100),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError('Error al cargar los productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setBasePrice('');
    setPromotionalPrice('');
    setStock('');
    setStockType('limited');
    setSku('');
    setBarcode('');
    setCategoryId('');
    setShowInStore(true);
    setShowPrice(true);
    setFreeShipping(false);
    setProductType('sale');
    setVariants([]);
    setNewVariantName('');
    setNewVariantPrice('');
    setNewVariantStock('');
    setEditingProduct(null);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setBasePrice(product.base_price.toString());
    setPromotionalPrice(product.promotional_price?.toString() || '');
    setStock(product.stock?.toString() || '');
    setStockType(product.stock === null ? 'unlimited' : 'limited');
    setSku(product.sku || '');
    setBarcode(product.barcode || '');
    setCategoryId(product.category_id || '');
    setShowInStore(product.status === 'active');
    setShowPrice(product.show_price);
    setFreeShipping(product.free_shipping);
    setProductType(product.product_type);
    setVariants(product.variants?.map(v => ({
      name: v.name,
      price: v.price,
      stock: v.stock || 0,
    })) || []);
    setShowCreateModal(true);
  };

  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;
    setVariants([...variants, {
      name: newVariantName.trim(),
      price: parseFloat(newVariantPrice) || parseFloat(basePrice) || 0,
      stock: parseInt(newVariantStock) || 0,
    }]);
    setNewVariantName('');
    setNewVariantPrice('');
    setNewVariantStock('');
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      setSaving(true);
      const productData: Partial<Product> = {
        name: name.trim(),
        description: description.trim() || null,
        base_price: parseFloat(basePrice) || 0,
        promotional_price: promotionalPrice ? parseFloat(promotionalPrice) : null,
        stock: stockType === 'unlimited' ? null : (parseInt(stock) || 0),
        sku: sku.trim() || null,
        barcode: barcode.trim() || null,
        category_id: categoryId || null,
        status: showInStore ? 'active' : 'inactive',
        show_price: showPrice,
        free_shipping: freeShipping,
        product_type: productType,
      };

      const variantsData: Partial<ProductVariant>[] = variants.map(v => ({
        name: v.name,
        price: v.price,
        stock: v.stock,
      }));

      if (editingProduct) {
        await productsService.update(editingProduct.id, productData);
        // Note: variant update would need additional logic
      } else {
        await productsService.create(productData, variantsData);
      }

      resetForm();
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      setError('Error al guardar el producto');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await productsService.delete(id);
      loadData();
    } catch (err) {
      setError('Error al eliminar el producto');
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              Exportar e importar
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar producto
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Busca por nombre, SKU o tags"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <button className="px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Filtrar
          </button>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Cargando productos...</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="px-4 py-4 text-left">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">Producto</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">Stock</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">Precio</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">Promocional</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">Variantes</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded" />
                          )}
                        </div>
                        <span
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-black"
                          onClick={() => openEditModal(product)}
                        >
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="px-3 py-1.5 border border-gray-200 rounded text-sm text-center w-20">
                        {product.stock === null ? '∞' : product.stock}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="px-3 py-1.5 border border-gray-200 rounded text-sm text-center">
                        {formatPrice(product.base_price)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="px-3 py-1.5 border border-gray-200 rounded text-sm text-center w-20">
                        {product.promotional_price ? formatPrice(product.promotional_price) : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        {product.variants && product.variants.length > 0 ? (
                          product.variants.slice(0, 2).map((variant, idx) => (
                            <div key={idx}>{variant.name}</div>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                        {product.variants && product.variants.length > 2 && (
                          <div className="text-gray-400">+{product.variants.length - 2} más</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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

            {products.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No se encontraron productos
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Producto */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Editar producto' : 'Nuevo producto'}
                </h2>
                <div className="flex items-center gap-3">
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
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Nombre y descripción */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Nombre y descripción</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Campera de cuero"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Confeccionada en cuero genuino de alta calidad..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>
              </div>

              {/* Fotos y video */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Fotos y video</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center">
                    <Plus className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Arrastrá y soltá, o subí fotos del producto</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Tamaño mínimo recomendado: 1024px / Formatos recomendados: WEBP, JPEG, PNG o GIF
                </p>
              </div>

              {/* Precios */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Precios</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio de venta</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio promocional</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={promotionalPrice}
                        onChange={(e) => setPromotionalPrice(e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Mostrar el precio en la tienda</span>
                </label>
              </div>

              {/* Stock */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Stock</h3>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="stock"
                      checked={stockType === 'limited'}
                      onChange={() => setStockType('limited')}
                      className="border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Limitado</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="stock"
                      checked={stockType === 'unlimited'}
                      onChange={() => setStockType('unlimited')}
                      className="border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Ilimitado</span>
                  </label>
                </div>
                {stockType === 'limited' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}
              </div>

              {/* Códigos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Códigos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">El SKU es un código que usás internamente para hacer el seguimiento de tus productos.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras</label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">El código de barras consta de 13 números y se utiliza para identificar un producto.</p>
                  </div>
                </div>
              </div>

              {/* Categorías */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
                <p className="text-sm text-gray-600">Ayuda a clientes a encontrar más rápido tus productos.</p>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Variantes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Variantes</h3>
                <p className="text-sm text-gray-600">Crea diferentes propiedades de tu producto. Ejemplos: color y tamaño.</p>

                {variants.length > 0 && (
                  <div className="space-y-2">
                    {variants.map((variant, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-sm font-medium">{variant.name}</span>
                        <span className="text-sm text-gray-600">{formatPrice(variant.price)}</span>
                        <span className="text-sm text-gray-600">Stock: {variant.stock}</span>
                        <button
                          onClick={() => handleRemoveVariant(index)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    placeholder="Nombre (ej: Rojo, S, etc.)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    value={newVariantPrice}
                    onChange={(e) => setNewVariantPrice(e.target.value)}
                    placeholder="Precio"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(e.target.value)}
                    placeholder="Stock"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleAddVariant}
                    disabled={!newVariantName.trim()}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Destacar producto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Destacar producto</h3>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="highlight"
                      checked={productType === 'rental'}
                      onChange={() => setProductType('rental')}
                      className="border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Alquiler</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="highlight"
                      checked={productType === 'sale'}
                      onChange={() => setProductType('sale')}
                      className="border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Venta</span>
                  </label>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={freeShipping}
                    onChange={(e) => setFreeShipping(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Este producto tiene envío gratis</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showInStore}
                    onChange={(e) => setShowInStore(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Mostrar el producto en la tienda</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProductosPage;
