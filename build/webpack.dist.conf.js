/**
 * Created by qhyang on 2018/5/11.
 */

'use strict';

const path = require('path');

const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');

const rootDir = path.resolve(__dirname, '..');

module.exports = {
    mode: 'production',
    entry: {
        app: [ path.resolve(rootDir, 'src', 'app', 'main') ]
    },
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js',
        path: path.resolve(rootDir, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loaders: [{
                    loader: 'ts-loader',
                    options: { appendTsSuffixTo: [/\.vue$/] }
                }, 'tslint-loader']
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: [
                    path.resolve(rootDir, 'node_modules', 'three-audio-visualization')
                ]
            },
            {
                test: /\.scss$/,
                loaders: [ 'style-loader', 'css-loader', 'sass-loader' ],
                exclude: /node_modules/
            },
            {
                test: /\.pug$/,
                exclude: /node_modules/,
                loader: 'pug-plain-loader'
            },
            {
                test: /\.(?:ogg|mp3|svg|png|ico)$/,
                loader: 'url-loader?limit=8192'
            },
            {
                include: [
                    path.resolve(rootDir, 'node_modules', 'three-audio-visualization', 'src', 'vendors', 'physijs', 'physijs_worker.js'),
                    path.resolve(rootDir, 'node_modules', 'ammo.js')
                ],
                loader: 'url-loader?limit=8192'
            },
            {
                test: /\.less$/,
                loader: [ 'style-loader', 'css-loader', 'less-loader' ]
            },
            {
                test: /\.css$/,
                loader: [ 'style-loader', 'css-loader' ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            inject: 'body',
            template: path.resolve(rootDir, 'src', 'index.html'),
            chunks: [ 'app', 'runtime' ]
        }),
        new VueLoaderPlugin(),
        new UglifyJSPlugin(),
        new ServiceWorkerWebpackPlugin({
            entry: path.join(rootDir, 'src', "app", 'sw'),
        })
    ],
    optimization: {
        runtimeChunk: {
            name: 'runtime'
        }
    },
    resolve: {
        extensions: [ '.vue', '.ts', '.scss', '.json', '.less', '.js', '.css' ]
    }
};
