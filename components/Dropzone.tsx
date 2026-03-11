import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropzoneProps {
  onFilesDropped: (files: File[]) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesDropped }) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files) as File[];
    // Filter for images
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      onFilesDropped(imageFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onFilesDropped(imageFiles);
      }
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="w-full border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl p-8 flex flex-col items-center justify-center transition-all hover:bg-blue-100 hover:border-blue-500 cursor-pointer group"
    >
      <input 
        type="file" 
        multiple 
        accept="image/png, image/jpeg, image/webp, image/heic"
        className="hidden" 
        id="fileInput"
        onChange={handleFileInput}
      />
      <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">Upload de Fotos</h3>
        <p className="text-slate-500 text-sm text-center mb-4">
          Arraste e solte suas fotos aqui ou clique para selecionar.
          <br />
          <span className="text-xs text-slate-400">Suporta JPG, PNG, WEBP</span>
        </p>
        <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition-colors">
          Selecionar Arquivos
        </span>
      </label>
    </div>
  );
};