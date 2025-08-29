import { describe, it, expect } from 'vitest';
import {
  extractGenericNames,
  findFiles,
  generateAliasName,
} from '../src/generate-types';
import path from 'path';

describe('extractGenericNames', () => {
  it('should extract simple generic names', () => {
    expect(extractGenericNames('<T>')).toBe('<T>');
  });

  it('should extract multiple generic names', () => {
    expect(extractGenericNames('<T, U>')).toBe('<T, U>');
  });

  it('should handle generics with default values', () => {
    expect(extractGenericNames('<T = string, U = number>')).toBe('<T, U>');
  });

  it('should handle generics with extends', () => {
    expect(extractGenericNames('<T extends string, U extends number>')).toBe(
      '<T, U>'
    );
  });

  it('should handle complex generics', () => {
    expect(
      extractGenericNames('<T extends string = "foo", U extends number = 1>')
    ).toBe('<T, U>');
  });

  it('should return the same string if not a generic', () => {
    expect(extractGenericNames('T')).toBe('T');
  });
});

describe('findFiles', () => {
  it('should find all files in a directory', () => {
    const files = findFiles(path.resolve('./test/test-files'));
    expect(files).toHaveLength(5);
    expect(files).toEqual(
      expect.arrayContaining([
        path.resolve('./test/test-files/types1.ts'),
        path.resolve('./test/test-files/types2.ts'),
        path.resolve('./test/test-files/more-types/types3.ts'),
        path.resolve('./test/test-files/interface-only.ts'),
        path.resolve('./test/test-files/empty.ts'),
      ])
    );
  });

  it('should filter files by pattern', () => {
    const files = findFiles(path.resolve('./test/test-files'), {
      filePattern: /types1\.ts/,
    });
    expect(files).toHaveLength(1);
    expect(files[0]).toBe(path.resolve('./test/test-files/types1.ts'));
  });

  it('should exclude directories', () => {
    const files = findFiles(path.resolve('./test/test-files'), {
      excludeDirs: ['more-types'],
    });
    expect(files).toHaveLength(4);
    expect(files).toEqual(
      expect.arrayContaining([
        path.resolve('./test/test-files/types1.ts'),
        path.resolve('./test/test-files/types2.ts'),
        path.resolve('./test/test-files/interface-only.ts'),
        path.resolve('./test/test-files/empty.ts'),
      ])
    );
  });
});

describe('generateAliasName', () => {
  it('should generate an alias name from a file path', () => {
    const alias = generateAliasName(
      path.resolve('./test/test-files/types1.ts'),
      path.resolve('./output')
    );
    expect(alias).toBe('TestTestFilesTypes1Types');
  });

  it('should generate an alias name from a nested file path', () => {
    const alias = generateAliasName(
      path.resolve('./test/test-files/more-types/types3.ts'),
      path.resolve('./output')
    );
    expect(alias).toBe('TestTestFilesMoreTypesTypes3Types');
  });

  it('should handle file in root of output dir', () => {
    const alias = generateAliasName(
      path.resolve('./test/types1.ts'),
      path.resolve('./output')
    );
    expect(alias).toBe('TestTypes1Types');
  });

  it('should handle weird file names', () => {
    const alias = generateAliasName(
      path.resolve('./test/.ts'),
      path.resolve('./output')
    );
    expect(alias).toBe('TestTypes');
  });
  it('should handle parent directory files', () => {
    const alias = generateAliasName(
      path.resolve('../test/types.ts'),
      path.resolve('./output')
    );
    expect(alias).toBe('TestTypes');
  });
  it('should handle index files', () => {
    const alias = generateAliasName(
      path.resolve('./test/index.ts'),
      path.resolve('./output')
    );
    expect(alias).toBe('TestTypes');
  });
  it('should handle types files', () => {
    const alias = generateAliasName(
      path.resolve('./index.ts'),
      path.resolve('./output')
    );
    expect(alias).toBe('IndexTypes');
  });
});
