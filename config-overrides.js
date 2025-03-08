const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
  // Node.jsのコアモジュールのポリフィルを追加
  (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "util": require.resolve("util/"),
      "assert": require.resolve("assert/"),
      "os": require.resolve("os-browserify/browser"),
      "process": require.resolve("process/browser"),
      "path": require.resolve("path-browserify"),
      "fs": false,
      "net": false,
      "tls": false,
      "zlib": false,
    };
    return config;
  },
  // ProvidePluginを追加してBufferとprocessをグローバルに提供
  addWebpackPlugin(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    })
  )
); 