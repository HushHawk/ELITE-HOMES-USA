'use client';

import { MAX_PHOTO_BYTES } from './market-schema';

export async function preparePhoto(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 18_000_000) {
    throw new Error('Choose a JPG, PNG or WebP photo under 18 MB.');
  }
  let image: ImageBitmap;
  try { image = await createImageBitmap(file); }
  catch { throw new Error('A photo could not be opened. Try a different file.'); }
  try {
    const scale = Math.min(1, 1920 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare the photo.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [.87, .73, .58]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality));
      if (blob?.type === 'image/webp' && blob.size <= MAX_PHOTO_BYTES) return new File([blob], 'property.webp', { type: blob.type });
    }
    throw new Error('This photo could not be compressed. Choose a smaller image.');
  } finally { image.close(); }
}
