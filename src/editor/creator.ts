import { v4 as uuid } from "uuid";
import { Page } from "../data/page";
import { Artboard } from "../data/artboard";
import { Document, PageListItem } from "../data/document";
import { Repository } from "../data/transact";
import { GroupShape, RectShape, PathShape, OvalShape, LineShape, Shape, TextShape } from "../data/shape";
import * as types from "../data/typesdefine"
import { importGroupShape, IImportContext, importPage, importArtboard, importTextShape } from "../io/baseimport";
import template_group_shape from "./template/group-shape.json";
import templage_page from "./template/page.json";
import template_artboard from "./template/artboard.json"
import template_text_shape from "./template/text-shape.json"
import {
    Blur, Point2D, BorderOptions, ContextSettings, CurvePoint,
    Color, Border, Style, Fill, Shadow, ShapeFrame, FillType, Ellipse, RectRadius, CurveMode
} from "../data/baseclasses";
import { BasicArray } from "../data/basic";
// import i18n from '../../i18n' // data不能引用外面工程的内容
const noeffectCtx = new class implements IImportContext {
    afterImport(_: any): void { }
}

export function addCommonAttr(shape: Shape) {
    shape.rotation = 0;
    shape.isVisible = true;
    shape.isLocked = false;
}

export function newDocument(documentName: string, repo: Repository): Document {
    const dId = uuid();
    const pageList = new BasicArray<PageListItem>();
    const document = new Document(dId, '', documentName, pageList, repo);
    return document;
}

export function newPage(name: string): Page {
    templage_page.id = uuid();
    templage_page.name = name;
    return importPage(noeffectCtx, templage_page as types.Page);
}

export function newGroupShape(name: string): GroupShape {
    template_group_shape.id = uuid();
    template_group_shape.name = name // i18n
    const group = importGroupShape(noeffectCtx, template_group_shape as types.GroupShape);
    addCommonAttr(group)
    return group;
}

export function newStyle(): Style {
    const windingRule = types.WindingRule.EvenOdd;
    const blur = new Blur(false, new Point2D(0, 0), 0, types.BlurType.Gaussian);
    const borderOptions = new BorderOptions(false, types.LineCapStyle.Butt, types.LineJoinStyle.Miter);
    const borders = new BasicArray<Border>();
    const contextSettings = new ContextSettings(types.BlendMode.Normal, 1);
    const fillColor = new Color(1, 216, 216, 216);
    const fill = new Fill(true, FillType.SolidColor, fillColor, contextSettings);
    const fills = new BasicArray<Fill>();
    const innerShadows = new BasicArray<Shadow>();
    const shadows = new BasicArray<Shadow>();
    const style = new Style(10, windingRule, blur, borderOptions, borders, contextSettings, fills, innerShadows, shadows);
    style.fills.push(fill);
    return style;
}

export function newArtboard(name: string, frame: ShapeFrame): Artboard {
    template_artboard.id = uuid();
    template_artboard.name = name;
    template_artboard.frame = frame;
    const artboard = importArtboard(noeffectCtx, template_artboard as types.Artboard);
    const contextSettings = new ContextSettings(types.BlendMode.Normal, 1);
    const fillColor = new Color(1, 255, 255, 255);
    const fill = new Fill(true, FillType.SolidColor, fillColor, contextSettings);
    artboard.style.fills.push(fill);
    artboard.hasBackgroundColor = true;
    artboard.isVisible = true;
    artboard.isLocked = false;
    return artboard
}

export function newRectShape(name: string, frame: ShapeFrame): RectShape {
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const radius = new RectRadius(0, 0, 0, 0);
    const shape = new RectShape(id, name, types.ShapeType.Rectangle, frame, style, types.BoolOp.None, curvePoint, radius);
    addCommonAttr(shape);
    return shape;
}

export function newOvalShape(name: string, frame: ShapeFrame): OvalShape {
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const ellipse = new Ellipse(79.5, 76, 79, 75.5);
    const shape = new OvalShape(id, name, types.ShapeType.Oval, frame, style, types.BoolOp.None, curvePoint, ellipse);
    addCommonAttr(shape);
    return shape;
}

export function newLineShape(name: string, frame: ShapeFrame): LineShape {
    const style = newStyle();
    const sPoint = new CurvePoint(0, new Point2D(1, 0), new Point2D(1, 0), false, false, CurveMode.None, new Point2D(1, 0));
    const ePoint = new CurvePoint(0, new Point2D(1, 0), new Point2D(1, 0), false, false, CurveMode.None, new Point2D(0, 1));
    const curvePoint = new BasicArray<CurvePoint>(sPoint, ePoint);
    const id = uuid();
    const shape = new LineShape(id, name, types.ShapeType.Line, frame, style, types.BoolOp.None, curvePoint);
    addCommonAttr(shape);
    return shape;
}

export function newArrowShape(name: string, frame: ShapeFrame): LineShape {
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const shape = new PathShape(id, name, types.ShapeType.Line, frame, style, types.BoolOp.None, curvePoint);
    addCommonAttr(shape);
    return shape;
}

export function newTextShape(name: string, frame: ShapeFrame): TextShape {
    template_text_shape.id = uuid();
    template_text_shape.name = name // i18n
    const textshape = importTextShape(noeffectCtx, template_text_shape as types.TextShape);
    return textshape;
}
