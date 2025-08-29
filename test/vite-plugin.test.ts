import { describe, it, expect, vi } from 'vitest';
import vitePluginGlobalTypes from '../src/index';
import * as generateTypes from '../src/generate-types';
import type { Plugin, ViteDevServer } from 'vite';

vi.mock('../src/generate-types', async () => {
  const actual = await vi.importActual('../src/generate-types');
  return {
    ...actual,
    generateGlobalTypes: vi.fn(),
  };
});

describe('vite-plugin-global-types', () => {
  it('should call generateGlobalTypes on buildStart', () => {
    const options = {
      inputs: ['input.ts'],
      outputs: ['output.d.ts'],
    };
    const plugin = vitePluginGlobalTypes(options) as Plugin;
    (plugin.buildStart as Function)();
    expect(generateTypes.generateGlobalTypes).toHaveBeenCalledWith(options);
  });

  it('should call generateGlobalTypes on file change', () => {
    const options = {
      inputs: ['input.ts'],
      outputs: ['output.d.ts'],
    };
    const plugin = vitePluginGlobalTypes(options) as Plugin;
    const server = {
      watcher: {
        on: vi.fn(),
      },
    } as unknown as ViteDevServer;
    (plugin.configureServer as Function)(server);

    const [event, callback] = (server.watcher.on as any).mock.calls[0];
    expect(event).toBe('change');
    callback();
    expect(generateTypes.generateGlobalTypes).toHaveBeenCalledWith(options);
  });
});
