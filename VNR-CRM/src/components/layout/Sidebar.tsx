import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  UserCheck,
  Receipt,
  Users,
  Store,
  CreditCard,
  BarChart3,
  ClipboardList,
  Scale,
  LogOut,
  Package,
  FolderOpen,
  Ticket,
  Tag,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Image,
  Building2,
  Truck,
  Receipt as ReceiptIcon,
  Anchor,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
  children?: NavItem[];
}

// Navegación según diseño Figma
const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Mapa', href: '/mapa', icon: Map },
  { name: 'Gestión KYC', href: '/kyc', icon: UserCheck },
  { name: 'Tarifas y reglas', href: '/tarifas', icon: Receipt },
  { name: 'Usuarios', href: '/usuarios', icon: Users },
  { name: 'Banners', href: '/banners', icon: Image },
  {
    name: 'Marketplace',
    href: '/marketplace',
    icon: Store,
    children: [
      { name: 'Productos', href: '/marketplace/productos', icon: Package },
      { name: 'Categoría', href: '/marketplace/categorias', icon: FolderOpen },
      { name: 'Cupones', href: '/marketplace/cupones', icon: Ticket },
      { name: 'Promociones', href: '/marketplace/promociones', icon: Tag },
      { name: 'Pedidos', href: '/marketplace/pedidos', icon: ShoppingCart },
    ]
  },
  {
    name: 'Comercios',
    href: '/comercios',
    icon: Building2,
    children: [
      { name: 'Comercios', href: '/comercios', icon: Building2 },
      { name: 'Pedidos', href: '/comercios/pedidos', icon: Truck },
      { name: 'Facturación', href: '/comercios/facturacion', icon: ReceiptIcon },
    ]
  },
  { name: 'Pagos', href: '/pagos', icon: CreditCard },
  {
    name: 'River Service',
    href: '/river',
    icon: Anchor,
    children: [
      { name: 'Operaciones', href: '/river', icon: LayoutDashboard },
      { name: 'Mapa operativo', href: '/river/mapa', icon: Map },
      { name: 'Despacho', href: '/river/despacho', icon: Truck },
      { name: 'Turnos guardia', href: '/river/turnos', icon: Clock },
      { name: 'Alta telefónica', href: '/river/alta', icon: Receipt },
    ],
  },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Auditoría', href: '/auditoria', icon: ClipboardList },
  { name: 'Legales', href: '/legales', icon: Scale },
];

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isChildActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child => location.pathname === child.href);
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isActive = location.pathname === item.href || isChildActive(item);

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpand(item.name)}
            className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              isActive
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center">
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-4">
              {item.children!.map(child => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.name}
        to={item.href}
        className={({ isActive: linkActive }) =>
          `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
            linkActive
              ? isChild
                ? 'text-white bg-gray-800'
                : 'text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`
        }
      >
        <item.icon className="w-5 h-5 mr-3" />
        {item.name}
      </NavLink>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black w-64">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 px-4">
        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">V</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => renderNavItem(item))}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-gray-800">
        <button
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
