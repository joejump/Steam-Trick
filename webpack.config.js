const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;

const staticFiles = [
    {
        from: 'html/**/*'
    },
    {
        from: 'css/**/*'
    },
    {
        from: 'img/**/*'
    },
    {
        from: 'audio/**/*'
    },
    {
        from: '_locales/**/*'
    },
    {
        from: 'manifest.json'
    },
    {
        from: '../node_modules/jquery/dist/jquery.min.js',
        to: 'js'
    }
];


const DIST_FOLDER = 'dist';

module.exports = () => {
    const staticFilesPath = staticFiles.map(i => ({ context: './src/', ...i }));

    return {
        devtool: 'source-map',
        entry: {
            'js/popup': './src/js/popup',
            'js/background': './src/js/background',
            'js/options': './src/js/options'
        },
        externals: {
            jquery: 'jQuery'
        },
        output: {
            path: path.join(__dirname, DIST_FOLDER),
            filename: '[name].js'
        },

        plugins: [
            new CopyWebpackPlugin(staticFilesPath)
        ],
        optimization: {
            concatenateModules: true,
            minimizer: [
                new UglifyJSPlugin(),
                new ImageminPlugin({
                    pngquant: {
                        quality: '95-100'
                    }
                })
            ]
        }
    };
};
