const path = require('path');

module.exports = {
    mode: 'development',
    entry: './vue.js',
    output: {
        filename: 'vue.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'var',
        library: 'Vue'
    },
    devtool: 'cheap-source-map'
}