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
                finalConfig.extraImports?.forEach(importStatement => {
                    writer.nl(importStatement);
                });
            },
            typesPath: "./typesdefine",
            extraOrder: finalConfig.extraOrder,
            baseClass: {
                array: finalConfig.baseClass.array || 'Array',
                map: finalConfig.baseClass.map || 'Map',
                extends: finalConfig.baseClass.extends
            }
        });

        // 生成导出文件
        console.log('🔧 生成导出文件...');
        genExp(allNodes, outputPaths.export);

        // 生成导入文件
        console.log('🔧 生成导入文件...');
        genImp(allNodes, outputPaths.import);

        console.log('🎉 代码生成完成！');
        
    } catch (error) {
        console.error('❌ 代码生成失败:', (error as Error).message);
        if (error instanceof Error && error.stack) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

// 执行代码生成（使用当前项目的配置）
const projectConfig: Partial<GenerationConfig> = {
    schemaDir: './src/schema/',
    outputDir: './src/data/',
    extraOrder: ['GroupShape']
};

generateAll(projectConfig);

export { generateAll, GenerationConfig, DEFAULT_CONFIG };