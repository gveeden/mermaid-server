'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import { useDatabase } from './DatabaseProvider';
import { getProjects } from '@/lib/client-actions';
import { getImages } from '@/lib/client-image-actions';
import { Project } from '@/db/schema';
import { Loader2, Menu, X } from 'lucide-react';

interface LayoutContextType {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) throw new Error('useLayout must be used within AppLayout');
  return context;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { db, isReady, version } = useDatabase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Initialize sidebar state based on screen size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  useEffect(() => {
    if (isReady && db) {
      const fetchData = async () => {
        const [p, i] = await Promise.all([
          getProjects(db),
          getImages(db)
        ]);
        setProjects(p as any);
        setImages(i as any);
      };
      fetchData();
    }
  }, [isReady, db, version]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  if (!isReady) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <div className="text-center">
          <p className="text-gray-300 font-medium">Initializing Local Database...</p>
          <p className="text-gray-500 text-xs font-mono mt-2">Wasm SQLite Engine Loading</p>
        </div>
      </div>
    );
  }

  return (
    <LayoutContext.Provider value={{ isSidebarOpen, setSidebarOpen, toggleSidebar }}>
      <div className="h-full flex bg-gray-900 text-gray-100 overflow-hidden relative">
        {/* Sidebar overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <div className={`
          fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
        `}>
          <Sidebar initialProjects={projects} initialImages={images} />
        </div>

        <main className="flex-1 h-full overflow-hidden bg-white text-gray-900 relative">
          {children}
        </main>
      </div>
    </LayoutContext.Provider>
  );
}
