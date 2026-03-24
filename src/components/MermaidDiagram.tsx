'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code) {
        setSvg('');
        setError(null);
        return;
      }

      if (!containerRef.current) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Invalid Mermaid syntax');
        setSvg(''); // Clear the last valid SVG
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4">
      <div
        ref={containerRef}
        className={`mermaid-diagram ${className} ${error ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {error && (
        <div className="flex items-center justify-center h-full w-full max-w-lg mx-auto bg-red-50 text-red-500 p-8 rounded-2xl border border-red-200 shadow-sm transition-all duration-300 ease-in-out opacity-100 scale-100">
          <div className="text-center">
            <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold leading-none">!</span>
            </div>
            <p className="font-bold text-xl mb-2 text-red-900 leading-tight">Syntax Error</p>
            <p className="text-sm font-mono bg-white/70 p-4 rounded-xl border border-red-100 inline-block text-left break-words max-w-full overflow-hidden shadow-inner">
              {error}
            </p>
            <p className="mt-4 text-xs text-red-400 font-medium">Fix the syntax in the editor to resume rendering.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MermaidDiagram;
