import React, { useEffect, useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, CheckCircle2, Loader2, AlertCircle, Edit3 } from 'lucide-react';
import { PhotoItem } from '../types';

interface PhotoCardProps {
  photo: PhotoItem;
  onRemove: (id: string) => void;
  onCaptionChange: (id: string, newCaption: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onRemove, onCaptionChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [tempCaption, setTempCaption] = useState(photo.caption);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempCaption(photo.caption);
  }, [photo.caption]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onCaptionChange(photo.id, tempCaption);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
    >
      {/* Header / Number Badge */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <span className="bg-slate-900/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
          {photo.number}
        </span>
        {photo.status === 'processing' && (
          <span className="bg-blue-500/90 text-white p-1 rounded-full backdrop-blur-sm animate-spin">
            <Loader2 className="w-3 h-3" />
          </span>
        )}
        {photo.status === 'done' && (
          <span className="bg-green-500/90 text-white p-1 rounded-full backdrop-blur-sm">
            <CheckCircle2 className="w-3 h-3" />
          </span>
        )}
        {photo.status === 'error' && (
          <span className="bg-red-500/90 text-white p-1 rounded-full backdrop-blur-sm" title={photo.errorMsg}>
            <AlertCircle className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Remove Button */}
      <button 
        onClick={() => onRemove(photo.id)}
        className="absolute top-2 right-2 z-10 p-1 bg-white/80 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-3 bg-black/30 rounded-full text-white backdrop-blur-sm transition-opacity"
      >
        <GripVertical className="w-6 h-6" />
      </div>

      {/* Image Thumbnail */}
      <div className="aspect-[4/3] bg-slate-100 relative">
        <img 
          src={photo.previewUrl} 
          alt={photo.caption} 
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* Caption Editor */}
      <div className="p-3 flex-1 flex flex-col bg-slate-50 border-t border-slate-100">
        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex justify-between">
          <span>Legenda</span>
          <button 
            onClick={() => setIsEditing(true)} 
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
             <Edit3 className="w-3 h-3" /> Editar
          </button>
        </label>
        
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={tempCaption}
            onChange={(e) => setTempCaption(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full text-sm p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none bg-white text-slate-700"
            rows={3}
          />
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="text-sm text-slate-700 cursor-text hover:bg-white p-1 -m-1 rounded transition-colors min-h-[3.5rem]"
          >
            {photo.status === 'pending' ? (
                <span className="text-slate-400 italic">Aguardando análise...</span>
            ) : (
                photo.caption || <span className="text-slate-400 italic">Sem legenda</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
