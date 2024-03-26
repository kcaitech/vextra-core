import { v4 as uuid } from "uuid";
import { Page } from "../data/page";
import { Artboard } from "../data/artboard";
import { Document, PageListItem } from "../data/document";
import {
    GroupShape,
    LineShape,
    OvalShape,
    PathShape,
    SymbolShape,
    RectShape,
    Shape,
    TextShape,
    ImageShape,
    PathShape2,
    PathSegment,
    CutoutShape,
    SymbolUnionShape,
    BoolShape
} from "../data/shape";
import { ContactShape } from "../data/contact"
import * as types from "../data/typesdefine"
import {
    importArtboard,
    importGroupShape,
    importPage,
    importText,
    importShapeFrame, importTextShape, importBoolShape
} from "../data/baseimport";
import template_group_shape from "./template/group-shape.json";
import template_bool_shape from "./template/bool-shape.json";
import templage_page from "./template/page.json";
import template_artboard from "./template/artboard.json"
import template_text_shape from "./template/text-shape.json"
import {
    Border,
    Color,
    CurveMode,
    CurvePoint,
    Ellipse,
    Fill,
    FillType,
    Para,
    ParaAttr,
    Path,
    ShapeFrame,
    Span,
    Style,
    Text,
    UserInfo,
    Shadow,
    BorderStyle,
    SymbolRefShape,
    TextAttr,
} from "../data/classes";
import { BasicArray, BasicMap } from "../data/basic";
import { Repository } from "../data/transact";
import { Comment } from "../data/comment";
import { ResourceMgr } from "../data/basic";
import { TableShape } from "../data/table";

export { newText, newText2 } from "../data/textutils";
// import i18n from '../../i18n' // data不能引用外面工程的内容
import { ContactForm, CrdtNumber } from "../data/baseclasses";
import { Matrix } from "../basic/matrix";
import { ResizingConstraints2 } from "../data/consts";
import { SymbolMgr } from "../data/symbolmgr";
import { mergeParaAttr, mergeSpanAttr, newText } from "../data/textutils";

export function addCommonAttr(shape: Shape) {
    shape.rotation = 0;
    shape.isVisible = true;
    shape.isLocked = false;
    shape.constrainerProportions = false;
    shape.nameIsFixed = false;
    shape.resizingConstraint = ResizingConstraints2.Default;
}

export function newDocument(documentName: string, repo: Repository): Document {
    const dId = uuid();
    const pageList = new BasicArray<PageListItem>();
    return new Document(dId, "", "", new BasicMap(), documentName, pageList, repo);
}

export function newPage(name: string): Page {
    templage_page.id = uuid();
    templage_page.name = name;
    // const fillColor = new Color(1, 239, 239, 239);
    // const fill = new Fill(uuid(), true, FillType.SolidColor, fillColor);
    const page = importPage(templage_page as types.Page)
    // page.style.fills.push(fill);
    page.backgroundColor = new Color(1, 239, 239, 239);
    return page;
}

export function newGroupShape(name: string, style?: Style): GroupShape {
    template_group_shape.id = uuid();
    template_group_shape.name = name // i18n
    const group = importGroupShape(template_group_shape as types.GroupShape);
    if (style) group.style = style;
    addCommonAttr(group);
    return group;
}

export function newBoolShape(name: string, style?: Style): BoolShape {
    template_bool_shape.id = uuid();
    template_bool_shape.name = name // i18n
    const group = importBoolShape(template_bool_shape as types.BoolShape);
    if (style) group.style = style;
    addCommonAttr(group);
    return group;
}

/**
 * @description 给未进入文档(guard之前)的图形设置frame
 */
export function initFrame(shape: Shape, frame: ShapeFrame) {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    shape.frame = importShapeFrame((frame));
}

export function newSolidColorFill(): Fill {
    const fillColor = new Color(1, 216, 216, 216);
    return new Fill(new BasicArray(), uuid(), true, FillType.SolidColor, fillColor);
}

export function newStyle(): Style {
    const borders = new BasicArray<Border>();
    const fill = newSolidColorFill();
    const fills = new BasicArray<Fill>();
    const style = new Style(borders, fills, new BasicArray<Shadow>());
    style.fills.push(fill);
    // style.contextSettings = new ContextSettings(BlendMode.Normal, 1);
    return style;
}

export function newflatStyle(): Style {
    const borders = new BasicArray<Border>();
    const fills = new BasicArray<Fill>();
    const shadows = new BasicArray<Shadow>();
    const style = new Style(borders, fills, shadows);
    // style.contextSettings = new ContextSettings(BlendMode.Normal, 1);
    return style;
}

export function newArtboard(name: string, frame: ShapeFrame, fill?: Fill): Artboard {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    template_artboard.id = uuid();
    template_artboard.name = name;
    template_artboard.frame = frame;

    const artboard = importArtboard(template_artboard as types.Artboard);

    if (fill) {
        artboard.style.fills.push(fill);
    }

    addCommonAttr(artboard);

    artboard.fixedRadius = 0;

    return artboard
}

export function newArtboard2(name: string, frame: ShapeFrame): Artboard {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    template_artboard.id = uuid();
    template_artboard.name = name;
    template_artboard.frame = frame;

    const artboard = importArtboard(template_artboard as types.Artboard);

    const fillColor = new Color(1, 255, 255, 255);
    const fill = new Fill(new BasicArray(), uuid(), true, FillType.SolidColor, fillColor);
    artboard.style.fills.push(fill);

    addCommonAttr(artboard);

    artboard.fixedRadius = 0;

    return artboard
}

export function newPathShape(name: string, frame: ShapeFrame, path: Path, style?: Style): PathShape | PathShape2 {
    frame.width = frame.width || 1;
    frame.height = frame.height || 1;

    style = style || newStyle();
    const id = uuid();
    const segs = path.toCurvePoints(frame.width, frame.height);
    if (segs.length <= 1) {
        const seg = segs[0];
        const points = seg?.points || [];
        const isClosed = seg?.isClosed || false;
        const curvePoint = new BasicArray<CurvePoint>(...points);
        const shape = new PathShape(new BasicArray(), id, name, types.ShapeType.Path, frame, style, curvePoint, !!isClosed);
        addCommonAttr(shape);
        return shape;
    } else {
        const pathsegs = new BasicArray<PathSegment>();
        segs.forEach((seg, i) => {
            const points = seg.points;
            const isClosed = seg.isClosed || false;
            const curvePoint = new BasicArray<CurvePoint>(...points);
            pathsegs.push(new PathSegment([i] as BasicArray<number>, uuid(), curvePoint, isClosed))
        })
        const shape = new PathShape2(new BasicArray(), id, name, types.ShapeType.Path2, frame, style, pathsegs);
        addCommonAttr(shape);
        return shape;
    }
}

export function newRectShape(name: string, frame: ShapeFrame): RectShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    curvePoint.push(p1, p2, p3, p4);
    const shape = new RectShape(new BasicArray(), id, name, types.ShapeType.Rectangle, frame, style, curvePoint, true);
    addCommonAttr(shape);
    return shape;
}

// 三次贝塞尔曲线绘制椭圆
// https://juejin.cn/post/7212650952532459578
// https://pomax.github.io/bezierinfo/#circles_cubic
export function newOvalShape(name: string, frame: ShapeFrame): OvalShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const ellipse = new Ellipse(0, 0, 0, 0);

    // 上
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0.5, 1, CurveMode.Mirrored);
    p1.hasFrom = true;
    p1.hasTo = true;
    p1.fromX = 0.775892388889507;
    p1.fromY = 1;
    p1.toX = 0.224107611110493;
    p1.toY = 1;

    // 右
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0.5, CurveMode.Mirrored);
    p2.hasFrom = true;
    p2.hasTo = true;
    p2.fromX = 1;
    p2.fromY = 0.224107611110493;
    p2.toX = 1;
    p2.toY = 0.775892388889507;

    // 下
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 0.5, 0, CurveMode.Mirrored);
    p3.hasFrom = true;
    p3.hasTo = true;
    p3.fromX = 0.224107611110493;
    p3.fromY = 0;
    p3.toX = 0.775892388889507;
    p3.toY = 0;

    // 左
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 0.5, CurveMode.Mirrored);
    p4.hasFrom = true;
    p4.hasTo = true;
    p4.fromX = 0;
    p4.fromY = 0.775892388889507;
    p4.toX = 0;
    p4.toY = 0.224107611110493;

    curvePoint.push(p1, p2, p3, p4);
    const shape = new OvalShape([4] as BasicArray<number>, id, name, types.ShapeType.Oval, frame, style, curvePoint, true, ellipse);
    addCommonAttr(shape);
    return shape;
}

export function newLineShape(name: string, frame: ShapeFrame): LineShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const style = newflatStyle();
    const sPoint = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight);
    const ePoint = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight);
    frame.height = 1;
    const curvePoint = new BasicArray<CurvePoint>(sPoint, ePoint);
    const border = new Border([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 0, 0, 0), types.BorderPosition.Center, 1, new BorderStyle(0, 0));
    style.borders.push(border);
    const shape = new LineShape(new BasicArray(), uuid(), name, types.ShapeType.Line, frame, style, curvePoint, false);
    addCommonAttr(shape);
    return shape;
}

export function newArrowShape(name: string, frame: ShapeFrame): LineShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const style = newflatStyle();
    style.endMarkerType = types.MarkerType.OpenArrow;
    const sPoint = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight);
    const ePoint = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight);
    frame.height = 1;
    const curvePoint = new BasicArray<CurvePoint>(sPoint, ePoint);
    const border = new Border([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 0, 0, 0), types.BorderPosition.Center, 1, new BorderStyle(0, 0));
    style.borders.push(border);
    const shape = new LineShape(new BasicArray(), uuid(), name, types.ShapeType.Line, frame, style, curvePoint, false);
    addCommonAttr(shape);
    return shape;
}

// 后续需要传入字体、字号、颜色信息
export function newDefaultTextShape(name: string, attr: TextAttr, frame?: ShapeFrame): TextShape {
    if (frame && (frame.x === 0 || frame.y === 0)) throw new Error();
    template_text_shape.id = uuid();
    template_text_shape.name = name;
    // 后续需要传入字体、字号、颜色信息
    const textshape: TextShape = importTextShape(template_text_shape as types.TextShape);
    if (frame) textshape.frame = frame;
    textshape.text = newText(attr);
    addCommonAttr(textshape);
    return textshape;
}

export function newTextShape(name: string, frame?: ShapeFrame): TextShape {
    if (frame && (frame.x === 0 || frame.y === 0)) throw new Error();
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

export function newImageShape(name: string, frame: ShapeFrame, mediasMgr: ResourceMgr<{
    buff: Uint8Array,
    base64: string
}>, ref?: string): ImageShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const id = uuid();
    const style = newStyle();
    const curvePoint = new BasicArray<CurvePoint>();
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    curvePoint.push(p1, p2, p3, p4);
    const img = new ImageShape(new BasicArray(), id, name, types.ShapeType.Image, frame, style, curvePoint, true, ref || '');
    img.setImageMgr(mediasMgr);
    addCommonAttr(img);
    img.style.fills.length = 0;
    return img;
}

export function newTable(name: string, frame: ShapeFrame, rowCount: number, columCount: number, mediasMgr: ResourceMgr<{
    buff: Uint8Array,
    base64: string
}>): TableShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    // template_table_shape.id = uuid();
    // template_table_shape.name = name // i18n
    // template_table_shape.rowHeights.length = 0;
    // template_table_shape.colWidths.length = 0;

    const table = new TableShape(
        new BasicArray(),
        uuid(),
        name,
        types.ShapeType.Table,
        frame,
        newStyle(),
        new BasicMap(),
        new BasicArray(),
        new BasicArray());// importTableShape(template_table_shape as types.TableShape);
    // 行高
    for (let ri = 0; ri < rowCount; ri++) {
        table.rowHeights.push(new CrdtNumber(uuid(), [ri] as BasicArray<number>, 1));
    }
    // 列宽
    for (let ci = 0; ci < columCount; ci++) {
        table.colWidths.push(new CrdtNumber(uuid(), [ci] as BasicArray<number>, 1));
    }
    // table.updateTotalWeights();
    table.frame = frame;
    table.style.borders.push(new Border([0] as BasicArray<number>,
        uuid(),
        true,
        FillType.SolidColor,
        new Color(0.5, 0, 0, 0),
        types.BorderPosition.Center,
        1,
        new BorderStyle(0, 0)));
    addCommonAttr(table)
    const fillColor = new Color(1, 255, 255, 255);
    const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, fillColor);
    const fills = new BasicArray<Fill>();
    fills.push(fill);
    table.style.fills = fills;
    table.setImageMgr(mediasMgr);
    return table;
}

export function newContact(name: string, frame: ShapeFrame, apex?: ContactForm): ContactShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const style = newflatStyle();

    style.endMarkerType = types.MarkerType.OpenArrow;

    const sPoint = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight);
    const ePoint = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight);
    const curvePoint = new BasicArray<CurvePoint>(sPoint, ePoint);

    const border = new Border([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 128, 128, 128), types.BorderPosition.Center, 2, new BorderStyle(0, 0));

    style.borders.push(border);

    const text = new Text(new BasicArray());
    const para = new Para('添加文本\n', new BasicArray());
    para.attr = new ParaAttr();
    para.attr.minimumLineHeight = 24;
    text.paras.push(para);
    const span = new Span(para.length);
    span.fontName = "PingFangSC-Regular";
    span.fontSize = 14;
    span.color = new Color(0.85, 0, 0, 0);
    para.spans.push(span);

    const shape = new ContactShape(new BasicArray(), uuid(), name, types.ShapeType.Contact, frame, style, curvePoint, false, false, text, false);

    shape.from = apex;
    shape.to = undefined;

    shape.fixedRadius = 12;

    addCommonAttr(shape);

    return shape;
}

export function newCutoutShape(name: string, frame: ShapeFrame): CutoutShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const borders = new BasicArray<Border>();
    const fills = new BasicArray<Fill>();
    const style = new Style(borders, fills, new BasicArray<Shadow>());
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    const p5 = new CurvePoint([4] as BasicArray<number>, uuid(), 0, 0.00001, CurveMode.Straight); // lt
    curvePoint.push(p1, p2, p3, p4, p5);
    const shape = new CutoutShape(new BasicArray(), id, name, types.ShapeType.Cutout, frame, style, curvePoint, false, true);
    addCommonAttr(shape);
    return shape;
}

export function newSymbolShape(name: string, frame: ShapeFrame, style?: Style): SymbolShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const compo = new SymbolShape(
        new BasicArray(),
        uuid(),
        name,
        types.ShapeType.Symbol,
        frame,
        newflatStyle(),
        new BasicArray(),
        new BasicMap(),
        // createNormalPoints()
    );
    if (style) compo.style = style;
    addCommonAttr(compo);
    return compo;
}

export function newSymbolShapeUnion(name: string, frame: ShapeFrame): SymbolUnionShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const style = newflatStyle();
    const union = new SymbolUnionShape(
        new BasicArray(),
        uuid(),
        name,
        types.ShapeType.SymbolUnion,
        frame,
        style,
        new BasicArray(),
        new BasicMap(),
        // createNormalPoints()
    );
    addCommonAttr(union);
    return union;
}

export function newSymbolRefShape(name: string, frame: ShapeFrame, refId: string, symbol_mgr: SymbolMgr): SymbolRefShape {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    const ref = new SymbolRefShape(new BasicArray(), uuid(), name, types.ShapeType.SymbolRef, frame, newflatStyle(), refId, new BasicMap());
    addCommonAttr(ref);
    ref.setSymbolMgr(symbol_mgr);
    return ref;
}

export function getTransformByEnv(env: GroupShape) {
    const result = { flipH: false, flipV: false, rotation: 0 };

    // flip
    let ohflip = false;
    let ovflip = false;

    let p: Shape | undefined = env;
    while (p) {
        if (p.isFlippedHorizontal) {
            ohflip = !ohflip;
        }
        if (p.isFlippedVertical) {
            ovflip = !ovflip;
        }
        p = p.parent;
    }

    result.flipH = ohflip;
    result.flipV = ovflip;

    // rotate
    const pm = env.matrix2Root();
    const pminverse = pm.inverse;

    const m = new Matrix(pminverse);

    let sina = m.m10;
    let cosa = m.m00;

    if (result.flipH) sina = -sina;
    if (result.flipV) cosa = -cosa;

    let rotate = Math.asin(sina);

    if (cosa < 0) {
        if (sina > 0) rotate = Math.PI - rotate;
        else if (sina < 0) rotate = -Math.PI - rotate;
        else rotate = Math.PI;
    }

    if (!Number.isNaN(rotate)) {
        result.rotation = (rotate / (2 * Math.PI) * 360) % 360;
    }

    return result;
}

export function modifyTransformByEnv(shape: Shape, env: GroupShape) {
    const transform = getTransformByEnv(env);

    shape.isFlippedHorizontal = transform.flipH;
    shape.isFlippedVertical = transform.flipV;

    let r = transform.rotation;

    if (transform.flipH) {
        r = r - 180;
    }
    if (transform.flipV) {
        r = r - 180;
    }

    shape.rotation = r % 360;
}

export function createNormalPoints() {
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb

    return new BasicArray<CurvePoint>(p1, p2, p3, p4);
}