/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Fill, FillType, Gradient, GradientType, ShapeSize } from "../../../data";
import { Props } from "../painters/view";
import { render as renderGradient } from "./gradient";
import { patternRender } from "./pattern";

export function render(props: Props, ctx: CanvasRenderingContext2D, fills: Fill[], path2D: Path2D, frame: ShapeSize) {
    for (const fill of fills) {
        if (fill.isEnabled) painter[fill.fillType](props, ctx, fill, path2D, frame);
    }
}

const painter: { [key: string]: (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize) => void } = {};

painter[FillType.SolidColor] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fillStyle = `rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha})`;
    ctx.fill(path2D, "evenodd");
    ctx.restore();
}

painter[FillType.Gradient] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize) {
    ctx.save();
    ctx.transform(...props.transform);
    if(fill.gradient?.gradientType === GradientType.Radial) {
        const offscreen = new OffscreenCanvas(frame.width, frame.height);
        const offctx = offscreen.getContext("2d")!;
        offctx.clip(path2D, "evenodd");
        offctx.fillStyle = renderGradient(offctx, fill.gradient as Gradient, frame);
        offctx.fill(path2D);
        ctx.drawImage(offscreen, 0, 0);
    } else {
        ctx.fillStyle = renderGradient(ctx, fill.gradient as Gradient, frame);
        ctx.fill(path2D);
    }
    ctx.restore();
}

painter[FillType.Pattern] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize) {
    ctx.save();
    ctx.transform(...props.transform);
    patternRender(ctx, frame, fill, path2D);
    ctx.restore();
}
