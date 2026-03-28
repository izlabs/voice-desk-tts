import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function listModelsFromDirectory(modelsDir) {
  if (!fs.existsSync(modelsDir)) {
    return [];
  }

  return fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith('.onnx.json'))
    .map((file) => file.replace('.onnx.json', ''))
    .filter(Boolean)
    .sort();
}

export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'onnx-wasm-plugin',
      configureServer(server) {
        server.middlewares.use('/api', async (req, res, next) => {
          const url = req.url || '';

          if (url === '/models' || url === '/models/') {
            try {
              const modelsDir = path.join(__dirname, 'public', 'tts-model', 'vi');
              const models = listModelsFromDirectory(modelsDir);
              res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ models }));
            } catch (error) {
              console.error('Error listing local models:', error);
              res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ error: 'Failed to list models', message: error.message }));
            }
            return;
          }

          const piperModelsMatch = url.match(/^\/piper\/([^/]+)\/models\/?$/);
          if (piperModelsMatch) {
            try {
              const lang = piperModelsMatch[1];
              const modelsDir = path.join(__dirname, 'public', 'tts-model', lang);
              const models = listModelsFromDirectory(modelsDir);
              res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ models }));
            } catch (error) {
              console.error('Error listing piper lang models:', error);
              res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ error: 'Failed to list models', message: error.message }));
            }
            return;
          }

          const modelMatch = url.match(/^\/model\/(.+)$/);
          if (modelMatch) {
            try {
              const fileName = decodeURIComponent(modelMatch[1]);
              const modelsDir = path.join(__dirname, 'public', 'tts-model', 'vi');
              const filePath = path.join(modelsDir, fileName);
              const resolvedPath = path.resolve(filePath);
              const resolvedDir = path.resolve(modelsDir);

              if (!resolvedPath.startsWith(resolvedDir)) {
                res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: 'Access denied' }));
                return;
              }

              if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: 'Model file not found' }));
                return;
              }

              let contentType = 'application/octet-stream';
              if (fileName.endsWith('.json')) {
                contentType = 'application/json';
              }

              const fileStats = fs.statSync(filePath);
              const fileContent = fs.readFileSync(filePath);

              res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': fileStats.size.toString(),
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000, immutable',
              });
              res.end(fileContent);
            } catch (error) {
              console.error('Error serving model file:', error);
              res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ error: 'Failed to serve model file', message: error.message }));
            }
            return;
          }

          next();
        });

        server.middlewares.use('/onnx-runtime', (req, res, next) => {
          if (req.url.includes('?import')) {
            req.url = req.url.replace('?import', '');
          }
          if (req.url.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Access-Control-Allow-Origin', '*');
          }
          next();
        });

        server.middlewares.use('/tts-model', (req, res, next) => {
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
          res.setHeader('ETag', '"model-v1"');
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  worker: { format: 'es' },
  build: {
    target: 'esnext',
  },
  assetsInclude: ['**/*.wasm'],
  logLevel: 'info',
});
