import fs from 'fs';

function space(level: number) {
    let ret = ''
    while ((level--) > 0) ret += '    '
    return ret
}
const tips = `/* 代码生成，勿手动修改 */`
export class Writer {
    space: number = 0
    file: string
    isNewLine: boolean = true;
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
        ++this.space;
        sub(this);
        --this.space;
        this.newline().append(space(this.space)).append('}');
        return this;
    }
    nl(...strs: string[]) {
        this.newline();
        if (strs.length > 0) this.append(space(this.space)).append(strs.join(''));
        return this;
    }
    indent(indent: number = 0, sub?: (w: Writer) => void) {
        if (sub) {
            this.space += indent;
            sub(this);
            this.space -= indent;
        } else {
            this.append(space(this.space + indent));
        }
        return this;
    }
}