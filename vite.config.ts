import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  // server: {
  //   host: 'ashish',   // <-- custom hostname (must be resolvable via /etc/hosts or DNS)
  //   port: 5173,       // <-- custom port
  //   strictPort: true, // fail if the port is taken
  // },
  // npm run dev -- --port 3001 // Without changing the config, you can override the port temporarily:
})
