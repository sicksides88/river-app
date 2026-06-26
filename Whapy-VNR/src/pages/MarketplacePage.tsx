import React from 'react';
import { Layout } from '../components/layout';
import { Store, Plus, Edit2, Trash2 } from 'lucide-react';

const MarketplacePage: React.FC = () => {
  // Productos placeholder (basado en diseño Figma - monopatines, bicicletas)
  const productos = [
    { id: '1', nombre: 'Monopatín Eléctrico Extreme 300', categoria: 'Monopatín', precio: 500, disponible: true, imagen: '' },
    { id: '2', nombre: 'Bicicleta Eléctrica Bi-200', categoria: 'Bicicleta', precio: 400, disponible: true, imagen: '' },
    { id: '3', nombre: 'Bicicleta Spinning Athletic Bi-660', categoria: 'Bicicleta', precio: 350, disponible: false, imagen: '' },
    { id: '4', nombre: 'Monopatín Eléctrico Xiaomi M365', categoria: 'Monopatín', precio: 600, disponible: true, imagen: '' },
    { id: '5', nombre: 'Scooter Eléctrico Pro', categoria: 'Scooter', precio: 700, disponible: true, imagen: '' },
    { id: '6', nombre: 'Bicicleta Urbana City', categoria: 'Bicicleta', precio: 300, disponible: true, imagen: '' },
  ];

  const categorias = ['Todos', 'Monopatín', 'Bicicleta', 'Scooter'];

  return (
    <Layout title="Marketplace">
      <div className="space-y-6">
        {/* Header con filtros y botón agregar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {categorias.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  cat === 'Todos'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Agregar producto
          </button>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <div key={producto.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Imagen placeholder */}
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <Store className="w-16 h-16 text-gray-300" />
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{producto.nombre}</h3>
                    <span className="text-sm text-gray-500">{producto.categoria}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    producto.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {producto.disponible ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-2xl font-bold text-gray-900">${producto.precio}</span>
                  <span className="text-sm text-gray-500">/día</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 flex items-center justify-center">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default MarketplacePage;
