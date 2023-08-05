import { v4 as uuid } from "uuid";
import { Page } from "../data/page";
import { Artboard } from "../data/artboard";
import { Document, PageListItem } from "../data/document";
import { GroupShape, RectShape, PathShape, OvalShape, LineShape, Shape, TextShape, ImageShape, PathShape2, PathSegment } from "../data/shape";
import * as types from "../data/typesdefine"
import { importGroupShape, importPage, importArtboard, importTextShape, importText, importTableShape, importTableCell } from "../io/baseimport";
import template_group_shape from "./template/group-shape.json";
import templage_page from "./template/page.json";
import template_artboard from "./template/artboard.json"
import template_text_shape from "./template/text-shape.json"
import template_table_shape from "./template/table-shape.json"
import template_table_cell from "./template/table-cell.json"
import template_text from "./template/text.json"
import {
    Blur, Point2D, BorderOptions, ContextSettings, CurvePoint,
    Color, Border, Style, Fill, Shadow, ShapeFrame, FillType, Ellipse, CurveMode, UserInfo, Path,
    Text
} from "../data/classes";
import { BasicArray } from "../data/basic";
import { Repository } from "../data/transact";
import { Comment } from "../data/comment";
import { ResourceMgr } from "../data/basic";
import { TableShape } from "../data/table";
// import i18n from '../../i18n' // data不能引用外面工程的内容

export function addCommonAttr(shape: Shape) {
    shape.rotation = 0;
    shape.isVisible = true;
    shape.isLocked = false;
    shape.constrainerProportions = false;
}

export function newDocument(documentName: string, repo: Repository): Document {
    const dId = uuid();
    const pageList = new BasicArray<PageListItem>();
    const document = new Document(dId, "", "", documentName, pageList, repo);
    return document;
}

export function newPage(name: string): Page {
    templage_page.id = uuid();
    templage_page.name = name;
    const fillColor = new Color(1, 239, 239, 239);
    const fill = new Fill(uuid(), true, FillType.SolidColor, fillColor);
    const page = importPage(templage_page as types.Page)
    page.style.fills.push(fill);
    return page;
}

export function newGroupShape(name: string, style?: Style): GroupShape {
    template_group_shape.id = uuid();
    template_group_shape.name = name // i18n
    const group = importGroupShape(template_group_shape as types.GroupShape);
    if (style) group.style = style;
    addCommonAttr(group)
    return group;
}

export function newStyle(): Style {
    const borders = new BasicArray<Border>();
    const fillColor = new Color(1, 216, 216, 216);
    const fill = new Fill(uuid(), true, FillType.SolidColor, fillColor);
    const fills = new BasicArray<Fill>();
    const style = new Style(borders, fills);
    style.fills.push(fill);
    return style;
}

export function newArtboard(name: string, frame: ShapeFrame): Artboard {
    template_artboard.id = uuid();
    template_artboard.name = name;
    template_artboard.frame = frame;
    const artboard = importArtboard(template_artboard as types.Artboard);
    const contextSettings = new ContextSettings(types.BlendMode.Normal, 1);
    const fillColor = new Color(1, 255, 255, 255);
    const fill = new Fill(uuid(), true, FillType.SolidColor, fillColor);
    artboard.style.fills.push(fill);
    artboard.isVisible = true;
    artboard.isLocked = false;
    return artboard
}

export function newPathShape(name: string, frame: ShapeFrame, path: Path, style?: Style): PathShape | PathShape2 {
    style = style || newStyle();
    const id = uuid();
    const segs = path.toCurvePoints(frame.width, frame.height);
    if (segs.length <= 1) {
        const seg = segs[0];
        const points = seg?.points || [];
        const isClosed = seg?.isClosed || false;
        const curvePoint = new BasicArray<CurvePoint>(...points);
        const shape = new PathShape(id, name, types.ShapeType.Path, frame, style, curvePoint, !!isClosed);
        addCommonAttr(shape);
        return shape;
    }
    else {
        const pathsegs = new BasicArray<PathSegment>();
        segs.forEach((seg) => {
            const points = seg.points;
            const isClosed = seg.isClosed || false;
            const curvePoint = new BasicArray<CurvePoint>(...points);
            pathsegs.push(new PathSegment(curvePoint, isClosed))
        })
        const shape = new PathShape2(id, name, types.ShapeType.Path2, frame, style, pathsegs);
        addCommonAttr(shape);
        return shape;
    }
}

export function newRectShape(name: string, frame: ShapeFrame): RectShape {
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const p1 = new CurvePoint(uuid(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(0, 0)); // lt
    const p2 = new CurvePoint(uuid(), 0, new Point2D(1, 0), new Point2D(1, 0), false, false, CurveMode.Straight, new Point2D(1, 0)); // rt
    const p3 = new CurvePoint(uuid(), 0, new Point2D(1, 1), new Point2D(1, 1), false, false, CurveMode.Straight, new Point2D(1, 1)); // rb
    const p4 = new CurvePoint(uuid(), 0, new Point2D(0, 1), new Point2D(0, 1), false, false, CurveMode.Straight, new Point2D(0, 1)); // lb
    curvePoint.push(p1, p2, p3, p4);
    const shape = new RectShape(id, name, types.ShapeType.Rectangle, frame, style, curvePoint, true);
    addCommonAttr(shape);
    return shape;
}

export function newOvalShape(name: string, frame: ShapeFrame): OvalShape {
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const ellipse = new Ellipse(79.5, 76, 79, 75.5);
    const p1 = new CurvePoint(uuid(), 0, new Point2D(0.7761423749, 1), new Point2D(0.2238576251, 1), true, true, CurveMode.Mirrored, new Point2D(0.5, 1));
    const p2 = new CurvePoint(uuid(), 0, new Point2D(1, 0.2238576251), new Point2D(1, 0.7761423749), true, true, CurveMode.Mirrored, new Point2D(1, 0.5));
    const p3 = new CurvePoint(uuid(), 0, new Point2D(0.2238576251, 0), new Point2D(0.7761423749, 0), true, true, CurveMode.Mirrored, new Point2D(0.5, 0));
    const p4 = new CurvePoint(uuid(), 0, new Point2D(0, 0.7761423749), new Point2D(0, 0.2238576251), true, true, CurveMode.Mirrored, new Point2D(0, 0.5));
    curvePoint.push(p1, p2, p3, p4);
    const shape = new OvalShape(id, name, types.ShapeType.Oval, frame, style, curvePoint, true, ellipse);
    addCommonAttr(shape);
    return shape;
}

export function newLineShape(name: string, frame: ShapeFrame): LineShape {
    const style = newStyle();
    const sPoint = new CurvePoint(uuid(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.None, new Point2D(0, 0));
    const ePoint = new CurvePoint(uuid(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.None, new Point2D(1, 1));
    const curvePoint = new BasicArray<CurvePoint>(sPoint, ePoint);
    const id = uuid();
    const shape = new LineShape(id, name, types.ShapeType.Line, frame, style, curvePoint, true);
    addCommonAttr(shape);
    return shape;
}

export function newArrowShape(name: string, frame: ShapeFrame): LineShape {
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const shape = new PathShape(id, name, types.ShapeType.Line, frame, style, curvePoint, true);
    addCommonAttr(shape);
    return shape;
}

export function newText(): Text {
    return importText(template_text);
}

// 后续需要传入字体、字号、颜色信息
export function newTextShape(name: string, frame?: ShapeFrame): TextShape {
    template_text_shape.id = uuid();
    template_text_shape.name = name;
    // 后续需要传入字体、字号、颜色信息
    const textshape: TextShape = importTextShape(template_text_shape as types.TextShape);
    if (frame) textshape.frame = frame;
    addCommonAttr(textshape);
    return textshape;
}

export function newTextShapeByText(name: string, text: types.Text): TextShape {
    template_text_shape.id = uuid();
    template_text_shape.name = name;
    const textshape: TextShape = importTextShape(template_text_shape as types.TextShape);
    textshape.text.insertFormatText(importText(text), 0);
    addCommonAttr(textshape);
    return textshape;
}

export function newComment(user: UserInfo, createAt: string, pageId: string, frame: ShapeFrame, content: string, parasiticBody: Shape, rootId?: string, parentId?: string): Comment {
    const id = uuid();
    const comment = new Comment(pageId, id, frame, user, createAt, content, parasiticBody, rootId, parentId);
    return comment;
}

export function newImageShape(name: string, frame: ShapeFrame, ref?: string, mediasMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>): ImageShape {
    const id = uuid();
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const p1 = new CurvePoint(uuid(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(0, 0)); // lt
    const p2 = new CurvePoint(uuid(), 0, new Point2D(1, 0), new Point2D(1, 0), false, false, CurveMode.Straight, new Point2D(1, 0)); // rt
    const p3 = new CurvePoint(uuid(), 0, new Point2D(1, 1), new Point2D(1, 1), false, false, CurveMode.Straight, new Point2D(1, 1)); // rb
    const p4 = new CurvePoint(uuid(), 0, new Point2D(0, 1), new Point2D(0, 1), false, false, CurveMode.Straight, new Point2D(0, 1)); // lb
    curvePoint.push(p1, p2, p3, p4);
    const img = new ImageShape(id, name, types.ShapeType.Image, frame, style, curvePoint, true, ref || '');
    if (mediasMgr) {
        img.setImageMgr(mediasMgr);
    }
    addCommonAttr(img);
    return img;
}

export function newTable(name: string, frame: ShapeFrame, rowCount: number, columCount: number, mediasMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>): TableShape {
    template_table_shape.id = uuid();
    template_table_shape.name = name // i18n
    const table = importTableShape(template_table_shape as types.TableShape);
    table.frame = frame;
    addCommonAttr(table)

    // cells
    const cellCount = columCount * rowCount;
    for (let ci = 0; ci < cellCount; ci++) {
        template_table_cell.id = uuid();
        const cell = importTableCell(template_table_cell as types.TableCell);
        if (mediasMgr) cell.setImageMgr(mediasMgr);
        table.childs.push(cell);
    }

    // 行高
    const rowHeight = 1 / rowCount;
    for (let ri = 0; ri < rowCount; ri++) {
        table.rowHeights.push(rowHeight);
    }
    // 列宽
    const colWidth = 1 / columCount;
    for (let ci = 0; ci < columCount; ci++) {
        table.colWidths.push(colWidth);
    }

    return table;
}