/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import path from 'path';
import { loadSchemas } from "./basic";
import { gen as genTypes } from "./types";
import { gen as genClass } from "./class";
import { gen as genExp } from "./export";
import { gen as genImp } from "./import";

import { inject as importInject } from "./import-inject";
import { inject as exportInject } from "./export-inject";

/**
 * 代码生成配置接口
 */
interface GenerationConfig {
    /** Schema文件目录 */
    schemaDir: string;
    /** 输出目录 */
    outputDir: string;
    /** 基础类配置 */
    baseClass: {
        extends?: string;
        array?: string;
        map?: string;
    };
    /** 额外的生成顺序 */
    extraOrder?: string[];
    /** 额外的导入语句 */
    extraImports?: string[];
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: GenerationConfig = {
    schemaDir: './src/schema/',
    outputDir: './src/data/',
    baseClass: {
        extends: "",
        array: "Array",
        map: "Map"
    },
    extraOrder: [],
    extraImports: []
};

// 执行代码生成（使用当前项目的配置）
const projectConfig: Partial<GenerationConfig> = {
    schemaDir: './src/schema/',
    outputDir: './src/data/',
    baseClass: {
        extends: "Basic",
        array: "BasicArray",
        map: "BasicMap"
    },
    extraOrder: ['GroupShape'],
    extraImports: ['import { Basic, BasicArray, BasicMap } from "./basic"']
};

/**
 * 生成所有代码文件
 */
function generateAll(config: Partial<GenerationConfig> = {}): void {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    console.log('📝 开始生成代码...');
    console.log(`📂 Schema目录: ${finalConfig.schemaDir}`);
    console.log(`📂 输出目录: ${finalConfig.outputDir}`);

    try {
        // 加载所有schema文件
        const allNodes = loadSchemas(path.resolve(finalConfig.schemaDir));
        console.log(`✅ 成功加载 ${allNodes.size} 个Schema文件`);

        // 构建输出路径
        const outputPaths = {
            types: path.resolve(finalConfig.outputDir, 'typesdefine.ts'),
            classes: path.resolve(finalConfig.outputDir, 'baseclasses.ts'),
            export: path.resolve(finalConfig.outputDir, 'baseexport.ts'),
            import: path.resolve(finalConfig.outputDir, 'baseimport.ts')
        };

        // 生成类型定义
        console.log('🔧 生成类型定义...');
        genTypes(allNodes, outputPaths.types);

        // 生成类定义
        console.log('🔧 生成类定义...');
        genClass(allNodes, outputPaths.classes, {
            extraHeader(writer) {
                writer.nl('import { Basic, BasicArray, BasicMap } from "./basic"');
            },
            typesPath: "./typesdefine",
            extraOrder: finalConfig.extraOrder,
            baseClass: {
                array: 'BasicArray',
                map: 'BasicMap',
                extends: 'Basic'
            }
        });

        // 生成导出文件
        console.log('🔧 生成导出文件...');
        genExp(allNodes, {
            outputPath: outputPaths.export,
            inject: exportInject,
            extraHeader(writer) {
                writer.nl('import * as types from "./typesdefine"');
            },
            namespaces: {
                types: 'types.'
            },
            contextContent(writer) {
                writer.nl('symbols?: Set<string>');
                writer.nl('medias?: Set<string>');
                writer.nl('refsymbols?: Set<string>');
                writer.nl('styles?: Set<string>');
            }
        });

        // 生成导入文件
        console.log('🔧 生成导入文件...');
        genImp(allNodes, outputPaths.import, {
            baseTypes: {
                array: 'BasicArray',
                map: 'BasicMap'
            },
            namespaces: {
                impl: 'impl.',
                types: 'types.',
                extends: 'Basic'
            },
            extraHeader(writer) {
                writer.nl('import * as impl from "./classes"')
                writer.nl('import * as types from "./typesdefine"')
                writer.nl('import { BasicArray, BasicMap } from "./basic"');
            },
            inject: importInject,
            contextContent(writer) {
                writer.nl(`document: impl.Document`);
                writer.nl('fmtVer: string');
            }
        });

        console.log('🎉 代码生成完成！');

    } catch (error) {
        console.error('❌ 代码生成失败:', (error as Error).message);
        if (error instanceof Error && error.stack) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}


generateAll(projectConfig);

export { generateAll, GenerationConfig, DEFAULT_CONFIG };