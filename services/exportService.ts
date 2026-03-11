import JSZip from 'jszip';
import saveAs from 'file-saver';
import { PhotoItem } from '../types';

export const downloadPhotosAsZip = async (
  photos: PhotoItem[], 
  zipName: string = 'laudo_fotos',
  projectName: string = '',
  referenceDate: string = ''
) => {
  const zip = new JSZip();
  const folder = zip.folder(zipName);

  if (!folder) return;

  // Use a map to track filenames and ensure uniqueness if captions duplicate
  const filenameCount: Record<string, number> = {};

  photos.forEach((photo) => {
    // Sanitize inputs
    const safeProject = projectName.replace(/[<>:"/\\|?*]/g, '').trim();
    const safeDate = referenceDate.replace(/[<>:"/\\|?*]/g, '').trim();
    let safeCaption = photo.caption.replace(/[<>:"/\\|?*]/g, '').trim();
    
    if (!safeCaption) safeCaption = "imagem";

    // Build Filename Structure
    // Format: "01. Nome da Obra - Data - Legenda.ext" or just "01. Legenda.ext"
    let filenameBase = `${photo.number}.`;

    if (safeProject) {
        filenameBase += ` ${safeProject} -`;
    }
    
    if (safeDate) {
        filenameBase += ` ${safeDate} -`;
    }

    filenameBase += ` ${safeCaption}`;
    
    // Ensure uniqueness
    if (filenameCount[filenameBase]) {
      filenameCount[filenameBase]++;
      filenameBase = `${filenameBase} (${filenameCount[filenameBase]})`;
    } else {
      filenameCount[filenameBase] = 1;
    }

    const extension = photo.file.name.split('.').pop() || 'jpg';
    const finalName = `${filenameBase}.${extension}`;

    folder.file(finalName, photo.file);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${zipName}.zip`);
};