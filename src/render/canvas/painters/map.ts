/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeType } from "../../../data";
import { ShapeView } from "../../../dataview";
import { ViewCanvasRenderer } from "./view";
import { ArtboardCanvasRenderer } from "./artboard";
import { BoolCanvasRenderer } from "./bool";
import { ContactCanvasRenderer } from "./contact";
import { PageCanvasRenderer } from "./page";
import { RefCanvasRenderer } from "./ref";
import { SymbolCanvasRenderer } from "./symbol";
import { TextCanvasRenderer } from "./text";

interface RendererType {
    new(view: ShapeView): ViewCanvasRenderer;
}

export const CanvasConstructorMap = new Map<ShapeType, RendererType>([
    [ShapeType.Artboard, ArtboardCanvasRenderer],
    [ShapeType.BoolShape, BoolCanvasRenderer],
    [ShapeType.Contact, ContactCanvasRenderer],
    [ShapeType.Cutout, ViewCanvasRenderer],
    [ShapeType.Page, PageCanvasRenderer],
    [ShapeType.SymbolRef, RefCanvasRenderer],
    [ShapeType.Symbol, SymbolCanvasRenderer],
    [ShapeType.Text, TextCanvasRenderer],
    [ShapeType.Oval, ViewCanvasRenderer],
    [ShapeType.Rectangle, ViewCanvasRenderer],
    [ShapeType.Star, ViewCanvasRenderer],
    [ShapeType.Polygon, ViewCanvasRenderer],
    [ShapeType.SymbolUnion, ViewCanvasRenderer],
    [ShapeType.Group, ViewCanvasRenderer],
    [ShapeType.Path, ViewCanvasRenderer],
]);