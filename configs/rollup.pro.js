import baseConfig from './rollup.base';
import sizes from 'rollup-plugin-sizes';
import { terser } from 'rollup-plugin-terser';
import { browser, main, module as packageModule } from '../package.json';

const output = [];

if (main) {
  output.push({
    sourcemap: true,
    file: main,
    format: 'cjs'
  })
}

if (browser) {
  output.push({
    sourcemap: true,
    file: browser,
    format: 'umd',
    name: 'bundle'
  })
}

if (packageModule) {
  output.push({
    sourcemap: true,
    file: packageModule,
    format: 'esm',
  })
}

export default {
  ...baseConfig,
  output,
  plugins: [
    ...baseConfig.plugins,
    sizes(),
    terser()
  ]
};