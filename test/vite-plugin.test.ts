import type { Plugin, ViteDevServer } from 'vite';
import { describe, it, expect, vi } from 'vitest';

import * as generateTypes from '../src/generate-types';
import vitePluginGlobalTypes from '../src/index';

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

  it('should log instead of throwing when regeneration fails on change', () => {
    vi.mocked(generateTypes.generateGlobalTypes).mockImplementationOnce(() => {
      throw new Error('No input files found');
    });
    const plugin = vitePluginGlobalTypes({
      inputs: ['input.ts'],
      outputs: ['output.d.ts'],
    }) as Plugin;
    const error = vi.fn();
    const server = {
      watcher: { on: vi.fn() },
      config: { logger: { error } },
    } as unknown as ViteDevServer;
    (plugin.configureServer as Function)(server);

    const [, callback] = (server.watcher.on as any).mock.calls[0];
    expect(() => callback()).not.toThrow();
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][1].error.message).toContain(
      'No input files found',
    );
  });
});
