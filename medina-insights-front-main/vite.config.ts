import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost", // שינוי ל-localhost ליתר ביטחון
    port: 8080, // נשאיר את הפורט שלך אם נוח לך, אבל נוודא שזה עובד
    proxy: {
      '/api': {
        target: 'http://localhost:7071', // הכתובת של הפייתון
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));