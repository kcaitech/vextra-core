/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Shape } from "../../../data/shape";
import { ShapeType } from "../../../data/classes";
import {
    ArtboardView, ContactLineView, CutoutShapeView, DViewCtx,
    GroupShapeView, ImageShapeView,
    LineView, PageView, PathShapeView, PathShapeView2,
    RectShapeView, SymbolRefView, SymbolView,
    TableCellView, TableView, TextShapeView
} from "../../../dataview";
import { BoolShapeView } from "../../../dataview/boolshape";
import { DataView } from "../../../dataview/view"

function initComsMap(comsMap: Map<ShapeType, any>) {
    comsMap.set(ShapeType.Artboard, ArtboardView);
    comsMap.set(ShapeType.Group, GroupShapeView);
    comsMap.set(ShapeType.Image, ImageShapeView);
    comsMap.set(ShapeType.BoolShape, BoolShapeView);
    comsMap.set(ShapeType.Path, PathShapeView);
    // comsMap.set(ShapeType.Path2, PathShapeView2);
    // comsMap.set(ShapeType.Rectangle, PathShapeDom);
    comsMap.set(ShapeType.Oval, PathShapeView);
    comsMap.set(ShapeType.Text, TextShapeView);
    comsMap.set(ShapeType.Symbol, SymbolView);
    comsMap.set(ShapeType.SymbolUnion, SymbolView);
    comsMap.set(ShapeType.SymbolRef, SymbolRefView);
    comsMap.set(ShapeType.Line, LineView);
    comsMap.set(ShapeType.Table, TableView);
    comsMap.set(ShapeType.Contact, ContactLineView);
    comsMap.set(ShapeType.TableCell, TableCellView);
    comsMap.set(ShapeType.Cutout, CutoutShapeView);
    comsMap.set(ShapeType.Rectangle, RectShapeView);
    comsMap.set(ShapeType.Page, PageView);
}

export function exportSvg(shape: Shape): string {

    const adaptCtx = new DViewCtx();
    initComsMap(adaptCtx.comsMap);

    const ViewClass = adaptCtx.comsMap.get(shape.type);
    if (!ViewClass) throw new Error("export svg, unknow shape type : " + shape.type)
    const view = new ViewClass(adaptCtx, { data: shape, scale: undefined, layoutSize: undefined, varsContainer: undefined, isVirtual: undefined }) as DataView;

    adaptCtx.layoutAll();
    view.render();

    const content = view.toSVGString();
    view.destroy();
    return content;
}