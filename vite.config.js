import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  base: './', // 设置基础路径为相对路径
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 确保资源文件使用相对路径
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://opg.easyenjoy.world',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
