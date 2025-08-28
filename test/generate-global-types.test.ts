import { generateGlobalTypes } from '../src/generate-types';
import fs from 'fs';
import path from 'path';

describe('generateGlobalTypes', () => {
  const testOutput = path.resolve(__dirname, 'global.d.ts');
  afterEach(() => {
    if (fs.existsSync(testOutput)) fs.unlinkSync(testOutput);
  });

  it('should generate global types from a single file', () => {
    const inputFile = path.resolve(__dirname, 'example-types.ts');
    fs.writeFileSync(
      inputFile,
      'export type Foo<T = any> = T\nexport interface Bar { baz: string }'
    );

    generateGlobalTypes({
      inputs: [inputFile],
      outputs: [testOutput],
    });

    const output = fs.readFileSync(testOutput, 'utf-8');
    expect(output).toContain('type Foo');
    expect(output).toContain('interface Bar');

    fs.unlinkSync(inputFile);
  });
});
