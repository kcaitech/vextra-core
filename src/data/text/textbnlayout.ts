/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// bullet numbers layout

import { gPal } from "../../basic/pal";
import { BulletNumbers, BulletNumbersBehavior, BulletNumbersType, Para, Span, TextTransformType } from "./text";
import { BulletNumbersLayout, IGraphy } from "./textlayout";
import { transformText } from "./textlayouttransform";
import * as classes from "../baseclasses"

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


// const luomaLetters = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
// const luomaLetterWidth: { [key: string]: number } = {};
// luomaLetterWidth['I'] = 0.15;
// luomaLetterWidth['V'] = 1.05;
// luomaLetterWidth['X'] = 1;
// luomaLetterWidth['L'] = 1.05;
// luomaLetterWidth['C'] = 1.15;
// luomaLetterWidth['D'] = 1;
// luomaLetterWidth['M'] = 1;
// luomaLetterWidth['.'] = 0.75;
function measureLuomaTextWidth(text: string, font: string): number {
    const measure = gPal.text.textMeasure;
    return text.split('').reduce((sum, letter) => {
        const m = measure(letter.charAt(0), font);
        return sum + (m?.width ?? 0);
    }, 0);
}

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

enum BNType {
    Number = 0,
    Letter = 1,
    Roman = 2,
}

export function getOrderedType(indent: number): BNType {
    // 1ai
    switch (indent % 3) {
        case 0: return BNType.Number;
        case 1: return BNType.Letter;
        case 2: return BNType.Roman;
    }
    throw new Error('getOrderedType error');
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

const bnMetricsCache = new Map<string, TextMetrics | undefined>();
function getBNMetrics(char: string, fontSize: number, span: Span) {
    const weight = span.weight || 400;
    const italic = span.italic;
    const font = (italic ? 'italic ' : 'normal ') + weight + ' ' + fontSize + 'px ' + span.fontName;
    const id = char[0] + '#' + font;
    if (bnMetricsCache.has(id)) return bnMetricsCache.get(id)!;
    const measure = gPal.text.textMeasure;
    const metrics = measure(char[0], font);
    bnMetricsCache.set(id, metrics);
    return metrics;
}

export function layoutBulletNumber(para: classes.Para, span: Span, bulletNumbers: BulletNumbers, preBulletNumbers: BulletNumbersLayout[]): BulletNumbersLayout {
    const indent = para.attr?.indent || 0;
    let text: string = '';

    let index = 0;
    let graph: IGraphy | undefined;
    const fontSize = span.fontSize || 0;

    if (bulletNumbers.type === BulletNumbersType.Disorded) {
        text = getDisordedChars(indent);

        const padding = 2;
        const ch = fontSize;
        const cw = span.fontSize ? span.fontSize * 0.6 : 10;
        graph = {
            char: text,
            metrics: getBNMetrics(text, fontSize, span),
            cw: cw * 2 - padding, // 2个字符宽度
            ch,
            index: 0,
            x: padding,
            cc: 1
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
        const bntype = getOrderedType(indent);
        text = getOrderedChars(indent, index);

        const transformType = span.transform;
        const ch = fontSize;
        const charWidth = span.fontSize ? span.fontSize * 0.6 : 10;
        let cw = 0;
        if (transformType && transformType === TextTransformType.Uppercase) {
            let text2 = '';
            for (let i = 0, len = text.length; i < len; i++) {
                const char = transformText(text.charAt(i), false, transformType);
                text2 += char;
            }
            text = text2;
        }
        cw = charWidth * text.length;
        if (bntype === BNType.Roman) {
            const fontSize = span.fontSize || 10;
            const font = "normal " + fontSize + "px " + span.fontName;
            const count = Math.ceil(measureLuomaTextWidth(text, font) / charWidth);
            cw = Math.max(2, count) * charWidth; // 至少2个字符宽度
        }

        graph = {
            char: text,
            metrics: getBNMetrics(text, fontSize, span),
            cw,
            ch,
            index: 0,
            x: 0,
            cc: 1
        }

        if (bntype === BNType.Number && index === 0) {
            graph.x = 0.2 * charWidth;
            graph.cw = graph.cw - graph.x;
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