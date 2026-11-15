import { AsyncLocalStorage } from 'node:async_hooks';

export type MediaRange = { offset: number; length: number };
export interface MediaDriver {
  put(id: string, bytes: Uint8Array): Promise<void>;
  get(id: string, range?: MediaRange): Promise<ReadableStream | null>;
  remove(id: string): Promise<void>;
}

export const requestMedia = new AsyncLocalStorage<MediaDriver>();
