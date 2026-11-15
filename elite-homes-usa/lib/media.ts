import { requestMedia } from './media-context.ts';
import { localMedia } from './local-media.ts';

export const mediaStore = () => requestMedia.getStore() ?? localMedia;

export async function limitedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  const advertised = Number(request.headers.get('content-length'));
  if (!reader || advertised > limit) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > limit) { await reader.cancel(); return null; }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  } catch { return null; }
}

const ascii = (bytes: Uint8Array, offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));

export function cleanPhoto(bytes: Uint8Array) {
  if (bytes.length < 25 || ascii(bytes, 0) !== 'RIFF' || ascii(bytes, 8) !== 'WEBP') return null;
  const input = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
  if (input.getUint32(4, true) !== bytes.length - 8) return null;
  const parts: Uint8Array[] = [];
  let image = false;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let width = 0;
  let height = 0;
  let offset = 12;
  for (; offset + 8 <= bytes.length;) {
    const label = ascii(bytes, offset);
    const size = input.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + size + size % 2;
    if (end > bytes.length || label === 'ANIM' || label === 'ANMF') return null;
    if (label === 'VP8X' && size === 10 && parts.length === 0) {
      if (bytes[start] & 0x02) return null;
      canvasWidth = (input.getUint32(start + 4, true) & 0xffffff) + 1;
      canvasHeight = (bytes[start + 7] | (bytes[start + 8] << 8) | (bytes[start + 9] << 16)) + 1;
      if (canvasWidth > 2500 || canvasHeight > 2500) return null;
      const copy = bytes.slice(offset, end);
      copy[8] &= 0x10;
      parts.push(copy);
    } else if (label === 'ALPH' && size && parts.length === 1 && !image) {
      parts.push(bytes.subarray(offset, end));
    } else if (!image && label === 'VP8 ' && size >= 10 && bytes[start + 3] === 0x9d && bytes[start + 4] === 0x01 && bytes[start + 5] === 0x2a) {
      width = input.getUint16(start + 6, true) & 0x3fff;
      height = input.getUint16(start + 8, true) & 0x3fff;
      image = true;
      parts.push(bytes.subarray(offset, end));
    } else if (!image && label === 'VP8L' && size >= 5 && bytes[start] === 0x2f) {
      const dimensions = input.getUint32(start + 1, true);
      width = (dimensions & 0x3fff) + 1;
      height = ((dimensions >>> 14) & 0x3fff) + 1;
      image = true;
      parts.push(bytes.subarray(offset, end));
    }
    offset = end;
  }
  if (offset !== bytes.length || !image || !width || !height || width > 2500 || height > 2500) return null;
  if (canvasWidth && (width !== canvasWidth || height !== canvasHeight)) return null;
  const output = new Uint8Array(12 + parts.reduce((size, part) => size + part.length, 0));
  output.set(bytes.subarray(0, 12));
  new DataView(output.buffer).setUint32(4, output.length - 8, true);
  offset = 12;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

export function videoMime(bytes: Uint8Array, contentType: string) {
  if (bytes.length < 24) return;
  if (contentType === 'video/mp4' && ascii(bytes, 4) === 'ftyp') return 'video/mp4';
  if (contentType === 'video/webm' && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return 'video/webm';
}
