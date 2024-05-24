import typescript from '@rollup/plugin-typescript';
import { babel } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'es',
        entryFileNames: 'index.mjs'
    },
    plugins: [terser(), babel({ babelHelpers: 'bundled' }), typescript(), json()],
    external: ['uuid', 'kiwi-schema', 'uzip']
};