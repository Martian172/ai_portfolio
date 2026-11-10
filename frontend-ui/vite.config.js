import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Adds a Content Security Policy to the production build only (the dev server's
// hot-reload needs inline scripts). The page may run only its own scripts and may
// talk only to GitHub's public API and the configured backend.
function contentSecurityPolicy(apiUrl) {
  let apiOrigin = '';
  try {
    apiOrigin = new URL(apiUrl).origin;
  } catch {
    /* no API URL configured */
  }
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src 'self' https://api.github.com ${apiOrigin}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    ],
  };
}

// Local backend that /api is forwarded to during `npm run dev` / `npm run preview`.
const LOCAL_API = { '/api': { target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000', changeOrigin: true } };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), contentSecurityPolicy(env.VITE_API_URL || '')],
    // Two pages: the portfolio (/) and the contact page (/contact/).
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          contact: fileURLToPath(new URL('./contact/index.html', import.meta.url)),
        },
      },
    },
    server: { host: '127.0.0.1', port: 5173, proxy: LOCAL_API },
    preview: { host: '127.0.0.1', port: 4173, proxy: LOCAL_API },
  };
});
