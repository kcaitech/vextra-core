/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    adapt2Shape,
    layoutShape, 
    PageView, 
    ShapeView
    } from "../../../dataview";
import { importPage } from "../../../data/baseimport";
import template_page from "../../../editor/template/page.json";
import * as types from "../../../data/typesdefine";
import { BasicArray, Document, Shape } from "../../../data";
import { transform_data } from "../../cilpboard";

// type SkiaCanvas = InstanceType<typeof import('skia-canvas').Canvas>;
let Canvas: typeof import('skia-canvas').Canvas;
if (typeof window === 'undefined') {
    // Node.js environment
    Canvas = require('skia-canvas').Canvas;
}

export async function exportImg(document: Document, view: ShapeView | ShapeView[] | Shape | Shape[], size?: { width: number, height: number }) {

    const views = Array.isArray(view) ? view : [view];
    const data = importPage(template_page as types.Page);
    const source = transform_data(document, views.map(i => i instanceof Shape ? i : adapt2Shape(i)));
    data.childs = source as BasicArray<any>;
    const wrapview = layoutShape(data).view as PageView;
    if (size === undefined) size = wrapview.size;

    if (size.width <= 0 || size.height <= 0) {
        throw new Error("Invalid size for rendering: " + JSON.stringify(size));
    }

    if (size.width > 10000 || size.height > 10000) {
        throw new Error("Size too large for rendering: " + JSON.stringify(size));
    }

    const canvas = new Canvas(size.width, size.height);
    const canvasCtx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

    wrapview.ctx.setCanvas(canvasCtx);
    wrapview.render('Canvas');
    wrapview.destroy();
    return canvasCtx.getImageData(0, 0, size.width, size.height).data.buffer as ArrayBuffer;
}
