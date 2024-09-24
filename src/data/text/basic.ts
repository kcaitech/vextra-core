
// 从HeadPunc中剔除了0x00B7和0xFF0E
// 这两个标点既是首标点又是尾标点，有时候要特殊考虑
export function isPureHeadPunc(char: string) {
    return '$([{£¥‘“〈《「『【〔〖〝﹙﹛﹝＄（［｛￡￥'.indexOf(char) > -1;
}

// 实际上是由应用程序定义
export function isHeadPunc(char: string) {
    return '$([{£¥·‘“〈《「『【〔〖〝﹙﹛﹝＄（．［｛￡￥'.indexOf(char) > -1;
}

export function isTailPunc(char: string) {
    const code = char.charCodeAt(0)
    return code == 0x00A0 ||         // 无间断空格
        '!%),.:;>?]}¢¨°·ˇˉ―‖’”…‰′″›℃∶、。〃々〉》」』】〕〗〞︶︺︾﹀﹄﹚﹜﹞！＂％＇），．：；？］｀｜｝～￠'.indexOf(char) > -1 ||
        isJPNSpecPunc(code);
}

// 0x30FB: 在行压缩时候能被压缩，不能被标点压缩，可以出发Head Compress Punc
// 和Tail Compress Punch的标点压缩
export function isJPNSpecPunc(code: number) {
    return 0x30FB == code;
}

export function isNum(char: string) {
    return (char >= "0" && char <= "9");
}

export function isLetter(char: string) {
    return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
}

export function isChinese(char: string) {
    return (char >= "\u4e00" && char <= "\u9fbf" || char >= "\uf900" && char <= "\ufaff" || char >= "\u3400" && char <= "\u4dbf");
}

export function isJapanese(char: string) {
    return (char >= "\u3040" && char <= "\u309f" || char >= "\u30a0" && char <= "\u30ff" || char >= "\u31f0" && char <= "\u31ff");
}

// https://www.jianshu.com/p/42fd6f84c27a
export function getNextChar(text: string, index: number): string {
    const code = text.charCodeAt(index);
    if (!(0xD800 <= code && code <= 0xDBFF)) return text.charAt(index);

    const code2 = text.charCodeAt(index + 1);
    if (!(0xDC00 <= code2 && code2 <= 0xDFFF)) return text.charAt(index);

    // 还要判断下一个
    const code3 = text.charCodeAt(index + 2);
    if (code3 === 0x200D) { // 零宽度连接符
        return String.fromCharCode(code, code2, code3) + getNextChar(text, index + 3);
    }
    return String.fromCharCode(code, code2);
}

export function isNewLineCharCode(code: number) {
    // U+0009: Horizontal tab
    // U+000A: Line feed
    // U+000B: Vertical tab
    // U+000C: Form feed
    // U+000D: Carriage return
    // U+0020: Space
    // U+00A0: Non-breaking space
    // U+2028: Line separator
    // U+2029: Paragraph separator
    switch (code) {
        case 0x0A:
        case 0x0D:
        case 0x2028:
        case 0x2029:
            return true;
    }
    return false;
}

export const TEXT_BASELINE_RATIO = 0.135; // 从figma测试出来的值

const ratio = 1.21 // 从figma测试出来的值
export function autoLineHeight(fontsize: number) {
    return Math.round(fontsize * ratio)
}