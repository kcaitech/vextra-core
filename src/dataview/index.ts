/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

export * from "./artboard";
export * from "./basic";
export * from "./contactline";
export * from "./groupshape";
export * from "./imageshape";
export * from "./line";
export * from "./pathshape";
export * from "./pathshape2";
export * from "./shape";
export * from "./symbol";
export * from "./symbolref";
export * from "./table";
export * from "./tablecell";
export * from "./table2";
export * from "./textshape";
export * from "./page"
export * from "./el"
export * from "./view"
export * from "./viewctx"
export * from "./shapeproxy"
export * from "./cutout"
export * from "./rect"
export * from "./boolshape"
export * from "./polygon"
export * from "./star"
export { FrameCpt } from "./proxy/frame/basic"
export { find4select } from "./find"
export { hitContent, hitVisible, hitOuter } from "./hittest"

// auto layout
export * from "./proxy/layout/auto_layout2"

import { Shape, ShapeType } from "../data";
import { ArtboardView } from "./artboard";
import { BoolShapeView } from "./boolshape";
import { ContactLineView } from "./contactline";
import { GroupShapeView } from "./groupshape";
import { LineView } from "./line";
import { PageView } from "./page";
import { PathShapeView } from "./pathshape";
import { PolygonShapeView } from "./polygon";
import { RectShapeView } from "./rect";
import { StarShapeView } from "./star";
import { SymbolView } from "./symbol";
import { SymbolRefView } from "./symbolref";
import { TextShapeView } from "./textshape";
import { DViewCtx, ViewType } from "./viewctx";
import { ShapeView } from "./shape";
function initComsMap(comsMap: Map<ShapeType, ViewType>) {
    comsMap.set(ShapeType.Artboard, ArtboardView);
    comsMap.set(ShapeType.Group, GroupShapeView);
    comsMap.set(ShapeType.Image, RectShapeView);
    comsMap.set(ShapeType.BoolShape, BoolShapeView);
    comsMap.set(ShapeType.Path, PathShapeView);
    comsMap.set(ShapeType.Oval, PathShapeView);
    comsMap.set(ShapeType.Text, TextShapeView);
    comsMap.set(ShapeType.Symbol, SymbolView);
    comsMap.set(ShapeType.SymbolUnion, SymbolView);
    comsMap.set(ShapeType.SymbolRef, SymbolRefView);
    comsMap.set(ShapeType.Line, LineView);
    comsMap.set(ShapeType.Contact, ContactLineView);
    comsMap.set(ShapeType.Rectangle, RectShapeView);
    comsMap.set(ShapeType.Star, StarShapeView);
    comsMap.set(ShapeType.Polygon, PolygonShapeView);
    comsMap.set(ShapeType.Page, PageView);
}

export function layoutShape(shape: Shape): {view: ShapeView, ctx: DViewCtx} {
    const ctx = new DViewCtx();
    initComsMap(ctx.comsMap);
    const ViewClass = ctx.comsMap.get(shape.type);
    if (!ViewClass) throw new Error("export svg, unknow shape type : " + shape.type)
    const view = new ViewClass(ctx, { data: shape, scale: undefined, layoutSize: undefined, varsContainer: undefined, isVirtual: undefined }) as ShapeView;
    ctx.layoutAll();
    return { view, ctx };
}