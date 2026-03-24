'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon, Copy, Check, Loader2 } from 'lucide-react';
import { uploadImage, deleteImage } from '@/lib/client-image-actions';
import { useDatabase } from './DatabaseProvider';
import { eq } from 'drizzle-orm';
import { images } from '@/db/schema';

interface ImageGalleryProps {
  initialImages: {
    id: number;
    name: string;
    contentType: string;
  }[];
}

const ImageThumbnail = ({ id, name }: { id: number, name: string }) => {
  const { db } = useDatabase();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const fetch = async () => {
      const img = await db.query.images.findFirst({
        where: eq(images.id, id),
      });
      if (img) {
        const blob = new Blob([img.data as any], { type: img.contentType });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
    };
    fetch();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [db, id]);

  return (
    <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
      {blobUrl ? (
        <img src={blobUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <ImageIcon className="w-4 h-4 text-gray-700" />
      )}
    </div>
  );
};

const ImageGallery: React.FC<ImageGalleryProps> = ({ initialImages }) => {
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { db, save, refresh } = useDatabase();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setUploading(true);

    try {
      await uploadImage(db, file);
      await save();
      refresh();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!db) return;
    if (confirm('Delete this image? It will break any diagrams using it.')) {
      await deleteImage(db, id);
      await save();
      refresh();
    }
  };

  const copyToClipboard = (id: number) => {
    const tag = `<img src='/api/image/${id}' width='100' />`;
    navigator.clipboard.writeText(tag);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-hidden font-sans">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 px-2">
          Gallery
        </h2>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
          accept="image/*"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm font-medium border border-gray-700 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {initialImages.map((image) => (
          <div
            key={image.id}
            className="group relative bg-gray-800/50 border border-gray-800 rounded-lg p-2 mb-2 hover:border-gray-700 transition-all overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <ImageThumbnail id={image.id} name={image.name} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate font-medium">
                  {image.name}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  ID: {image.id}
                </p>
              </div>
            </div>

            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => copyToClipboard(image.id)}
                className="p-1.5 bg-gray-900/80 hover:bg-blue-900/40 text-gray-400 hover:text-blue-400 rounded-md transition-all shadow-lg"
                title="Copy Image Tag"
              >
                {copiedId === image.id ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => handleDelete(image.id)}
                className="p-1.5 bg-gray-900/80 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-md transition-all shadow-lg"
                title="Delete Image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {initialImages.length === 0 && !uploading && (
          <div className="px-4 py-8 text-center border-2 border-dashed border-gray-800 rounded-xl m-2">
            <ImageIcon className="w-8 h-8 text-gray-700 mx-auto mb-2 opacity-20" />
            <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">
              Gallery Empty
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;
