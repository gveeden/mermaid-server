'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2, FileCode, Folder, Image as ImageIcon, Download, Upload as UploadIcon, Database } from 'lucide-react';
import { createProject, deleteProject } from '@/lib/client-actions';
import { Project } from '@/db/schema';
import ImageGallery from './ImageGallery';
import { useDatabase } from './DatabaseProvider';
import { saveDBBinary } from '@/lib/db-browser';

interface SidebarProps {
  initialProjects: Project[];
  initialImages: {
    id: number;
    name: string;
    contentType: string;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ initialProjects, initialImages }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentId = searchParams.get('id') ? parseInt(searchParams.get('id') as string) : null;
  const [activeTab, setActiveTab] = useState<'projects' | 'images'>('projects');
  const { db, sqlite, refresh, save } = useDatabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateProject = async () => {
    if (!db) return;
    const project = await createProject(db);
    await save();
    refresh();
    router.push(`/project?id=${project.id}`);
  };

  const handleDeleteProject = async (id: number) => {
    if (!db) return;
    if (confirm('Delete this project?')) {
      await deleteProject(db, id);
      await save();
      refresh();
      if (currentId === id) {
        router.push('/');
      }
    }
  };

  const downloadBackup = () => {
    if (!sqlite) return;
    const data = sqlite.export();
    const blob = new Blob([data as any], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mermaid_backup_${new Date().toISOString().split('T')[0]}.db`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      await saveDBBinary(uint8Array);
      // Hard refresh to reload the DB from IndexedDB
      window.location.reload();
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Tab Switcher */}
      <div className="flex p-2 bg-gray-950/50 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeTab === 'projects'
              ? 'bg-gray-800 text-blue-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          Projects
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeTab === 'images'
              ? 'bg-gray-800 text-blue-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Images
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'projects' ? (
          <>
            <div className="p-4 border-b border-gray-800">
              <button
                onClick={handleCreateProject}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {initialProjects.map((project) => (
                <div
                  key={project.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors mb-1 ${
                    currentId === project.id
                      ? 'bg-gray-800 text-white ring-1 ring-gray-700 shadow-inner'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <Link
                    href={`/project?id=${project.id}`}
                    className="flex-1 flex items-center gap-2 truncate text-sm"
                  >
                    <FileCode className={`w-4 h-4 flex-shrink-0 ${currentId === project.id ? 'text-blue-400' : 'text-gray-500'}`} />
                    <span className="truncate">{project.title}</span>
                  </Link>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteProject(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 hover:text-red-400 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              {initialProjects.length === 0 && (
                <div className="px-4 py-8 text-center border-2 border-dashed border-gray-800 rounded-xl m-2">
                  <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">No Projects</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <ImageGallery initialImages={initialImages} />
        )}
      </div>

      {/* Backup & Restore */}
      <div className="p-2 border-t border-gray-800 bg-gray-950/20 grid grid-cols-2 gap-2">
        <button
          onClick={downloadBackup}
          className="flex items-center justify-center gap-1.5 py-2 px-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-md transition-all text-[10px] font-bold uppercase"
          title="Download Backup"
        >
          <Download className="w-3 h-3" />
          Backup
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 py-2 px-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-md transition-all text-[10px] font-bold uppercase"
          title="Restore Backup"
        >
          <UploadIcon className="w-3 h-3" />
          Restore
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleRestore}
          className="hidden"
          accept=".db,application/x-sqlite3"
        />
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-950/50">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter flex items-center gap-1">
            <Database className="w-2 h-2" />
            Wasm Persistence Active
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
