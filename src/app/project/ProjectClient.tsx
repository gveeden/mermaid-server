'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, notFound } from 'next/navigation';
import MermaidEditor from '@/components/MermaidEditor';
import MermaidDiagram from '@/components/MermaidDiagram';
import { Download, FileImage, FileCode, FileText, Check, Save, Loader2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Project } from '@/db/schema';
import { getProject, updateProject } from '@/lib/client-actions';
import { useDatabase } from '@/components/DatabaseProvider';

export default function ProjectClient() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const { db, isReady, save, refresh } = useDatabase();
  
  const [project, setProject] = useState<Project | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const diagramRef = useRef<HTMLDivElement>(null);

  // Initial Fetch
  useEffect(() => {
    if (isReady && db && idParam) {
      const fetchProject = async () => {
        setLoading(true);
        const projectId = parseInt(idParam as string);
        if (isNaN(projectId)) {
          setLoading(false);
          return;
        }
        const p = await getProject(db, projectId);
        if (p) {
          setProject(p);
          setCode(p.code);
          setTitle(p.title);
        }
        setLoading(false);
      };
      fetchProject();
    }
  }, [isReady, db, idParam]);

  // Autosave logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!db || !project) return;
      if (code !== project.code || title !== project.title) {
        setIsSaving(true);
        await updateProject(db, project.id, { code, title });
        await save();
        setLastSaved(new Date());
        setIsSaving(false);
        // Update local project reference to avoid re-triggering
        setProject({ ...project, code, title });
        // Refresh sidebar title if title changed
        if (title !== project.title) {
          refresh();
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, title, project, db, save, refresh]);

  const downloadSVG = async () => {
    if (!diagramRef.current || !db) return;
    const svgElement = diagramRef.current.querySelector('svg');
    if (!svgElement) return;

    // Clone SVG to avoid modifying the live preview
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Find all images with our custom metadata
    const imgs = Array.from(clonedSvg.querySelectorAll('img[data-image-id]'));
    
    for (const img of imgs) {
      const imageId = parseInt(img.getAttribute('data-image-id') || '');
      if (isNaN(imageId)) continue;
      
      const imageRecord = await db.query.images.findFirst({
        where: (images, { eq }) => eq(images.id, imageId),
      });

      if (imageRecord) {
        // Convert to Base64 using FileReader
        const blob = new Blob([imageRecord.data as any], { type: imageRecord.contentType });
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        img.setAttribute('src', base64);
        // Clean up metadata
        img.removeAttribute('data-image-id');
      }
    }

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
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

  if (!isReady || (loading && idParam)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
        <p className="text-gray-500 text-sm">Loading project...</p>
      </div>
    );
  }

  if (!project && !loading) {
    notFound();
  }

  if (!project) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
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
