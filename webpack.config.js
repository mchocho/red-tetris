// webpack.config.js
const webpack = require('webpack');
const path = require('path');

module.exports = {
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.join(__dirname, '/public'),
        publicPath: './build'
    },
    entry: {
        app: ['./src/client/App.js']
    },
    output: {
        path: path.join(__dirname, '/build'),
        publicPath: '/build/',
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['*', '.js', '.jsx'],
        alias: {
             '@': path.resolve(__dirname, 'src')
         }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                loaders: ['css-loader']
            }
        ]
    }
}