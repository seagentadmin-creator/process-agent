const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    sidepanel: './src/sidepanel/index.tsx',
    'background/service-worker': './src/background/service-worker.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/sidepanel/index.html',
      filename: 'sidepanel/index.html',
      chunks: ['sidepanel'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
      ],
    }),
  ],
  optimization: {
    splitChunks: { chunks: 'all', name: 'vendor' },
  },
};
