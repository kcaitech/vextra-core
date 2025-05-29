/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { TextTransformType } from "../typesdefine";

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
