import { ArtboardSVGRenderer } from './artboard';
import { BoolSVGRenderer } from './bool';
import { ContactSVGRenderer } from './contact';

import { PageSVGRenderer } from './page';

import { PathSVGRenderer } from './path';

import { RefSVGRenderer } from './ref';

import { SymbolSVGRenderer } from './symbol';
import { TextSVGRenderer } from './text';
import { ViewSVGRenderer } from './view';
import { ShapeType } from "../../../data";
import { ShapeView } from "../../../dataview";

interface RendererType {
    new(view: ShapeView): ViewSVGRenderer;
}

export const SVGConstructorMap = new Map<ShapeType, RendererType>([
    [ShapeType.Artboard, ArtboardSVGRenderer],
    [ShapeType.BoolShape, BoolSVGRenderer],
    [ShapeType.Contact, ContactSVGRenderer],
    [ShapeType.Path, PathSVGRenderer],
    [ShapeType.Page, PageSVGRenderer],
    [ShapeType.SymbolRef, RefSVGRenderer],
    [ShapeType.Symbol, SymbolSVGRenderer],
    [ShapeType.Text, TextSVGRenderer],
    [ShapeType.Cutout, ViewSVGRenderer],
    [ShapeType.Oval, PathSVGRenderer],
    [ShapeType.Rectangle, PathSVGRenderer],
    [ShapeType.Star, PathSVGRenderer],
    [ShapeType.Polygon, PathSVGRenderer],
    [ShapeType.SymbolUnion, ViewSVGRenderer],
    [ShapeType.Group, ViewSVGRenderer],
    [ShapeType.Line, PathSVGRenderer]
]);