const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    overlay: './src/renderer/overlay/overlay.tsx',
    recorder: './src/renderer/recorder/index.ts',
    settings: './src/renderer/settings/settings.tsx'
  },
  target: 'electron-renderer',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: '[name]/[name].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/common': path.resolve(__dirname, 'src/common'),
      '@/renderer': path.resolve(__dirname, 'src/renderer')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              module: 'CommonJS',
              target: 'ES2020',
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
              jsx: 'react-jsx'
            }
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/overlay/index.html',
      filename: 'overlay/index.html',
      chunks: ['overlay']
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/recorder/index.html',
      filename: 'recorder/index.html',
      chunks: ['recorder']
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/settings/index.html',
      filename: 'settings/index.html',
      chunks: ['settings']
    })
  ]
}; 