'use client';

import React, { useState, useRef, useEffect } from 'react';
import MermaidEditor from '@/components/MermaidEditor';
import MermaidDiagram from '@/components/MermaidDiagram';
import { Download, FileImage, FileCode, FileText, Check, Save } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Project } from '@/db/schema';
import { updateProject } from '@/lib/actions';

interface ProjectClientProps {
  initialProject: Project;
}

export default function ProjectClient({ initialProject }: ProjectClientProps) {
  const [code, setCode] = useState(initialProject.code);
  const [title, setTitle] = useState(initialProject.title);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const diagramRef = useRef<HTMLDivElement>(null);

  // Autosave logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (code !== initialProject.code || title !== initialProject.title) {
        setIsSaving(true);
        await updateProject(initialProject.id, { code, title });
        setIsSaving(false);
        setLastSaved(new Date());
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, title, initialProject.id, initialProject.code, initialProject.title]);

  const downloadSVG = () => {
    if (!diagramRef.current) return;
    const svgElement = diagramRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPNG = async () => {
    if (!diagramRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(diagramRef.current, { skipFonts: true });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${title.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading PNG:', error);
    }
  };

  const downloadJPEG = async () => {
    if (!diagramRef.current) return;
    try {
      const dataUrl = await htmlToImage.toJpeg(diagramRef.current, { quality: 0.95, backgroundColor: '#ffffff', skipFonts: true });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${title.replace(/\s+/g, '_')}.jpg`;
      link.click();
    } catch (error) {
      console.error('Error downloading JPEG:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4 flex-1">
          <FileCode className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-b-2 focus:ring-blue-500 w-full max-w-md"
            placeholder="Untitled Diagram"
          />
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <Save className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="w-3 h-3" /> Saved
              </span>
            ) : null}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={downloadSVG}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            SVG
          </button>
          <button 
            onClick={downloadPNG}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FileImage className="w-4 h-4" />
            PNG
          </button>
          <button 
            onClick={downloadJPEG}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            JPEG
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Editor Area */}
        <div className="w-1/2 h-full p-4 border-r border-gray-200">
          <MermaidEditor 
            code={code} 
            onChange={setCode} 
            className="h-full"
          />
        </div>

        {/* Preview Area */}
        <div className="w-1/2 h-full p-8 bg-gray-100 overflow-auto flex items-center justify-center">
          <div 
            ref={diagramRef} 
            className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 min-h-[300px] min-w-[300px] flex items-center justify-center transition-all duration-300 hover:shadow-2xl overflow-visible"
          >
             <MermaidDiagram code={code} className="max-w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
