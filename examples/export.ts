/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { IO } from "../src";
import { openFile } from "./open";

export async function file2svg(file: File): Promise<string[]> {
    const document = await openFile(file);
    const svgList: Map<string, string> = new Map<string, string>();
    const tasks = document.pagesList.map(async (item) => {
        const page = await document.pagesMgr.get(item.id);
        if (page) {
            const svg = IO.exportSvg(page)
            svgList.set(item.id, svg);
        }
    })
    await Promise.all(tasks);
    return document.pagesList.map((item) => {
        const svg = svgList.get(item.id);
        return svg || "";
    });
}

export async function file2vext(file: File, type :'blob' | 'arraybuffer' | 'uint8array' = 'blob'): Promise<Blob | ArrayBuffer | Uint8Array> {
    const document = await openFile(file);
    return IO.exportVext(document, type);
}

export async function file2img(file: File): Promise<OffscreenCanvas[]> {
    const document = await openFile(file);
    const imgList: Map<string, OffscreenCanvas | undefined> = new Map<string, OffscreenCanvas | undefined>();
    const tasks = document.pagesList.map(async (item) => {
        const page = await document.pagesMgr.get(item.id);
        if (page) {
            const canvas = await IO.exportImg(page)
            imgList.set(item.id, canvas);
        }
    })
    await Promise.all(tasks);
    return document.pagesList.map((item) => {
        const svg = imgList.get(item.id);
        return svg || new OffscreenCanvas(0, 0);
    });
}