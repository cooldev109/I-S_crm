import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1995,
    // Fail loudly if the port is taken — silently falling back to a different
    // port previously caused a subtle CORS mismatch with the backend.
    strictPort: true,
  },
});
