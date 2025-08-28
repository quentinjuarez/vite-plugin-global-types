import { defineConfig } from 'vite';
import vitePluginGlobalTypes from 'vite-plugin-global-types';
import path from 'path';

export default defineConfig({
  plugins: [
    vitePluginGlobalTypes({
      inputs: [path.resolve(__dirname, './src/types/index.ts')],
      outputs: [path.resolve(__dirname, './src/types/global.d.ts')],
    }),
  ],
});
