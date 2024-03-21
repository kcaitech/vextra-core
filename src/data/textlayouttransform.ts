import { TextTransformType } from "./typesdefine";

function toUpperCase(char: string) {
    const code = char.charCodeAt(0);
    if (code >= 0x61 && code <= 0x7A) {
        return String.fromCharCode(code - 0x20);
    }
    return char;
}

function toLowerCase(char: string) {
    const code = char.charCodeAt(0);
    if (code >= 0x41 && code <= 0x5A) {
        return String.fromCharCode(code + 0x20);
    }
    return char;
}

export function transformText(char: string, isFirst: boolean, type: TextTransformType | undefined) {
    if (!type) return char;
    switch (type) {
        case TextTransformType.Lowercase: return toLowerCase(char);
        case TextTransformType.Uppercase: return toUpperCase(char);
        case TextTransformType.UppercaseFirst: {
            if (isFirst) {
                return toUpperCase(char);
            }
        }
    }
    return char;
}
