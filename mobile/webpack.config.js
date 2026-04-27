const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (_, argv = {}) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    target: 'web',
    entry: path.resolve(__dirname, 'index.web.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      clean: true,
      publicPath: '/',
    },
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    resolve: {
      alias: {
        'react-native$': 'react-native-web',
      },
      extensions: [
        '.web.tsx',
        '.tsx',
        '.web.ts',
        '.ts',
        '.web.jsx',
        '.jsx',
        '.web.js',
        '.js',
        '.json',
      ],
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.[jt]sx?$/,
          exclude: modulePath =>
            /node_modules/.test(modulePath) &&
            !/node_modules[\\/](@expo[\\/]vector-icons|expo-font|expo-modules-core)/.test(
              modulePath
            ),
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              configFile: path.resolve(__dirname, 'babel.config.js'),
            },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|webp|svg|ttf|otf|woff2?|eot)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProduction),
        'process.env.EXPO_OS': JSON.stringify('web'),
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'web/index.html'),
      }),
    ],
    devServer: {
      host: '0.0.0.0',
      port: 8080,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.resolve(__dirname, 'web'),
      },
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    performance: {
      hints: false,
    },
  };
};
