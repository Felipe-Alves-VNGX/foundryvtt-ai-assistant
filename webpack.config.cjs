const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './scripts/main.js',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, '.'),
      clean: false,
      library: {
        type: 'module'
      }
    },
    experiments: {
      outputModule: true
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false,
              drop_debugger: true
            },
            mangle: {
              keep_classnames: true,
              keep_fnames: true
            },
            format: {
              comments: false
            }
          },
          extractComments: false
        })
      ]
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['last 2 Chrome versions', 'last 2 Firefox versions']
                  },
                  modules: false
                }]
              ]
            }
          }
        }
      ]
    },
    resolve: {
      extensions: ['.js'],
      alias: {
        '@': path.resolve(__dirname, 'scripts')
      }
    },
    externals: {
      // Foundry VTT globals
      'game': 'game',
      'ui': 'ui',
      'Hooks': 'Hooks',
      'ChatMessage': 'ChatMessage',
      'Actor': 'Actor',
      'Item': 'Item',
      'Scene': 'Scene',
      'JournalEntry': 'JournalEntry',
      'Macro': 'Macro',
      'RollTable': 'RollTable',
      'Playlist': 'Playlist',
      'Roll': 'Roll',
      'CONST': 'CONST'
    }
  };
};
