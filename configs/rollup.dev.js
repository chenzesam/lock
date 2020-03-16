import baseConfig from './rollup.base';
import serve from 'rollup-plugin-serve';
import html from '@rollup/plugin-html';
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
    // html(),
    serve({
      open: true,
      port: 8008,
      historyApiFallback: '/example.html',
      contentBase: ['example']
    }),
    livereload('example')
  ]
};