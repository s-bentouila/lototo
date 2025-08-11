import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createServer as createViteServer } from 'vite';
import { serveStatic } from '@hono/node-server/serve-static';
import api from './src/backend/api';

const port = 5173;
const app = new Hono();

(async () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Setting up Vite middleware for development...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: '.',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware is ready.');
  } else {
    app.use('/*', serveStatic({ root: './dist' }));
    app.use('/assets/*', serveStatic({ root: './dist/assets' }));
    console.log('Serving static files for production.');
  }

  // API routes
  app.route('/api', api);

  console.log(`Server will run on http://localhost:${port}`);

  serve({
    fetch: app.fetch,
    port: port,
  }, (info) => {
    console.log(`Server is running at ${info.address}:${info.port}`);
  });
})();
