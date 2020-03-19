import baseConfig from './rollup.base';
import serve from 'rollup-plugin-serve';
import { eslint } from 'rollup-plugin-eslint';
import ts from "rollup-plugin-typescript2";
import livereload from 'rollup-plugin-livereload'

export default {
  ...baseConfig,
  output: {
    sourcemap: true,
    file: 'example/index.js',
    format: 'umd',
    name: 'Lock'
  },
  plugins: [
    ...baseConfig.plugins,
    eslint(),
    ts(),
    serve({
      open: true,
      port: 8008,
      historyApiFallback: '/example.html',
      contentBase: ['example']
    }),
    livereload('example')
  ]
};