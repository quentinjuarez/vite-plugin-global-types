import type { Plugin } from 'vite';

// Explicit .js extension: this package ships as ESM ("type": "module"), and
// Node's ESM resolver does not guess extensions for relative imports.
import { generateGlobalTypes, GenerateOptions } from './generate-types.js';

export default function vitePluginGlobalTypes(
  options: GenerateOptions,
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
