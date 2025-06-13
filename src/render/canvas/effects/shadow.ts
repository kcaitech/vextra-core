/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Border, BorderPosition, Fill, FillType, Shadow, ShadowPosition } from "../../../data";
import { ArtboardView, BoolShapeView, ShapeView, SymbolRefView, SymbolView, TextShapeView } from "../../../dataview";
import { ViewCanvasRenderer, Props } from "../painters/view";
import { Path } from "@kcaitech/path";
import { stroke } from "../../stroke";

export function render(renderer: ViewCanvasRenderer, view: ShapeView, props: Props, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, shadows: Shadow[], border: Border, fills: Fill[]): Function | undefined {
    shadows = shadows.filter(i => i.isEnabled);
    if (!shadows.length) return;

    if (isFrankShadow()) return frankShadow(ctx, shadows[0]);
    const outer: Shadow[] = [];
    const inner: Shadow[] = [];
    for (const shadow of shadows) if (shadow.position === ShadowPosition.Outer) outer.push(shadow); else inner.push(shadow);

    if (outer.length) {
        if (isBlurOutlineShadow()) blurOutlineShadow(view, props, ctx, outer);
        else complexBlurOutlineShadow(renderer, props, ctx, outer);
    }
    if (inner.length) return innerShadow(view, props, ctx, inner);

    function isFrankShadow() {
        return shadows.length === 1
            && shadows[0].position === ShadowPosition.Outer
            && !shadows[0].spread
            && (border.strokePaints.length + fills.length) < 2
            && (border.strokePaints[0]?.fillType !== FillType.Gradient && fills[0]?.fillType !== FillType.Gradient)
            && (view instanceof BoolShapeView || !view.childs.length)
    }

    function isBlurOutlineShadow() {
        return (!view.childs.length || view instanceof BoolShapeView)
            || ((view instanceof ArtboardView || view instanceof SymbolView || view instanceof SymbolRefView));
    }
}

function frankShadow(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, shadow: Shadow): Function {
    ctx.save();
    const color = shadow.color;
    ctx.shadowColor = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
    ctx.shadowBlur = shadow.blurRadius;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    return ctx.restore.bind(ctx);
}

function blurOutlineShadow(view: ShapeView, props: Props, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, outerShadows: Shadow[]) {
    let pathStr = view instanceof TextShapeView ? view.getTextPath().toString() :  view.getPath().toString();
    const border = view.getBorder();
    if (border && border.position !== BorderPosition.Inner) {
        const gPath = new Path(pathStr);
        const borderGPath = stroke(view);
        gPath.union(borderGPath);
        pathStr = gPath.toSVGString();
    }
    const path2D = new Path2D(pathStr);
    ctx.save();
    ctx.transform(...props.transform);
    for (const os of outerShadows) {
        const {offsetX, offsetY, blurRadius, color} = os;
        ctx.save();
        ctx.filter = `blur(${blurRadius / 2}px)`;
        ctx.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
        ctx.translate(offsetX / 1.8, offsetY / 1.8);
        ctx.fill(path2D, 'evenodd');
        ctx.restore();
    }
    ctx.restore();
}

function complexBlurOutlineShadow(renderer: ViewCanvasRenderer, props: Props, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, outerShadows: Shadow[]) {
    const path2D = renderer.flat;
    ctx.save();
    ctx.transform(...props.transform);
    for (const os of outerShadows) {
        const {offsetX, offsetY, blurRadius, color} = os;
        ctx.save();
        ctx.filter = `blur(${blurRadius / 2}px)`;
        ctx.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
        ctx.translate(offsetX, offsetY);
        ctx.fill(path2D, 'evenodd');
        ctx.restore();
    }
    ctx.restore();
}

function innerShadow(view: ShapeView, props: Props, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, innerShadows: Shadow[]) {
    return () => {
        // const outline = view.outline;
        // const outlineStr = outline.toSVGString();
        // const outlinePath2D = new Path2D(outlineStr);
        // const outlineBox = view.outlineBox;
        // const bodyIPath = new Path(outlineStr);
        // ctx.save();
        // ctx.transform(...props.transform);
        // ctx.clip(outlinePath2D, "evenodd");
        // for (const inSd of innerShadows) {
        //     let x1 = outlineBox.x;
        //     let y1 = outlineBox.y;
        //     let x2 = outlineBox.x2;
        //     let y2 = outlineBox.y2;
        //     const {offsetX, offsetY, color, spread} = inSd;
        //     const blur = inSd.blurRadius / 2;
        //     const paddingX = blur + Math.abs(offsetX);
        //     const paddingY = blur + Math.abs(offsetY);
        //     x1 -= paddingX;
        //     y1 -= paddingY;
        //     x2 += paddingX;
        //     y2 += paddingY;
        //     const box = {x: x1, y: y1, w: x2 - x1, h: y2 - y1};
        //     const inner = new Path(`M${box.x} ${box.y} h${box.w} v${box.h} h${-box.w} z`);
        //     inner.op(bodyIPath, OpType.Difference);
        //     ctx.save();
        //     ctx.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
        //     ctx.filter = `blur(${blur}px)`;
        //     ctx.translate(offsetX, offsetY);
        //     ctx.fill(new Path2D(inner.toSVGString()), "evenodd");
        //     ctx.restore();
        // }
        // ctx.restore();
    }
}