/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeView, TextShapeView } from "../../../dataview";
import { BlurType, Fill } from "../../../data";
import { Props } from "../painters/view";
import { stroke } from "../../stroke";

export function render(view: ShapeView, props: Props): Function | null {
    const blur = view.blur;
    if (!blur || !blur.isEnabled) return null;
    const ctx = view.canvasRenderingContext2D!;
    if (blur.type === BlurType.Gaussian) {
        ctx.save();
        ctx.filter = `blur(${blur.saturation / 2}px)`;
        return ctx.restore.bind(ctx);
    } else return backgroundBlur(ctx, view, props);

}

function backgroundBlur(ctx: CanvasRenderingContext2D, view: ShapeView, props: Props) {
    const borders = view.getBorder();
    const fills = view.getFills();
    const alphaBorder = opacity(borders.strokePaints);
    const alphaFill = opacity(fills);
    if (!alphaFill && !alphaBorder) return null;
    ctx.save();
    const blur = view.blur!;
    const offscreen = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
    const offCtx = offscreen.getContext('2d')!;
    offCtx.filter = `blur(${blur.saturation / 2}px)`;
    offCtx.drawImage(ctx.canvas, 0, 0);

    const path = new Path2D();
    if (fills.length && alphaFill) {
        path.addPath(new Path2D(view instanceof TextShapeView ? view.getTextPath().toString() : view.getPath().toString()));
    }
    if (borders.strokePaints.length && alphaBorder) {
        const path2D = new Path2D(stroke(view).toString());
        const transform = new DOMMatrix();
        transform.translate(view.outerFrame.x, view.outerFrame.y);
        path.addPath(path2D, transform);
    }
    ctx.save();
    ctx.transform(...props.transform);
    ctx.clip(path, "evenodd");
    ctx.resetTransform();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
    return ctx.restore.bind(ctx);
}

const opacity = (t: Fill[]) => {
    for (let i = 0; i < t.length; i++) {
        const __t = t[i];
        if (__t.color.alpha > 0 && __t.color.alpha < 1 && __t.isEnabled) return true;
    }
    return false;
}
