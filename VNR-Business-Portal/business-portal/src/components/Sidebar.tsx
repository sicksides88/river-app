import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Plus,
  List,
  Map,
  DollarSign,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Nuevo Envío', href: '/nuevo-envio', icon: Plus },
  { name: 'Mapa en vivo', href: '/mapa', icon: Map },
  { name: 'Mis Envíos', href: '/envios', icon: List },
  { name: 'Facturación', href: '/facturacion', icon: DollarSign },
  { name: 'Mi Perfil', href: '/perfil', icon: User },
];

const Sidebar: React.FC = () => {
  const { business, logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-gray-900 w-64">
      {/* Logo */}
      <div className="flex items-center h-20 px-6">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
          <span className="text-gray-900 font-bold text-lg">V</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">VNR Comercios</p>
          <p className="text-gray-400 text-xs truncate max-w-[140px]">{business?.name}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                isActive
                  ? 'bg-white text-gray-900'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-400 rounded-xl hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
