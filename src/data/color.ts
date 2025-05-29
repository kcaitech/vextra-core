/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


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
}