'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/components/DatabaseProvider';
import { getProjects, createProject } from '@/lib/client-actions';
import { Plus, FileCode, Loader2 } from 'lucide-react';

export default function Home() {
  const { db, isReady, refresh, save } = useDatabase();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && db) {
      const checkProjects = async () => {
        const projects = await getProjects(db);
        if (projects.length > 0) {
          router.replace(`/project?id=${projects[0].id}`);
        } else {
          setLoading(false);
        }
      };
      checkProjects();
    }
  }, [isReady, db, router]);

  const handleCreateFirst = async () => {
    if (!db) return;
    const project = await createProject(db);
    await save();
    refresh();
    router.push(`/project?id=${project.id}`);
  };

  if (!isReady || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
        <p className="text-gray-500 text-sm">Preparing workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center p-8 overflow-y-auto">
      <div className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileCode className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">Welcome!</h1>
        <p className="text-gray-500 mb-8 font-sans">
          Create your first Mermaid diagram and start visualizing your ideas locally in your browser.
        </p>
        
        <button 
          onClick={handleCreateFirst}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          Create First Project
        </button>
      </div>
      
      <p className="mt-8 text-gray-400 text-[10px] font-mono uppercase tracking-[0.2em]">
        Wasm SQLite Persistence
      </p>
    </div>
  );
}
