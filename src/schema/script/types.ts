/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Node, allDepsIsGen, toPascalCase, exportBaseProp } from "./basic";
import { Writer } from "./writer";

/**
 * 导出单个节点为TypeScript类型定义
 */
function exportNode(node: Node, writer: Writer): void {
    if (node.description) {
        writer.nl('/* ' + node.description + ' */');
    }

    if (node.value.type === 'enum') {
        const enumValues = node.value.enum;
        writer.nl('export enum ' + node.name + ' ').sub(() => {
            for (const enumValue of enumValues) {
                writer.nl(toPascalCase(enumValue) + ' = "' + enumValue + '",');
            }
        });
    } else if (node.value.type === 'array') {
        const item = node.value.item;
        const extendsClause = node.extend ? node.extend + ' & ' : '';
        writer.nl(`export type ${node.name} = ${extendsClause}Array<`);
        exportBaseProp(item, writer);
        writer.append('>');
    } else if (node.value.type === 'object') {
        const properties = node.value.props;
        const extendsClause = node.extend ? node.extend + ' & ' : '';
        
        if (properties.length > 0) {
            writer.nl(`export type ${node.name} = ${extendsClause}`).sub(() => {
                properties.forEach(prop => {
                    writer.newline();
                    writer.indent().append(prop.name + (prop.required ? ': ' : '?: '));
                    exportBaseProp(prop, writer);
                    writer.append(',');
                });
            });
        } else if (node.extend) {
            writer.nl(`export type ${node.name} = ${node.extend}`);
        } else {
            throw new Error(`Invalid object definition for node: ${node.name}`);
        }
    } else {
        // 使用never类型检查来确保所有情况都被处理
        const exhaustiveCheck: never = node.value;
        throw new Error(`Unsupported node value type: ${JSON.stringify(exhaustiveCheck)}`);
    }
}

/**
 * 生成所有类型定义
 */
export function gen(allNodes: Map<string, Node>, outputPath: string): void {
    const writer = new Writer(outputPath);
    
    try {
        const nodes = Array.from(allNodes.values());
        generateInDependencyOrder(nodes, writer);
    } finally {
        // 确保所有内容都被写入文件
        writer.destroy();
    }
}

/**
 * 按依赖顺序生成类型定义
 */
function generateInDependencyOrder(nodes: Node[], writer: Writer): void {
    let checkExport = allDepsIsGen;
    const generated = new Set<string>();

    while (nodes.length > 0) {
        let progress = 0;
        
        for (let i = 0; i < nodes.length;) {
            const node = nodes[i];
            
            if (checkExport(node, generated)) {
                exportNode(node, writer);
                progress++;
                nodes.splice(i, 1);
                generated.add(node.name);
            } else {
                i++;
            }
        }
        
        // 如果没有进展，导出所有剩余节点
        if (progress === 0) {
            checkExport = () => true;
        }
    }
}