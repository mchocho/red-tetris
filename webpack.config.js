// webpack.config.js
const webpack = require('webpack');
const path = require('path');

module.exports = {
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.join(__dirname, '/public'), // where dev server will look for static files, not compiled
        publicPath: './build' //relative path to output path where  devserver will look for compiled files
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
             '@': path.resolve(__dirname, 'src') // shortcut to reference src folder from anywhere
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
                // exclude: /node_modules/,
                loaders: ['css-loader']
            }
        ]
    }/*,
    plugins: [
        new webpack.optimize.UglifyJsPlugin()
    ]*/
}