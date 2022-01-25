const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const htmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
    },
    resolve: {
        extensions: ['.js', '.vue', '.json', '.css', '.less'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        }
    },
    devtool: 'cheap-source-map',
    plugins: [
        new CleanWebpackPlugin(),
        new htmlWebpackPlugin({
            template: './index.html'
        })
    ]
}