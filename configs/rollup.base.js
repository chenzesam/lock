import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import ts from 'rollup-plugin-typescript2';
import external from 'rollup-plugin-peer-deps-external';
import pkg from '../package.json';

const output = [];

if (pkg.main) {
  output.push({
    sourcemap: true,
    file: pkg.main,
    format: 'cjs',
  });
}

if (pkg.browser) {
  output.push({
    sourcemap: true,
    file: pkg.browser,
    format: 'umd',
    name: 'bundle',
  });
}

if (pkg.module) {
  output.push({
    sourcemap: true,
    file: pkg.module,
    format: 'esm',
  });
}

export default {
  input: 'src/index.ts',
  output,
  plugins: [
    commonjs(),
    resolve(),
    external(),
    ts({
      useTsconfigDeclarationDir: true,
    }),
  ],
};
