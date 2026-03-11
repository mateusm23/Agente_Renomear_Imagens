import React, { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import { Download, HardHat, RotateCw, Trash2, Wand2, Building2, Calendar } from 'lucide-react';

import { Dropzone } from './components/Dropzone';
import { PhotoCard } from './components/PhotoCard';
import { PhotoItem } from './types';
import { generateImageDescription } from './services/geminiService';
import { downloadPhotosAsZip } from './services/exportService';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // New State for Header Data
  const [projectName, setProjectName] = useState('');
  const [referenceDate, setReferenceDate] = useState('');

  // --- Stats ---
  const stats = {
    total: photos.length,
    processed: photos.filter(p => p.status === 'done').length,
    pending: photos.filter(p => p.status === 'pending').length
  };

  // --- File Upload Handler ---
  const handleFilesDropped = useCallback((files: File[]) => {
    const newPhotos: PhotoItem[] = files.map(file => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
      number: '00',
      status: 'pending'
    }));

    setPhotos(prev => {
      const updated = [...prev, ...newPhotos];
      // Auto trigger processing if not already running
      return updated;
    });
  }, []);

  // --- Auto-Renumbering Effect ---
  useEffect(() => {
    setPhotos(currentPhotos => {
        // Only update if numbers need changing to avoid infinite loops
        let needsUpdate = false;
        const updated = currentPhotos.map((photo, index) => {
            const newNum = (index + 1).toString().padStart(2, '0');
            if (photo.number !== newNum) {
                needsUpdate = true;
                return { ...photo, number: newNum };
            }
            return photo;
        });
        return needsUpdate ? updated : currentPhotos;
    });
  }, [photos.length]); // Depend mainly on length change, DragEnd handles reordering

  // --- AI Processing Logic ---
  const processNextBatch = useCallback(async () => {
    if (isProcessing) return;

    // Find all pending photos
    const pendingPhotos = photos.filter(p => p.status === 'pending');
    if (pendingPhotos.length === 0) return;

    setIsProcessing(true);

    // Process all pending photos concurrently (with a limit in a real app, but here we go for simplicity/speed)
    // We update state individually as they finish for better UX
    
    const processItem = async (photo: PhotoItem) => {
        // Mark as processing
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'processing' } : p));
        
        try {
            const description = await generateImageDescription(photo.file);
            
            setPhotos(prev => prev.map(p => 
                p.id === photo.id 
                ? { ...p, status: 'done', caption: description } 
                : p
            ));
        } catch (error) {
            setPhotos(prev => prev.map(p => 
                p.id === photo.id 
                ? { ...p, status: 'error', errorMsg: 'Falha na IA' } 
                : p
            ));
        }
    };

    // Execute all pending
    await Promise.all(pendingPhotos.map(p => processItem(p)));
    
    setIsProcessing(false);
  }, [photos, isProcessing]);

  // Trigger processing when photos change state to pending
  useEffect(() => {
    const hasPending = photos.some(p => p.status === 'pending');
    if (hasPending && !isProcessing) {
        processNextBatch();
    }
  }, [photos, isProcessing, processNextBatch]);


  // --- Drag and Drop Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPhotos((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Re-number immediately
        return reordered.map((item, idx) => ({
            ...item,
            number: (idx + 1).toString().padStart(2, '0')
        }));
      });
    }
  };

  // --- Photo Actions ---
  const handleRemove = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleCaptionChange = (id: string, newCaption: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, caption: newCaption } : p));
  };

  const handleDownload = () => {
    // Pass the new state variables to the export service
    downloadPhotosAsZip(photos, 'laudo_fotos', projectName, referenceDate);
  };

  const handleReset = () => {
    if(window.confirm('Tem certeza que deseja limpar tudo?')) {
        setPhotos([]);
        setProjectName('');
        setReferenceDate('');
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
                <HardHat className="text-white w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">Renomeador de Fotos - Gerenciadora</h1>
                <p className="text-xs text-slate-500 font-medium">Desenvolvido Por: Mateus Monteiro</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Stats */}
             {stats.total > 0 && (
                <div className="hidden md:flex items-center gap-3 text-sm font-medium mr-4 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <span className="text-slate-500">Total: <span className="text-slate-900">{stats.total}</span></span>
                    <span className="w-px h-4 bg-slate-300"></span>
                    <span className="text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {stats.processed} Prontos
                    </span>
                    {stats.pending > 0 && (
                        <>
                        <span className="w-px h-4 bg-slate-300"></span>
                         <span className="text-blue-600 flex items-center gap-1 animate-pulse">
                            <Wand2 className="w-3 h-3" />
                            {stats.pending} Processando...
                        </span>
                        </>
                    )}
                </div>
             )}

            <button 
                onClick={handleDownload}
                disabled={stats.total === 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar ZIP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Project Details Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                Dados do Relatório
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="projectName" className="block text-xs font-medium text-slate-500 mb-1.5">
                        Nome da Obra
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HardHat className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Ex: Edifício Horizonte"
                            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors placeholder-slate-400"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="referenceDate" className="block text-xs font-medium text-slate-500 mb-1.5">
                        Data de Referência
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="date"
                            id="referenceDate"
                            value={referenceDate}
                            onChange={(e) => setReferenceDate(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-slate-700"
                        />
                    </div>
                </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
                Se preenchidos, os arquivos serão nomeados como: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">01. {projectName || 'Obra'} - {referenceDate || 'Data'} - Legenda.jpg</span>
            </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
            <Dropzone onFilesDropped={handleFilesDropped} />
        </div>

        {/* Toolbar */}
        {photos.length > 0 && (
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    Fotos do Relatório
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{stats.total}</span>
                </h2>
                <button 
                    onClick={handleReset}
                    className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                >
                    <Trash2 className="w-4 h-4" /> Limpar Tudo
                </button>
            </div>
        )}

        {/* Grid */}
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={photos.map(p => p.id)} 
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((photo) => (
                <PhotoCard 
                  key={photo.id} 
                  photo={photo} 
                  onRemove={handleRemove}
                  onCaptionChange={handleCaptionChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty State Hint */}
        {photos.length === 0 && (
            <div className="text-center mt-12 opacity-50">
                <div className="inline-block p-4 rounded-full bg-slate-200 mb-4">
                    <RotateCw className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">Nenhuma imagem carregada.</p>
                <p className="text-sm text-slate-400">Faça upload para começar a automação.</p>
            </div>
        )}

      </main>

      <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        <p>© 2026 - Renomeador de Fotos - Gerenciadora</p>
      </footer>
    </div>
  );
};

export default App;