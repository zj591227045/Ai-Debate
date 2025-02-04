const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser.js'),
    vm: require.resolve('vm-browserify'),
  };

  config.plugins = config.plugins.filter(plugin => 
    !(plugin instanceof webpack.DefinePlugin)
  );

  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    })
  );

  config.resolve.extensions = [...config.resolve.extensions, '.ts', '.tsx'];
  config.resolve.mainFields = ['browser', 'module', 'main'];

  config.module.rules = config.module.rules.map(rule => {
    if (rule.oneOf) {
      rule.oneOf.forEach(oneOf => {
        if (oneOf.test && oneOf.test.toString().includes('tsx?$')) {
          oneOf.include = [/src/];
          oneOf.exclude = /node_modules/;
        }
      });
    }
    return rule;
  });

  return config;
}; 