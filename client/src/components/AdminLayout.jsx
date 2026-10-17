import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
