const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { merge } = require('webpack-merge')

const target = process.env.TARGET || 'chrome'
console.log(`build target: ${target}`)
const rootDir = path.resolve(__dirname)
const srcDir = path.join(rootDir, 'src')
const destDir = path.join(rootDir, 'build', target)

console.log('srcDir', srcDir)

const common = {
  entry: {
    content_script: path.join(srcDir, 'content_script.ts'),
  },
  output: {
    path: destDir,
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [new TsconfigPathsPlugin()],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.join(rootDir, 'public'), to: destDir },
        target === 'firefox' ? { from: path.join(rootDir, 'firefox/public'), to: destDir } : null,
      ].filter(Boolean),
    }),
  ],
}


function developmentConfig() {
  console.log('development config')
  const config = merge(common, {
    // `eval` could not be used, see https://stackoverflow.com/questions/48047150/chrome-extension-compiled-by-webpack-throws-unsafe-eval-error
    // devtool: 'cheap-module-source-map',
    devtool: false,
    mode: 'development',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      }),
    ],
  })

  if (process.env.MEASURE_SPEED) {
    const SpeedMeasurePlugin = require("speed-measure-webpack-plugin")
    const smp = new SpeedMeasurePlugin()
    config = smp.wrap(config)
  }
  return config
}


function productionConfig() {
  console.log('production config')
  const config = merge(common, {
    mode: 'production',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.APP_ENV': JSON.stringify(process.env.APP_ENV),
      }),
    ],
  })
  return config
}


module.exports = process.env.NODE_ENV === 'production' ? productionConfig() : developmentConfig()
