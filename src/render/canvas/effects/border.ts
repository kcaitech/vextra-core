/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Border, Fill, FillType, GradientType, ShapeFrame, ShapeSize } from "../../../data";
import { Props } from "../painters/view";
import { ShapeView } from "../../../dataview";
import { render as renderGradient } from "./gradient";
import { stroke } from "../../stroke";

export function render(view: ShapeView, props: Props, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, border: Border, fillPath: Path2D) {
    for (const paint of border.strokePaints) {
        if (paint.isEnabled) {
            const path2D = new Path2D(stroke(view).toString());
            painter[paint.fillType](props, ctx, paint, path2D, view.size, view.frameProxy._p_outerFrame, fillPath);
        }
    }
}


const painter: { [key: string]: (props: Props, ctx: CanvasRenderingContext2D  | OffscreenCanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize, outerFrame: ShapeFrame, fillPath: Path2D) => void } = {};

painter[FillType.SolidColor] = function (props: Props, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, fill: Fill, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fillStyle = `rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha})`;
    ctx.fill(path2D, "evenodd");
    ctx.restore();
}

painter[FillType.Gradient] = function (props: Props, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize, outerFrame: ShapeFrame, fillPath: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    if (fill.gradient!.gradientType === GradientType.Radial) {
        const offscreen = new OffscreenCanvas(frame.width, frame.height);
        const offctx = offscreen.getContext("2d")!;
        offctx.clip(path2D, "evenodd");  // clip 要在gradient之前，不然会被gradient中的transform影响
        offctx.fillStyle = renderGradient(offctx, fill.gradient!, frame, outerFrame);
        offctx.fill(fillPath, "evenodd");
        ctx.drawImage(offscreen, 0, 0);
    } else {
        ctx.fillStyle = renderGradient(ctx, fill.gradient!, frame, outerFrame);
        ctx.fill(path2D, "evenodd");
    }
    ctx.restore();
}