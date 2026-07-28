import fs from 'fs';
import path from 'path';

import { describe, it, expect, afterEach } from 'vitest';

import { generateGlobalTypes } from '../src/generate-types';

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
});
