import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devApiTarget = env.VITE_DEV_PROXY_API_TARGET || 'http://localhost:8080';
  const devWsTarget = env.VITE_DEV_PROXY_WS_TARGET || 'http://localhost:8080';

  const proxy = {
    '/api': {
      target: devApiTarget,
      changeOrigin: true,
    },
    '/ws': {
      target: devWsTarget,
      ws: true,
      changeOrigin: true,
    },
  };

  return {
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: { overlay: false },
    proxy,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui:     ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          maps:   ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
  };
});
