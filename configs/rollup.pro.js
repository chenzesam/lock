import sizes from 'rollup-plugin-sizes';
import { terser } from 'rollup-plugin-terser';
import baseConfig from './rollup.base';


export default {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    terser(),
    sizes(),
  ],
};
