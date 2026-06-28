import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <div
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {title ? (
          <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        ) : (
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 lg:p-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
