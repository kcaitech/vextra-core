/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// platform abstract layer

export type MeasureFun = (code: string, font: string) => TextMetrics | undefined;

export type TextPathFun = (font: string, fontSize: number, italic: boolean, weight: number, charCode: number) => string;

export const gPal: {
    text: {
        textMeasure: MeasureFun,
        getTextPath: TextPathFun,
    }
} = {
    text: {
        textMeasure: (code: string, font: string) => undefined,
        getTextPath: (font: string, fontSize: number, italic: boolean, weight: number, charCode: number) => "",
    },
}
