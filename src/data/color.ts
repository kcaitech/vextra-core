/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { namedColors } from "../basic/color_util";
import { Color as C } from "./baseclasses";

export class Color extends C {

    static DefaultColor = new Color(0, 0, 0, 0);

    toRGBA(): string {
        return "rgba(" + this.red + "," + this.green + "," + this.blue + "," + this.alpha + ")";
    }
    toRGB(): string {
        return "rgb(" + this.red + "," + this.green + "," + this.blue + ")";
    }
    toHex(): string {
        const toHex = (n: number) => {
            n = Math.round(n);
            return n.toString(16).toUpperCase().length === 1 ? `0${n.toString(16).toUpperCase()}` : n.toString(16).toUpperCase();
        }
        return "#" + toHex(this.red) + toHex(this.green) + toHex(this.blue);
    }
    equals(color: Color): boolean {
        return this.alpha === color.alpha &&
            this.blue === color.blue &&
            this.green === color.green &&
            this.red === color.red;
    }
    clone(): Color {
        return new Color(this.alpha, this.red, this.green, this.blue);
    }
    static parse(colorStr: string): Color | undefined {
        return parseColor(colorStr);
    }
}

function fixColor255(n: number) {
    return Math.min(Math.max(Math.round(n * 255), 0), 255);
}

// 解析颜色值
function parseColor(colorStr: string): Color | undefined {
    if (!colorStr || typeof colorStr !== 'string' || colorStr.length === 0) {
        return undefined;
    }

    let hexColor = colorStr.trim();

    // 处理颜色名称
    if (hexColor.toLowerCase() in namedColors) {
        const color = namedColors[hexColor.toLowerCase()]!;
        if (color.length === 3) {
            return new Color(1, fixColor255(color[0]), fixColor255(color[1]), fixColor255(color[2]));
        } else if (color.length === 4) {
            return new Color(color[3], fixColor255(color[0]), fixColor255(color[1]), fixColor255(color[2]));
        }
    }

    // 处理十六进制颜色
    if (hexColor.startsWith("#")) {
        let hex = hexColor.slice(1);
        let r, g, b, a = 255;

        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 4) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
            a = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else if (hex.length === 8) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
            a = parseInt(hex.substring(6, 8), 16);
        } else {
            return undefined;
        }

        // 验证颜色值范围
        if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a) ||
            r < 0 || r > 255 || g < 0 || g > 255 ||
            b < 0 || b > 255 || a < 0 || a > 255) {
            return undefined;
        }

        return new Color(a / 255, r, g, b);
    }

    // 处理RGB/RGBA格式
    if (hexColor.startsWith("rgb")) {
        const rgba = hexColor.slice(hexColor.indexOf("(") + 1, hexColor.indexOf(")")).split(/,|\s+/).filter(arg => arg && arg.trim()).map(item => parseFloat(item));
        if (rgba.length >= 3) {
            const r = Math.round(rgba[0]);
            const g = Math.round(rgba[1]);
            const b = Math.round(rgba[2]);
            const a = rgba.length === 4 ? Math.round(rgba[3] * 255) : 255;

            // 验证颜色值范围
            if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a) ||
                r < 0 || r > 255 || g < 0 || g > 255 ||
                b < 0 || b > 255 || a < 0 || a > 255) {
                return undefined;
            }

            return new Color(a / 255, r, g, b);
        }
    }

    return undefined;
}
