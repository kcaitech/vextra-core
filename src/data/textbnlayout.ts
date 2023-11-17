// bullet numbers layout

import { BulletNumbers, BulletNumbersBehavior, BulletNumbersType, Para, Span, TextTransformType } from "./classes";
import { BulletNumbersLayout, IGraphy } from "./textlayout";
import { transformText } from "./textlayouttransform";

const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
const letterRadix = letters.length;
/**
 * 
 * @param num 从0 开始
 */
export function toLetterNumber(num: number) {
    if (num < 0) return '';
    const ret: string[] = [];
    for (let i = 0; ; i++) {
        const floor = Math.floor(num / letterRadix);
        if (floor >= 1) {
            ret.push(letters[num % letterRadix])
            num = floor;
            continue;
        }
        if (i > 0) {
            ret.push(letters[num % letterRadix - 1])
        }
        else {
            ret.push(letters[num % letterRadix])
        }
        break;
    }
    return ret.reverse().join('');
}

// Ⅰ（1）、X（10）、C（100）、M（1000）、V（5）、L（50）、D（500）
const gearr = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]; // 1-9
const shiarr = ["X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"]; // 10-90
const baiarr = ["C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"]; // 100-900
const qianarr = ["M", "MM", "MMM"]; // 1000 - 3000
const luomaData = [gearr, shiarr, baiarr, qianarr];
/**
 * 
 * @param num 从1 开始 到 3999
 * @returns 
 */
export function toRomanNumber(num: number) {
    // num++;

    if (num <= 0) return '';
    if (num > 3999) {
        num %= 3999;
    }

    const strNum = "" + num;
    let result = "";
    for (let i = 0; i < strNum.length; i++) {
        const data = strNum.charAt(i);
        if (data == "0") {
            continue;
        }
        result += luomaData[strNum.length - i - 1][parseInt(data) - 1];
    }
    return result;
}

const disordedChars = ['•', '◦', '▪'];
export function getDisordedChars(indent: number): string {
    const char = disordedChars[indent % disordedChars.length] // 有需要可以换成图形
    return char;
}

export function getOrderedChars(indent: number, index: number): string {
    // 1ai
    switch (indent % 3) {
        case 0: return '' + (index + 1) + '.';
        case 1: return toLetterNumber(index) + '.';
        case 2: return toRomanNumber(index + 1) + '.';
    }
    return '';
}

const metrics = new class implements TextMetrics {
    actualBoundingBoxAscent: number = 0;
    actualBoundingBoxDescent: number = 0;
    actualBoundingBoxLeft: number = 0;
    actualBoundingBoxRight: number = 0;
    fontBoundingBoxAscent: number = 0;
    fontBoundingBoxDescent: number = 0;
    width: number = 0;
}

export function layoutBulletNumber(para: Para, span: Span, bulletNumbers: BulletNumbers, preBulletNumbers: BulletNumbersLayout[]): BulletNumbersLayout {
    const indent = para.attr?.indent || 0;
    let text: string = '';

    let index = 0;
    let graph: IGraphy | undefined;

    if (bulletNumbers.type === BulletNumbersType.Disorded) {
        text = getDisordedChars(indent);

        const padding = 2;
        const ch = span.fontSize || 0;
        const cw = span.fontSize ? span.fontSize * 0.6 : 10;
        graph = {
            char: text,
            metrics: metrics,
            cw: cw * 2 - padding, // 2个字符宽度
            ch,
            index: 0,
            x: padding
        }
    }
    else if (bulletNumbers.type === BulletNumbersType.Ordered1Ai) {
        if (bulletNumbers.behavior === BulletNumbersBehavior.Renew) {
            index = bulletNumbers.offset || 0;
        }
        else {
            // 查找同级的项目编号
            for (let i = preBulletNumbers.length - 1; i >= 0; i--) {
                const pre = preBulletNumbers[i];
                if (pre.level < indent) break;
                if (pre.level > indent) continue;
                if (pre.type !== BulletNumbersType.Ordered1Ai) break;
                index = pre.index + 1;
                break;
            }
        }
        text = getOrderedChars(indent, index);

        const transformType = span.transform;
        const ch = span.fontSize || 0;
        const charWidth = span.fontSize ? span.fontSize * 0.6 : 10;
        let cw = 0;
        if (transformType && transformType === TextTransformType.Uppercase) {
            let text2 = '';
            for (let i = 0, len = text.length; i < len; i++) {
                const char = transformText(text.charAt(i), false, transformType);
                cw += charWidth;
                text2 += char;
            }
            text = text2;
        } else {
            cw = charWidth * text.length;
        }

        graph = {
            char: text,
            metrics: metrics,
            cw,
            ch,
            index: 0,
            x: 0
        }
    }
    else {
        throw new Error("unknow bullet numbers type: " + bulletNumbers.type); // unknow
    }

    const layout = new BulletNumbersLayout(graph);
    layout.index = index;
    layout.level = indent;
    layout.text = text;
    layout.type = bulletNumbers.type;

    preBulletNumbers.push(layout);

    return layout;
}