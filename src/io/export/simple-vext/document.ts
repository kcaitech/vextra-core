/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Artboard, BoolShape, ContactShape, CutoutShape, 
    GroupShape, LineShape, OvalShape, PathShape, 
    PolygonShape, RectShape, ShapeType, StarShape, SymbolRefShape, SymbolShape, 
    SymbolUnionShape, TextShape, Document as SourceDocument, 
    Page as SourcePage, Shape as SourceShape } from "../../../data";
import { ShapeView, adapt2Shape } from "../../../dataview";
import { Page, Shape } from "./types";
import { exportArtboard, exportPage, exportGroupShape, exportRectShape, 
    exportBoolShape, exportSymbolShape, exportTextShape, 
    exportContactShape, exportShape, exportCutoutShape, exportLineShape, exportOvalShape, 
    exportPathShape, exportPolygonShape, exportStarShape, exportSymbolRefShape, 
    exportSymbolUnionShape } from "./export";

export class Document {
    name: string;
    pages: Page[];

    constructor(name: string, pages: Page[]) {
        this.name = name;
        this.pages = pages;
    }
}

export async function serializeDocument(document: SourceDocument, depth?: number): Promise<Document> {

    const pages = document.pagesList.reduce((acc, item) => {
        const page = document.pagesMgr.get(item.id);
        if (page) {
            acc.push(page);
        }
        return acc;
    }, [] as Promise<SourcePage | undefined>[]);

    const _pages = await Promise.all(pages).then(pages => pages.filter(page => page !== undefined));

    return new Document(document.name, _pages.map(page => exportPage(page, depth)));
}

export async function serializeNode(view: ShapeView, depth?: number): Promise<Shape> {
    const node = adapt2Shape(view);
    switch (view.type) {
        case ShapeType.Artboard:
            return exportArtboard(node as Artboard, depth);
        case ShapeType.Group:
            return exportGroupShape(node as GroupShape, depth);
        case ShapeType.Rectangle:
            return exportRectShape(node as RectShape, depth);
        case ShapeType.BoolShape:
            return exportBoolShape(node as BoolShape, depth);
        case ShapeType.Symbol:
            return exportSymbolShape(node as SymbolShape, depth);
        case ShapeType.Text:
            return exportTextShape(node as TextShape, depth);
        case ShapeType.Contact:
            return exportContactShape(node as ContactShape, depth);
        case ShapeType.Cutout:
            return exportCutoutShape(node as CutoutShape, depth);
        case ShapeType.Line:
            return exportLineShape(node as LineShape, depth);
        case ShapeType.Oval:
            return exportOvalShape(node as OvalShape, depth);
        case ShapeType.Page:
            return exportPage(node as SourcePage, depth);
        case ShapeType.Path:
            return exportPathShape(node as PathShape, depth);
        case ShapeType.Polygon:
            return exportPolygonShape(node as PolygonShape, depth);
        case ShapeType.Star:
            return exportStarShape(node as StarShape, depth);
        case ShapeType.SymbolRef:
            return exportSymbolRefShape(node as SymbolRefShape, depth);
        case ShapeType.SymbolUnion:
            return exportSymbolUnionShape(node as SymbolUnionShape, depth);
        default: 
            return exportShape(node as SourceShape, depth);
    }
}