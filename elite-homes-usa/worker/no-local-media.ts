import type { MediaDriver } from '../lib/media-context.ts';

function unavailable(): never { throw new Error('The private file storage binding is unavailable.'); }
export const localMedia: MediaDriver = { put: unavailable, get: unavailable, remove: unavailable };
