'use client';

import React from 'react';

interface MermaidEditorProps {
  code: string;
  onChange: (value: string) => void;
  className?: string;
}

const MermaidEditor: React.FC<MermaidEditorProps> = ({ code, onChange, className }) => {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <textarea
        className="flex-grow w-full p-6 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl shadow-lg leading-relaxed"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter Mermaid diagram code here..."
        spellCheck={false}
      />
    </div>
  );
};

export default MermaidEditor;
