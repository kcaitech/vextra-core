/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import fs from 'fs';

/**
 * 生成指定数量的缩进空格
 */
function generateIndent(level: number): string {
    return '    '.repeat(Math.max(0, level));
}

/**
 * 括号层级映射
 */
const BRACKET_LEVELS: Record<string, number> = {
    '{': 1,
    '[': 1,
    '(': 1,
    '}': -1,
    ']': -1,
    ')': -1
} as const;

/**
 * 计算字符串中的括号层级变化
 */
function calculateLevelChange(str: string): number {
    return str.split('').reduce((level, char) => level + (BRACKET_LEVELS[char] || 0), 0);
}

/**
 * 检查字符串是否以闭合括号开始
 */
function startsWithClosingBracket(str: string): boolean {
    return str.length > 0 && BRACKET_LEVELS[str[0]] < 0;
}

const GENERATED_CODE_HEADER = `/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

/* 代码生成，勿手动修改 */`;

/**
 * 代码写入器类，用于生成格式化的代码文件
 */
export class Writer {
    private currentLevel: number = 0;
    private readonly filePath: string;
    private isAtNewLine: boolean = true;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.initializeFile();
    }

    /**
     * 初始化文件，清空并写入头部注释
     */
    private initializeFile(): void {
        if (fs.existsSync(this.filePath)) {
            fs.rmSync(this.filePath);
        }
        this.nl(GENERATED_CODE_HEADER);
    }

    /**
     * 追加字符串到文件
     */
    append(str: string): this {
        if (str.length > 0) {
            try {
                fs.appendFileSync(this.filePath, str);
                this.isAtNewLine = false;
            } catch (error) {
                throw new Error(`Failed to write to file ${this.filePath}: ${(error as Error).message}`);
            }
        }
        return this;
    }

    /**
     * 添加换行符
     */
    newline(): this {
        if (!this.isAtNewLine) {
            this.append('\n');
            this.isAtNewLine = true;
        }
        return this;
    }

    /**
     * 执行子块代码并自动处理大括号和缩进
     */
    sub(callback: (writer: Writer) => void): this {
        this.append('{');
        this.currentLevel++;
        callback(this);
        this.currentLevel--;
        this.newline().indent().append('}');
        return this;
    }

    /**
     * 换行并添加内容
     */
    nl(...strings: string[]): this {
        this.newline();
        if (strings.length > 0) {
            this.indent().append(strings.join(''));
        }
        return this;
    }

    /**
     * 添加缩进或执行带缩进的子块
     */
    indent(extraIndent: number = 0, callback?: (writer: Writer) => void): this {
        if (callback) {
            const originalLevel = this.currentLevel;
            this.currentLevel += extraIndent;
            callback(this);
            this.currentLevel = originalLevel;
        } else {
            this.append(generateIndent(this.currentLevel + extraIndent));
        }
        return this;
    }

    /**
     * 格式化多行字符串并写入文件
     * @param str 要格式化的字符串
     * @param append 是否追加到当前行
     */
    fmt(str: string, append: boolean = false): this {
        const baseLevel = this.currentLevel;
        let currentLevel = 0;
        const levelStack: number[] = [];
        const lines = str.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.length === 0) continue;

            const savedLevel = currentLevel;

            // 处理闭合括号
            if (startsWithClosingBracket(line)) {
                currentLevel--;
                if (currentLevel < 0) {
                    currentLevel = 0;
                } else if (currentLevel < levelStack.length - 1) {
                    currentLevel = levelStack.length - 1;
                }
            }

            // 写入行内容
            if (!append || i > 0) {
                this.newline();
                this.append(generateIndent(currentLevel + baseLevel));
            }
            this.append(line);

            // 处理括号层级变化
            const levelChange = calculateLevelChange(line);
            if (levelChange === 0) {
                currentLevel = savedLevel;
                continue;
            }

            if (levelChange > 0) {
                if (currentLevel === levelStack.length) {
                    levelStack.push(levelChange);
                    currentLevel++;
                } else if (currentLevel === levelStack.length - 1) {
                    levelStack[levelStack.length - 1] += levelChange;
                    currentLevel++;
                } else {
                    throw new Error(`Formatting error: unexpected bracket nesting at line: ${line}`);
                }
            } else {
                // levelChange < 0
                let remainingChange = levelChange;
                while (levelStack.length > 0 && remainingChange < 0) {
                    const topLevel = levelStack[levelStack.length - 1];
                    if (topLevel + remainingChange <= 0) {
                        remainingChange += topLevel;
                        levelStack.pop();
                    } else {
                        levelStack[levelStack.length - 1] += remainingChange;
                        remainingChange = 0;
                    }
                }
                
                if (remainingChange < 0) {
                    throw new Error(`Formatting error: unmatched closing bracket at line: ${line}`);
                }
                
                if (currentLevel > levelStack.length) {
                    currentLevel = levelStack.length;
                }
            }
        }

        return this;
    }
}