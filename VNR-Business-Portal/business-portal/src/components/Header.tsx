import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Store } from 'lucide-react';

const Header: React.FC = () => {
  const { business } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      <div />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Store className="w-4 h-4 text-gray-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">{business?.name}</span>
      </div>
    </header>
  );
};

export default Header;
