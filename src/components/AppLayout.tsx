'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useDatabase } from './DatabaseProvider';
import { getProjects } from '@/lib/client-actions';
import { getImages } from '@/lib/client-image-actions';
import { Project } from '@/db/schema';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { db, isReady, version } = useDatabase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [images, setImages] = useState<any[]>([]);

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
    <div className="h-full flex bg-gray-900 text-gray-100 overflow-hidden">
      <Sidebar initialProjects={projects} initialImages={images} />
      <main className="flex-1 h-full overflow-hidden bg-white text-gray-900 relative">
        {children}
      </main>
    </div>
  );
}
