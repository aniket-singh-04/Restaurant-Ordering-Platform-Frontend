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
    // port: 3001,      // Change to your desired port
    // strictPort: true // Optional: fails if port is already in use0
    // or 
    // npm run dev -- --port 3001
  // }
})
