import fs from 'fs';
import path from 'path';

import { describe, it, expect, afterEach } from 'vitest';

import { findFiles, generateGlobalTypes } from '../src/generate-types';

const testOutputDir = path.resolve('./test/output');

function cleanup() {
  if (fs.existsSync(testOutputDir)) {
    fs.rmSync(testOutputDir, { recursive: true, force: true });
  }
}

afterEach(() => {
  cleanup();
});

describe('generateGlobalTypes', () => {
  it('should generate a global.d.ts file from a single input file', () => {
    const outputFile = path.join(testOutputDir, 'global.d.ts');
    generateGlobalTypes({
      inputs: [path.resolve('./test/test-files/types1.ts')],
      outputs: [outputFile],
    });

    expect(fs.existsSync(outputFile)).toBe(true);
    const content = fs.readFileSync(outputFile, 'utf-8');
    expect(content).toContain('type MyType = TestFilesTypes1Types.MyType');
    expect(content).toContain(
      'interface MyInterface extends TestFilesTypes1Types.MyInterface {}',
    );
  });

  it('should generate a global.d.ts file from multiple input files', () => {
    const outputFile = path.join(testOutputDir, 'global.d.ts');
    generateGlobalTypes({
      inputs: [
        path.resolve('./test/test-files/types1.ts'),
        path.resolve('./test/test-files/types2.ts'),
      ],
      outputs: [outputFile],
    });

    const content = fs.readFileSync(outputFile, 'utf-8');
    expect(content).toContain('type MyType = TestFilesTypes1Types.MyType');
    expect(content).toContain(
      'interface MyInterface extends TestFilesTypes1Types.MyInterface {}',
    );
    expect(content).toContain(
      'type GenericType<T> = TestFilesTypes2Types.GenericType<T>',
    );
    expect(content).toContain(
      'interface GenericInterface<T, U> extends TestFilesTypes2Types.GenericInterface<T, U> {}',
    );
  });

  it('should generate a global.d.ts file from a directory', () => {
    const outputFile = path.join(testOutputDir, 'global.d.ts');
    generateGlobalTypes({
      inputs: [path.resolve('./test/test-files')],
      outputs: [outputFile],
    });

    const content = fs.readFileSync(outputFile, 'utf-8');
    expect(content).toContain('type MyType = TestFilesTypes1Types.MyType');
    expect(content).toContain(
      'type GenericType<T> = TestFilesTypes2Types.GenericType<T>',
    );
    expect(content).toContain(
      'type AnotherType = TestFilesMoreTypesTypes3Types.AnotherType',
    );
  });

  it('should handle custom import aliases', () => {
    const outputFile = path.join(testOutputDir, 'global.d.ts');
    generateGlobalTypes({
      inputs: [
        {
          path: path.resolve('./test/test-files/types1.ts'),
          importAs: '@/types1',
        },
      ],
      outputs: [outputFile],
    });

    const content = fs.readFileSync(outputFile, 'utf-8');
    expect(content).toContain(
      "import * as TestFilesTypes1Types from '@/types1'",
    );
  });

  it('should keep the import relative when the input sits next to the output', () => {
    // Regression: path.relative returns "types1" here, and a bare specifier
    // resolves as a package name rather than as a sibling file.
    const inputDir = path.resolve('./test/test-files');
    const outputFile = path.join(inputDir, 'global.d.ts');
    try {
      generateGlobalTypes({
        inputs: [path.join(inputDir, 'types1.ts')],
        outputs: [outputFile],
      });

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain("import * as Types1Types from './types1'");
    } finally {
      fs.rmSync(outputFile, { force: true });
    }
  });

  it('should throw error if no inputs found', () => {
    const outputFile = path.join(testOutputDir, 'global.d.ts');
    expect(() =>
      generateGlobalTypes({
        inputs: ['non-existent-file.ts'],
        outputs: [outputFile],
      }),
    ).toThrow('No input files found');
  });

  it('should handle files with only interfaces', () => {
    const outputFile = path.join(testOutputDir, 'global.d.ts');
    generateGlobalTypes({
      inputs: [path.resolve('./test/test-files/interface-only.ts')],
      outputs: [outputFile],
    });

    const content = fs.readFileSync(outputFile, 'utf-8');
    expect(content).toContain(
      'interface InterfaceOnly extends TestFilesInterfaceOnlyTypes.InterfaceOnly {}',
    );
    const typeDeclarations = content.match(/type\s+\w+\s*=/g);
    expect(typeDeclarations).toBeNull();
  });

  it('should handle empty files', () => {
    const outputFile = path.join(testOutputDir, 'global.d.ts');
    generateGlobalTypes({
      inputs: [path.resolve('./test/test-files/empty.ts')],
      outputs: [outputFile],
    });

    const content = fs.readFileSync(outputFile, 'utf-8');
    const globalDeclarations = content.match(/declare global {([^}]*)}/);
    expect(globalDeclarations && globalDeclarations[1].trim()).toBe('');
  });

  describe('import path escaping', () => {
    it('should escape quotes, backslashes and line breaks in importAs', () => {
      const outputFile = path.join(testOutputDir, 'global.d.ts');
      generateGlobalTypes({
        inputs: [
          {
            path: path.resolve('./test/test-files/types1.ts'),
            importAs: "a'b\\c\nd",
          },
        ],
        outputs: [outputFile],
      });

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain("from 'a\\'b\\\\c\\nd'");
      const importLines = content
        .split('\n')
        .filter((line) => line.startsWith('import '));
      expect(importLines).toHaveLength(1);
    });

    it('should prefix the alias with an underscore when it starts with a digit', () => {
      const inputDir = path.join(testOutputDir, '2fa');
      fs.mkdirSync(inputDir, { recursive: true });
      fs.writeFileSync(path.join(inputDir, 'user.ts'), 'export type U = 1\n');
      const outputFile = path.join(testOutputDir, 'out', 'global.d.ts');
      generateGlobalTypes({ inputs: [inputDir], outputs: [outputFile] });

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('import * as _2faUserTypes from');
      expect(content).toContain('type U = _2faUserTypes.U');
    });
  });

  describe('file discovery', () => {
    function seedTree() {
      const root = path.join(testOutputDir, 'tree');
      const files = [
        'a.ts',
        'b.mts',
        'c.cts',
        'd.tsx',
        'f.vue',
        'notes.txt',
        'logo.png',
        'node_modules/dep/index.ts',
        '.git/hooks/hook.ts',
        'nested/e.ts',
      ];
      for (const file of files) {
        const full = path.join(root, file);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, 'export type T = 1\n');
      }
      return root;
    }

    it('should only scan TypeScript files and skip node_modules and .git by default', () => {
      const root = seedTree();
      const found = findFiles(root)
        .map((f) => path.relative(root, f))
        .sort();
      expect(found).toEqual([
        'a.ts',
        'b.mts',
        'c.cts',
        'd.tsx',
        'f.vue',
        'nested/e.ts',
      ]);
    });

    it('should still honour an explicit filePattern and excludeDirs', () => {
      const root = seedTree();
      const found = findFiles(root, {
        filePattern: /\.txt$/,
        excludeDirs: ['nested'],
      }).map((f) => path.relative(root, f));
      expect(found).toEqual(['notes.txt']);
    });

    it('should let excludeDirs replace the default exclusions', () => {
      const root = seedTree();
      const found = findFiles(root, { excludeDirs: ['nested'] })
        .map((f) => path.relative(root, f))
        .sort();
      expect(found).toEqual([
        '.git/hooks/hook.ts',
        'a.ts',
        'b.mts',
        'c.cts',
        'd.tsx',
        'f.vue',
        'node_modules/dep/index.ts',
      ]);
    });

    it('should not be fooled by the lastIndex state of a global RegExp', () => {
      const root = seedTree();
      const found = findFiles(root, { filePattern: /\.ts$/g }).map((f) =>
        path.relative(root, f),
      );
      expect(found.sort()).toEqual(['a.ts', 'nested/e.ts']);
      const stable = findFiles(root, { filePattern: /^[a-e]\.ts$/g });
      expect(stable).toHaveLength(2);
    });
  });

  describe('input matching', () => {
    it('should not apply importAs to a sibling directory sharing a name prefix', () => {
      const types = path.join(testOutputDir, 'src', 'types');
      const internal = path.join(testOutputDir, 'src', 'types-internal');
      fs.mkdirSync(types, { recursive: true });
      fs.mkdirSync(internal, { recursive: true });
      fs.writeFileSync(path.join(types, 'a.ts'), 'export type A = 1\n');
      fs.writeFileSync(path.join(internal, 'b.ts'), 'export type B = 1\n');
      const outputFile = path.join(testOutputDir, 'out', 'global.d.ts');
      generateGlobalTypes({
        inputs: [{ path: types, importAs: '@/types' }, internal],
        outputs: [outputFile],
      });

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content.match(/from '@\/types'/g)).toHaveLength(1);
      expect(content).toContain("from '../src/types-internal/b'");
    });
  });
});
