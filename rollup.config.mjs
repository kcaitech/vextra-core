import typescript from '@rollup/plugin-typescript';
import {babel} from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
export default [{
    input: 'src/index.ts',
    output: [
        {
            dir: 'dist',
            format: 'es',
            entryFileNames: 'index.js'
        },
        {
            dir: 'dist',
            format: 'cjs',
            entryFileNames: 'index.cjs'
        }
    ],
    plugins: [
        json(),
        typescript(),
        babel({ babelHelpers: 'bundled' }),
        terser(),
    ],
    external: ['uuid', 'kiwi-schema', 'uzip']
}];
