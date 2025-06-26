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
    layoutShape,
    ShapeView
} from "../../../dataview";
import { Shape } from "../../../data";
import { OffscreenCanvas } from "../../../basic/canvas"

export async function exportImg(shape: ShapeView | Shape, pngScale: number = 1) {
    const view = shape instanceof Shape ? layoutShape(shape).view as ShapeView : (shape);
    const frame = view.frame;
    let width = frame.width * pngScale;
    let height = frame.height * pngScale;

    if (width <= 0 || height <= 0) return;
    const max_size = 4096
    if (width > max_size || height > max_size) {
        // 等比缩小到4k大小
        const scale = Math.min(max_size / width, max_size / height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
        pngScale = pngScale * scale;
    }

    const tempCanvas = new OffscreenCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.translate(-frame.x, -frame.y);
    tempCtx.scale(pngScale, pngScale);
    const transform = view.transform
    tempCtx.translate(-transform.translateX, -transform.translateY);

    view.ctx.setCanvas(tempCtx as any);
    view.render('Canvas'); // render to canvas

    if (shape instanceof Shape) view.destroy();
    return tempCanvas;
}
