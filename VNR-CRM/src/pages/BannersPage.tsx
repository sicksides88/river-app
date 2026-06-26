import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import {
  Search,
  Plus,
  EyeOff,
  Eye,
  Trash2,
  Loader2,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Pencil,
  X,
} from 'lucide-react';
import { bannersService } from '../services';
import type { Banner, BannerActionType, BannerLocation } from '../types/database';

const MAX_DESCRIPTION_LENGTH = 250;

const BannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [buttonText, setButtonText] = useState('');
  const [actionType, setActionType] = useState<BannerActionType>('none');
  const [actionValue, setActionValue] = useState('');
  const [location, setLocation] = useState<BannerLocation>('home');
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bannersService.getAll(1, 100, {
        search: searchTerm || undefined,
      });
      setBanners(response.data);
    } catch (err) {
      setError('Error al cargar los banners');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBanners();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setImageFile(null);
    setImagePreview(null);
    setButtonText('');
    setActionType('none');
    setActionValue('');
    setLocation('home');
    setIsActive(true);
    setStartsAt('');
    setEndsAt('');
    setEditingBanner(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setDescription(banner.description || '');
    setImageUrl(banner.image_url || '');
    setImagePreview(banner.image_url || null);
    setButtonText(banner.button_text || '');
    setActionType(banner.action_type);
    setActionValue(banner.action_value || '');
    setLocation(banner.location);
    setIsActive(banner.is_active);
    setStartsAt(banner.starts_at ? banner.starts_at.split('T')[0] : '');
    setEndsAt(banner.ends_at ? banner.ends_at.split('T')[0] : '');
    setShowModal(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede superar los 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBanner = async () => {
    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(`La descripción no puede superar los ${MAX_DESCRIPTION_LENGTH} caracteres`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let finalImageUrl = imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        setUploading(true);
        finalImageUrl = await bannersService.uploadImage(imageFile);
        setUploading(false);
      }

      const bannerData: Partial<Banner> = {
        title: title.trim(),
        description: description.trim() || null,
        image_url: finalImageUrl || null,
        button_text: buttonText.trim() || null,
        action_type: actionType,
        action_value: actionType !== 'none' ? actionValue.trim() : null,
        location,
        is_active: isActive,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      };

      if (editingBanner) {
        await bannersService.update(editingBanner.id, bannerData);
      } else {
        // Set order_index as last position
        bannerData.order_index = banners.length;
        await bannersService.create(bannerData);
      }

      resetForm();
      setShowModal(false);
      loadBanners();
    } catch (err) {
      setError('Error al guardar el banner');
      console.error(err);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;

    try {
      await bannersService.delete(id);
      loadBanners();
    } catch (err) {
      setError('Error al eliminar el banner');
      console.error(err);
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      await bannersService.toggleStatus(banner.id, !banner.is_active);
      loadBanners();
    } catch (err) {
      setError('Error al cambiar el estado del banner');
      console.error(err);
    }
  };

  const getLocationLabel = (loc: BannerLocation) => {
    const labels: Record<BannerLocation, string> = {
      home: 'Inicio',
      marketplace: 'Marketplace',
      services: 'Servicios',
    };
    return labels[loc];
  };

  const getActionTypeLabel = (type: BannerActionType) => {
    const labels: Record<BannerActionType, string> = {
      none: 'Sin acción',
      url: 'URL externa',
      product: 'Producto',
      category: 'Categoría',
      promotion: 'Promoción',
    };
    return labels[type];
  };

  return (
    <Layout>
      <div className="p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
            <p className="text-gray-500 mt-1">Gestiona el carrusel de imágenes de la app</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear banner
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Cerrar
            </button>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Banners Grid */}
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Cargando banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No se encontraron banners</p>
            <p className="text-sm mt-1">Crea tu primer banner para el carrusel</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-[16/9] bg-gray-100">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {/* Order badge */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    <GripVertical className="w-3 h-3 inline mr-1" />
                    Orden: {banner.order_index + 1}
                  </div>
                  {/* Status badge */}
                  <div
                    className={`absolute top-2 right-2 text-xs px-2 py-1 rounded font-medium ${
                      banner.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {banner.is_active ? 'Activo' : 'Inactivo'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{banner.title}</h3>
                  {banner.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {banner.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {getLocationLabel(banner.location)}
                    </span>
                    {banner.action_type !== 'none' && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        {getActionTypeLabel(banner.action_type)}
                      </span>
                    )}
                  </div>
                  {banner.clicks_count > 0 && (
                    <p className="text-xs text-gray-400 mb-3">
                      {banner.clicks_count} clicks
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(banner)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={banner.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {banner.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Banner */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBanner ? 'Editar banner' : 'Crear banner'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Imagen */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Imagen del banner</h3>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Click para cambiar la imagen
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click para subir imagen
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG hasta 5MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Título y Descripción */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contenido</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título del banner"
                    maxLength={255}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción breve del banner"
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                  <p className={`text-xs mt-1 ${description.length > MAX_DESCRIPTION_LENGTH - 20 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {description.length}/{MAX_DESCRIPTION_LENGTH} caracteres
                  </p>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Ubicación</h3>
                <div className="flex gap-2">
                  {(['home', 'marketplace', 'services'] as BannerLocation[]).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setLocation(loc)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location === loc
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {getLocationLabel(loc)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Acción */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Acción al tocar</h3>
                <div className="flex flex-wrap gap-2">
                  {(['none', 'url', 'product', 'category', 'promotion'] as BannerActionType[]).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setActionType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          actionType === type
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {getActionTypeLabel(type)}
                      </button>
                    )
                  )}
                </div>
                {actionType !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {actionType === 'url' ? 'URL' : 'ID del recurso'}
                    </label>
                    <input
                      type="text"
                      value={actionValue}
                      onChange={(e) => setActionValue(e.target.value)}
                      placeholder={
                        actionType === 'url'
                          ? 'https://ejemplo.com'
                          : 'ID del producto/categoría/promoción'
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto del botón (opcional)
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Ver más"
                    maxLength={100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Vigencia */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Vigencia</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desde (opcional)
                    </label>
                    <input
                      type="date"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta (opcional)
                    </label>
                    <input
                      type="date"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Si no se especifica fecha, el banner estará activo indefinidamente.
                </p>
              </div>

              {/* Estado */}
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Banner activo
                    </span>
                    <p className="text-xs text-gray-500">
                      El banner se mostrará en el carrusel de la app
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBanner}
                disabled={saving || !title.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? 'Subiendo imagen...' : editingBanner ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BannersPage;
