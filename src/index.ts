import type { Plugin } from 'vite';
import { generateGlobalTypes, GenerateOptions } from './generate-types';

export default function vitePluginGlobalTypes(
  options: GenerateOptions
): Plugin {
  return {
    name: 'vite-plugin-global-types',
    apply: 'serve',
    configureServer(server) {
      server.watcher.on('change', () => {
        generateGlobalTypes(options);
      });
    },
    buildStart() {
      generateGlobalTypes(options);
    },
  };
}
