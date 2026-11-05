// Las fotos se achican en el navegador antes de subirlas: el lado mayor queda en 1600 px y se guardan en JPEG.
// Así una foto de celular de 4 MB queda en unos 400 KB y la publicación carga rápido.
export const MAX_PHOTOS = 8;
export const ACCEPTED_PHOTOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIDE = 1600;

export const preparePhoto = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sin-canvas');
  // Fondo blanco para los PNG con transparencia, que en JPEG saldrían negros
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('sin-foto'))), 'image/jpeg', 0.85);
  });
};
