import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Truck,
  Clock,
  Receipt,
  LogOut,
  Users,
  Ship,
  FileSpreadsheet,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Operaciones', href: '/', icon: LayoutDashboard },
  { name: 'Mapa operativo', href: '/mapa', icon: Map },
  { name: 'Despacho', href: '/despacho', icon: Truck },
  { name: 'Turnos guardia', href: '/turnos', icon: Clock },
  { name: 'Alta telefónica', href: '/alta', icon: Receipt },
  { name: 'Usuarios', href: '/usuarios', icon: Users },
  { name: 'Flota auxilio', href: '/flota', icon: Ship },
  { name: 'Informes', href: '/informes', icon: FileSpreadsheet },
];

const Sidebar: React.FC = () => {
  const { signOut, isSuperAdmin, isReadOnly } = useAuth();

  return (
    <div className="flex flex-col h-full bg-[#0B1220] w-64 border-r border-gray-800">
      <div className="flex flex-col items-center justify-center h-24 px-4 border-b border-gray-800">
        <img src="/logo-river.png" alt="River Service" className="h-12 w-auto object-contain" />
        <span className="mt-2 text-sm font-semibold text-white tracking-wide">River Service</span>
        {isReadOnly && (
          <span className="mt-1 text-[10px] uppercase tracking-wider text-amber-400/90">Solo lectura</span>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                isActive
                  ? 'text-white bg-gray-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
        {isSuperAdmin && (
          <NavLink
            to="/roles"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                isActive
                  ? 'text-white bg-gray-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`
            }
          >
            <Shield className="w-5 h-5 mr-3" />
            Roles CRM
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          type="button"
          onClick={signOut}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-400 rounded-xl hover:text-white hover:bg-gray-800/50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
