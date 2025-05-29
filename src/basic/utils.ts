/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// 根据若干(>= 4)个点，确定最边界的四个值
export function createHorizontalBox(points: [number, number][]) {
    if (points.length < 4) return;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < points.length; i++) {
        xs.push(points[i][0]);
        ys.push(points[i][1]);
    }
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    return { top, bottom, left, right };
}

export function getFormatFromBase64(base64: string) {
    const fileheader = new Map([
        ['data:image/svg+xml', 'svg'],
        ['data:image/gif', 'gif'],
        ['data:image/jpeg', 'jpeg'],
        ['data:image/png', 'png'],
    ])
    const header = base64.substring(0, base64.indexOf(';'));
    return fileheader.get(header);
}
export function base64ToDataUrl(format: string, base64: string) {
    const de_fileheader = new Map([
        ['svg', `data:image/svg+xml;base64,${base64}`,],
        ['gif', `data:image/gif;base64,${base64}`],
        ['jpeg', `data:image/jpeg;base64,${base64}`],
        ['png', `data:image/png;base64,${base64}`]
    ])
    return de_fileheader.get(format) || '';
}

export function base64Encode(data: string): string {
    return typeof window !== "undefined" ? window.btoa(data) : Buffer.from(data).toString("base64")
    // return Buffer.from(data).toString("base64")
}