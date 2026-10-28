import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useTourUi } from '../tour/tourBus.js';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // En pantallas chicas el sidebar es un drawer: el guided tour lo abre para resaltar sus opciones
  useTourUi(({ sidebar }) => {
    setSidebarOpen(Boolean(sidebar) && window.matchMedia('(max-width: 1023px)').matches);
  });

  return (
    <div className="min-h-screen bg-ink-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="relative min-h-screen lg:pl-64">
        <div className="relative mx-auto max-w-[1400px] px-5 py-7 sm:px-8 lg:px-10">
          <Outlet context={{ openSidebar: () => setSidebarOpen(true) }} />
        </div>
      </main>
    </div>
  );
}
