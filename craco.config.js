const path = require('path');
const webpack = require('webpack');

module.exports = {
  babel: {
    plugins: ['@emotion/babel-plugin']
  },
  webpack: {
    alias: {
      '@state': path.resolve(__dirname, 'src/modules/state')
    },
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
        "crypto": require.resolve("crypto-browserify"),
        "process": require.resolve("process/browser"),
        "vm": require.resolve("vm-browserify")
      };
      
      webpackConfig.module.rules.push({
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      });
      
      return webpackConfig;
    },
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
      ]
    }
  }
}; 