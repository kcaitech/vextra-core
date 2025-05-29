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

function space4(level: number) {
    let ret = ''
    while ((level--) > 0) ret += '    '
    return ret
}
const charlevel: { [key: string]: number } = {
    '{': 1,
    '[': 1,
    '(': 1,
    '}': -1,
    ']': -1,
    ')': -1
}
function calclevel(str: string) {
    return str.split('').reduce((l, c) => l += (charlevel[c] || 0), 0)
}
function decfirst(str: string) {
    return charlevel[str[0]] < 0
}
const tips = `/* 代码生成，勿手动修改 */`
export class Writer {
    private level: number = 0
    private file: string
    private isNewLine: boolean = true;
    constructor(file: string) {
        if (fs.existsSync(file)) fs.rmSync(file)
        this.file = file;
        this.nl(tips);
    }
    append(str: string) {
        if (str.length > 0) {
            fs.appendFileSync(this.file, str);
            this.isNewLine = false;
        }
        return this;
    }
    newline() {
        if (!this.isNewLine) {
            this.append('\n');
            this.isNewLine = true;
        }
        return this;
    }
    sub(sub: (w: Writer) => void) {
        this.append('{');
        ++this.level;
        sub(this);
        --this.level;
        this.newline().indent().append('}');
        return this;
    }
    nl(...strs: string[]) {
        this.newline();
        if (strs.length > 0) this.indent().append(strs.join(''));
        return this;
    }
    indent(indent: number = 0, sub?: (w: Writer) => void) {
        if (sub) {
            this.level += indent;
            sub(this);
            this.level -= indent;
        } else {
            this.append(space4(this.level + indent));
        }
        return this;
    }

    fmt(str: string, append: boolean = false) {
        const baselevel = this.level;
        let level = 0;
        const aligns = [];
        const lines = str.split('\n');
        for (let i = 0, len = lines.length; i < len; ++i) {
            const l = lines[i].trim();
            if (l.length === 0) continue;
            const savelevel = level;
            if (decfirst(l)) {
                --level;
                if (level < 0) level = 0;
                else if (level < aligns.length - 1) level = aligns.length - 1;
            }
            if (!append || i > 0) {
                this.newline()
                this.append(space4(level + baselevel))
            }
            this.append(l)

            const ll = calclevel(l)
            if (ll === 0) {
                level = savelevel
                continue
            }
            if (ll > 0) {
                if (level === aligns.length) {
                    aligns.push(ll)
                    ++level
                } else if (level === aligns.length - 1) {
                    aligns[aligns.length - 1] += ll
                    ++level
                } else {
                    throw new Error('fmt error');
                }
            } else {
                let i = 0
                for (; aligns.length > 0 && i < 0;) {
                    if (aligns[aligns.length - 1] + i <= 0) {
                        i += aligns[aligns.length - 1]
                        aligns.pop()
                    } else {
                        aligns[aligns.length - 1] += i
                        i = 0
                    }
                }
                if (i < 0) throw new Error('fmt error')
                if (level > aligns.length) level = aligns.length
            }
        }
    }
}