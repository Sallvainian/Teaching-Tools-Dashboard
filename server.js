import { handler } from './build/handler.js';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Serve static files from the build/client directory
app.use(express.static(join(__dirname, 'build/client')));

// Serve static files from the static directory
app.use(express.static(join(__dirname, 'static')));

// Let SvelteKit handle everything else
app.use(handler);

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});