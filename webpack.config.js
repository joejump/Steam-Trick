const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
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
    }
];


const DIST_FOLDER = 'dist';
const IS_PRODUCTION = process.env.NODE_ENV !== 'dev';
const POSSIBLE_BROWSERS = ['chrome', 'firefox'];

module.exports = (env) => {
    if (!env || !env.browser || !POSSIBLE_BROWSERS.includes(env.browser)) {
        throw new Error(`Please provide a browser! webpack --env.browser=BROWSER Possible values: ${POSSIBLE_BROWSERS.toString()}`);
    }

    const staticFilesPath = staticFiles.map(i => ({ context: './src/', ...i }));

    return {
        entry: {
            'js/popup': './src/js/popup',
            'js/background': './src/js/background',
            'js/options': './src/js/options'
        },
        output: {
            path: path.join(__dirname, DIST_FOLDER),
            filename: '[name].js'
        },
        devtool: 'source-map',
        plugins: [
            new CleanWebpackPlugin([DIST_FOLDER]),
            (IS_PRODUCTION && env.browser !== 'firefox') ? new UglifyJSPlugin({
                parallel: true
            }) : () => null,
            new CopyWebpackPlugin(staticFilesPath),
            new ImageminPlugin({
                disable: IS_PRODUCTION,
                pngquant: {
                    quality: '95-100'
                }
            })
        ]
    };
};
