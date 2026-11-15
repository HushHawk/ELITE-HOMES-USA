import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import type { MediaDriver } from './media-context.ts';

const folder = () => resolve(/* turbopackIgnore: true */ process.env.ELITE_MEDIA_PATH || '.data/media');
const location = (id: string) => resolve(folder(), id);

export const localMedia: MediaDriver = {
  async put(id, bytes) {
    await mkdir(folder(), { recursive: true, mode: 0o700 });
    await writeFile(location(id), bytes, { flag: 'wx', mode: 0o600 });
  },
  async get(id, range) {
    const path = location(id);
    try { await access(path); } catch { return null; }
    const stream = createReadStream(path, range ? { start: range.offset, end: range.offset + range.length - 1 } : {});
    return Readable.toWeb(stream) as ReadableStream;
  },
  async remove(id) { await unlink(location(id)).catch(() => {}); },
};
