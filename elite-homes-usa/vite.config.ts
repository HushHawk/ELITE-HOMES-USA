import { cloudflare } from '@cloudflare/vite-plugin';
import { fileURLToPath } from 'node:url';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import { sites } from './scripts/vite/sites-vite-plugin.ts';

export default defineConfig({
  resolve: { alias: [{ find: /^\.\/local-db\.ts$/, replacement: fileURLToPath(new URL('./worker/no-local-db.ts', import.meta.url)) }, { find: /^\.\/local-media\.ts$/, replacement: fileURLToPath(new URL('./worker/no-local-media.ts', import.meta.url)) }] },
  plugins: [
    vinext(),
    sites({ mockAuth: false }),
    cloudflare({
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
      inspectorPort: false,
      config: {
        name: 'elite-homes-usa',
        main: './worker/index.ts',
        compatibility_date: '2026-06-01',
        compatibility_flags: ['nodejs_compat'],
        d1_databases: [{ binding: 'DB', database_name: 'elite-inbox', database_id: '00000000-0000-4000-8000-000000000000' }],
        r2_buckets: [{ binding: 'BUCKET', bucket_name: 'elite-private-media' }],
      },
    }),
  ],
});
