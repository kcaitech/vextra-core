import typescript from '@rollup/plugin-typescript';
import {babel} from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default [
    {
        input: 'src/index.ts',
        output: {
            dir: 'dist/browser',
            exports: 'auto', // 根据代码中的导出自动推断导出方式
            format: 'es',
            entryFileNames: 'index.js'
        },
        plugins: [
            terser(),
            babel({babelHelpers: 'bundled'}),
            typescript({
                tsconfig: './tsconfig.json',
                outDir: 'dist/browser',
                declarationDir: 'dist/browser/types',
            }),
            json(),
        ],
        external: ['uuid', 'kiwi-schema', 'uzip'],
    },
    {
        input: 'src/index.ts',
        output: {
            dir: 'dist/node',
            format: 'cjs',
            exports: 'auto',
            entryFileNames: 'index.js'
        },
        plugins: [
            terser(),
            babel({babelHelpers: 'bundled'}),
            typescript({
                tsconfig: './tsconfig.json',
                outDir: 'dist/node',
                declarationDir: 'dist/node/types',
            }),
            json(),
        ],
        external: ['uuid', 'kiwi-schema', 'uzip'],
    },
];