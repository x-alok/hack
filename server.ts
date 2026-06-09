/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/routes/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads serving for PPTs, PDFs, and Screenshots
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Connect local REST endpoints
  app.use('/api', apiRouter);

  // Health endpoint
  app.get('/api-health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Enable Vite middleware in development; serve unified index.html in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server mounted.');
  } else {
    // Serve client static dist bundle
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static asset router enabled.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running and bound on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Critical shutdown - Server container failed to start:', err);
});
