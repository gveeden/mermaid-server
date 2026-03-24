'use client';

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, notFound } from 'next/navigation';
import MermaidEditor from '@/components/MermaidEditor';
import MermaidDiagram from '@/components/MermaidDiagram';
import {
  Download, FileImage, FileCode, FileText, Check, Save,
  Loader2, Menu, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw,
  Move
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Project } from '@/db/schema';
import { getProject, updateProject } from '@/lib/client-actions';
import { useDatabase } from '@/components/DatabaseProvider';
import { useLayout } from '@/components/AppLayout';

function ProjectClientContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const { db, isReady, save, refresh } = useDatabase();
  const { toggleSidebar } = useLayout();

  const [project, setProject] = useState<Project | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(true);

  // NAVIGATION STATE - ADJUST DEFAULTS HERE
  const [zoom, setZoom] = useState(1.0); // Line 38: Initial Zoom (1.0 = 100%)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const diagramRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

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
        setProject({ ...project, code, title });
        if (title !== project.title) {
          refresh();
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, title, project, db, save, refresh]);

  // --- PAN & ZOOM LOGIC ---

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => {
      const newZoom = Math.min(Math.max(prev + delta, 0.1), 10);
      return parseFloat(newZoom.toFixed(2));
    });
  }, []);

  const resetView = useCallback(() => {
    setZoom(1.0); // Line 93: Reset Zoom
    setPan({ x: 0, y: 0 });
  }, []);

  // Use a native listener to support non-passive wheel events
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // Always prevent default to stop page scrolling
      e.preventDefault();

      // Control zoom sensitivity
      const delta = e.deltaY * -0.001;
      handleZoom(delta);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [handleZoom]);

  // Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      const step = 40;
      switch (e.key) {
        case 'ArrowUp': setPan(p => ({ ...p, y: p.y - step })); break;
        case 'ArrowDown': setPan(p => ({ ...p, y: p.y + step })); break;
        case 'ArrowLeft': setPan(p => ({ ...p, x: p.x - step })); break;
        case 'ArrowRight': setPan(p => ({ ...p, x: p.x + step })); break;
        case '+': case '=': handleZoom(0.1); break;
        case '-': case '_': handleZoom(-0.1); break;
        case '0': resetView(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleZoom, resetView]);

  // --- EXPORT LOGIC ---

  const downloadSVG = async () => {
    if (!diagramRef.current || !db) return;
    const svgElement = diagramRef.current.querySelector('svg');
    if (!svgElement) return;

    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    const imgs = Array.from(clonedSvg.querySelectorAll('img[data-image-id]'));

    for (const img of imgs) {
      const imageId = parseInt(img.getAttribute('data-image-id') || '');
      if (isNaN(imageId)) continue;

      const imageRecord = await db.query.images.findFirst({
        where: (images, { eq }) => eq(images.id, imageId),
      });

      if (imageRecord) {
        const blob = new Blob([imageRecord.data as any], { type: imageRecord.contentType });
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const imgElement = img as HTMLImageElement;
        imgElement.setAttribute('src', base64);
        imgElement.removeAttribute('data-image-id');
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
      <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-md lg:hidden text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <FileCode className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 flex-shrink-0" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg lg:text-xl font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-b-2 focus:ring-blue-500 w-full max-w-md truncate"
            placeholder="Untitled Diagram"
          />
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 font-medium">
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

        <div className="flex gap-1 lg:gap-2">
          <button onClick={downloadSVG} className="flex items-center gap-2 px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden md:inline">SVG</span>
          </button>
          <button onClick={downloadPNG} className="flex items-center gap-2 px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <FileImage className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden md:inline">PNG</span>
          </button>
          <button onClick={downloadJPEG} className="flex items-center gap-2 px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <FileText className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden md:inline">JPEG</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 relative">
        {/* Editor Area */}
        <div className={`
          relative transition-all duration-300 ease-in-out border-gray-200
          ${isEditorVisible ? 'w-full lg:w-1/2 h-[400px] lg:h-full opacity-100' : 'w-0 h-0 lg:h-full lg:w-0 opacity-0 pointer-events-none'}
          ${isEditorVisible ? 'border-b lg:border-b-0 lg:border-r p-2 lg:p-4' : 'border-0 p-0'}
        `}>
          {isEditorVisible && (
            <MermaidEditor code={code} onChange={setCode} className="h-full" />
          )}

          {/* Collapse Button (inside) */}
          {isEditorVisible && (
            <button
              onClick={() => setIsEditorVisible(false)}
              className="absolute top-6 right-6 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-500 z-10 hidden lg:block"
              title="Collapse Editor"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand Button (outside when collapsed) */}
        {!isEditorVisible && (
          <button
            onClick={() => setIsEditorVisible(true)}
            className="absolute top-4 left-4 p-2 bg-white border border-gray-200 rounded-md shadow-md hover:bg-gray-50 text-blue-600 z-20 hidden lg:block"
            title="Expand Editor"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Mobile Toggle (Floating) */}
        <button
          onClick={() => setIsEditorVisible(!isEditorVisible)}
          className="lg:hidden fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-30"
        >
          <FileCode className="w-6 h-6" />
        </button>

        {/* Preview Area */}
        <div
          ref={previewContainerRef}
          onMouseDown={handleMouseDown}
          className={`
            flex-1 min-h-[400px] lg:h-full bg-gray-100 flex items-center justify-center relative overflow-hidden transition-all duration-300
            ${!isEditorVisible ? 'w-full' : ''}
            ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          `}
        >
          {/* Zoom & Pan Info */}
          <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 pointer-events-none opacity-50">
            <div className="flex items-center gap-2 bg-black/10 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600">
              <Move className="w-3 h-3" /> Pan: {Math.round(pan.x)}, {Math.round(pan.y)}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200 z-10">
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              title="Zoom Out ( - )"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-gray-700 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.2)}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              title="Zoom In ( + )"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button
              onClick={resetView}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              title="Reset View ( 0 )"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Line 301: Adjust min-w / min-h here for base canvas size */}
          <div
            ref={diagramRef}
            className="bg-white p-8 lg:p-24 rounded-lg shadow-xl border border-gray-200 transition-transform duration-75 hover:shadow-2xl overflow-visible flex items-center justify-center select-none pointer-events-none min-w-fit min-h-fit"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <MermaidDiagram code={code} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectClient() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
        <p className="text-gray-500 text-sm">Initializing...</p>
      </div>
    }>
      <ProjectClientContent />
    </Suspense>
  );
}
