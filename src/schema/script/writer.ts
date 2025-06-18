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
 * @param level 缩进级别，每级为4个空格
 * @returns 缩进字符串
 */
function generateIndent(level: number): string {
    return '    '.repeat(Math.max(0, level));
}

/**
 * 括号与对应的层级变化映射
 * 正数表示增加层级，负数表示减少层级
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
 * 计算字符串中所有括号造成的层级变化总和
 * @param str 待分析的字符串
 * @returns 层级变化的总和
 */
function calculateLevelChange(str: string): number {
    return str.split('').reduce((level, char) => level + (BRACKET_LEVELS[char] || 0), 0);
}

/**
 * 检查字符串是否以闭合括号开始
 * @param str 待检查的字符串
 * @returns 是否以闭合括号开始
 */
function startsWithClosingBracket(str: string): boolean {
    return str.length > 0 && BRACKET_LEVELS[str[0]] < 0;
}

/**
 * 生成的代码文件通用头部注释
 * 包含版权信息和自动生成警告
 */
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
 * 代码写入器类
 * 
 * 负责将生成的代码写入文件，同时处理：
 * 1. 自动缩进和格式化
 * 2. 括号层级管理
 * 3. 文件头部注释
 * 4. 多行代码的智能格式化
 * 5. 内存缓冲以提升性能
 */
export class Writer {
    /** 当前缩进层级 */
    private currentLevel: number = 0;
    /** 目标文件路径 */
    private readonly filePath: string;
    /** 是否位于新行开始位置 */
    private isAtNewLine: boolean = true;
    /** 内存缓冲区 */
    private buffer: string[] = [];
    /** 缓冲区大小阈值 */
    private readonly bufferThreshold: number = 1000;

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
        this.flush(); // 立即写入头部注释
    }

    /**
     * 刷新缓冲区到文件
     */
    public flush(): void {
        if (this.buffer.length > 0) {
            try {
                const content = this.buffer.join('');
                fs.appendFileSync(this.filePath, content);
                this.buffer = [];
            } catch (error) {
                throw new Error(`Failed to write to file ${this.filePath}: ${(error as Error).message}`);
            }
        }
    }

    /**
     * 追加字符串到缓冲区
     * @param str 要追加的字符串
     * @returns 当前Writer实例，支持链式调用
     */
    append(str: string): this {
        if (str.length > 0) {
            this.buffer.push(str);
            this.isAtNewLine = false;
            
            // 当缓冲区达到阈值时刷新到文件
            if (this.buffer.length >= this.bufferThreshold) {
                this.flush();
            }
        }
        return this;
    }

    /**
     * 添加换行符
     * 如果已经在新行开始位置，则不重复添加
     * @returns 当前Writer实例，支持链式调用
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
     * 
     * 用法示例：
     * ```typescript
     * writer.nl('class MyClass ').sub(() => {
     *     writer.nl('constructor() {}');
     * });
     * ```
     * 
     * 生成代码：
     * ```typescript
     * class MyClass {
     *     constructor() {}
     * }
     * ```
     * 
     * @param callback 在大括号内执行的代码生成函数
     * @returns 当前Writer实例，支持链式调用
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
     * @param strings 要添加的字符串数组，会自动连接
     * @returns 当前Writer实例，支持链式调用
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
     * 
     * 用法一：添加当前缩进
     * ```typescript
     * writer.newline().indent().append('some code');
     * ```
     * 
     * 用法二：执行带额外缩进的子块
     * ```typescript
     * writer.indent(2, () => {
     *     writer.nl('deeply nested code');
     * });
     * ```
     * 
     * @param extraIndent 额外的缩进级别
     * @param callback 在指定缩进级别下执行的函数
     * @returns 当前Writer实例，支持链式调用
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
     * 
     * 此方法能够智能处理：
     * 1. 自动缩进管理
     * 2. 括号层级匹配
     * 3. 代码块的正确格式化
     * 
     * 用法示例：
     * ```typescript
     * writer.fmt(`if (condition) {
     *     doSomething();
     *     if (anotherCondition) {
     *         doMore();
     *     }
     * }`);
     * ```
     * 
     * @param str 要格式化的多行字符串
     * @param append 是否追加到当前行而不是新行开始
     * @returns 当前Writer实例，支持链式调用
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

            // 处理闭合括号 - 需要在写入前减少缩进
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

            // 计算并应用括号层级变化
            const levelChange = calculateLevelChange(line);
            if (levelChange === 0) {
                // 无层级变化，恢复之前的层级
                currentLevel = savedLevel;
                continue;
            }

            if (levelChange > 0) {
                // 增加层级
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
                // 减少层级
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

    /**
     * 析构函数 - 确保缓冲区被刷新
     */
    // destroy(): void {
    //     this.flush();
    // }
}