import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

const fetchUrlProxyPlugin = {
  name: 'fetch-url-proxy',
  configureServer(server: any) {
    server.middlewares.use('/api/fetch-url', async (req: any, res: any, next: any) => {
      try {
        const url = new URL(req.url ?? '/', 'http://localhost:3000');
        const targetUrl = url.searchParams.get('url');

        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Missing url query parameter.');
          return;
        }

        const upstream = await fetch(targetUrl, {
          headers: {
            Accept: 'text/html,application/xhtml+xml,text/plain,*/*;q=0.8',
            'User-Agent': 'OurWave-LocalProxy/1.0',
          },
          redirect: 'follow',
        });

        const contentType = upstream.headers.get('content-type') ?? 'text/html; charset=utf-8';
        const body = await upstream.text();

        res.statusCode = upstream.status;
        res.setHeader('Content-Type', contentType);
        res.end(body);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown fetch error';
        res.statusCode = 502;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(`Failed to fetch remote URL: ${message}`);
      }
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), fetchUrlProxyPlugin],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'], // ✅ include your setup file
    css: false, // ⬅ ignore css imports
    server: {
      deps: {
        inline: [
          '@mui/material',
          '@mui/system',
          '@mui/icons-material',
          '@mui/x-data-grid',
          '@mui/x-date-pickers',
        ],
      },
    }
  },
})
