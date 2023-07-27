import { Color } from "../../data/style";
import { Document } from "../../data/document";
import { Page } from "../../data/page";
import { GroupShape, PathShape, RectShape, Shape, ShapeType, TextShape } from "../../data/shape";
import { Artboard } from "../../data/artboard";
import { ParaAttr, ParaAttrSetter, SpanAttr, SpanAttrSetter, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "../../data/classes";
import { BoolOp, BulletNumbersBehavior, BulletNumbersType, Point2D, StrikethroughType, TextTransformType, UnderlineType } from "../../data/typesdefine";

export * from "./fill";
export * from "./border";

export function pageInsert(document: Document, page: Page, index: number) {
    document.insertPage(index, page)
}
export function pageDelete(document: Document, index: number) {
    document.deletePageAt(index)
}
export function pageModifyName(document: Document, pageId: string, name: string) {
    const item = document.pagesList.find(p => p.id === pageId);
    if (item) item.name = name;
}
export function pageMove(document: Document, fromIdx: number, toIdx: number) {
    const pagesmgr = document.pagesMgr;
    const item = document.pagesList.splice(fromIdx, 1)[0]
    if (item) {
        document.pagesList.splice(toIdx, 0, item)
    }
}

export function shapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number, needUpdateFrame: { shape: Shape, page: Page }[]): Shape {
    shape = parent.addChildAt(shape, index);
    page.onAddShape(shape);
    // updateFrame(shape);
    needUpdateFrame.push({ shape, page });
    return shape;
}
export function shapeDelete(page: Page, parent: GroupShape, index: number, needUpdateFrame: { shape: Shape, page: Page }[]) {
    const shape = parent.removeChildAt(index);
    if (shape) {
        page.onRemoveShape(shape);
        if (parent.childs.length > 0) {
            needUpdateFrame.push({ shape: parent.childs[0], page })
        }
    }
}
export function shapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number, needUpdateFrame: { shape: Shape, page: Page }[]) {
    const shape = parent.childs.splice(index, 1)[0]
    if (shape) {
        parent2.childs.splice(index2, 0, shape);
        // updateFrame(shape)
        needUpdateFrame.push({ shape, page })
        if (parent.id !== parent2.id && parent.childs.length > 0) {
            needUpdateFrame.push({ shape: parent.childs[0], page })
        }
    }
}

export function shapeModifyX(page: Page, shape: Shape, x: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // translateTo(shape, x, y)
    // needUpdateFrame.push(shape);
    const frame = shape.frame;
    if (x !== frame.x) {
        frame.x = x;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyY(page: Page, shape: Shape, y: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // translateTo(shape, x, y)
    // needUpdateFrame.push(shape);
    const frame = shape.frame;
    if (y !== frame.y) {
        // frame.x = x;
        frame.y = y;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyWH(page: Page, shape: Shape, w: number, h: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    const frame = shape.frame;
    if (w !== frame.width || h !== frame.height) {
        // frame.width = w;
        // frame.height = h;
        shape.setFrameSize(w, h);
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyRotate(page: Page, shape: Shape, rotate: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    if (rotate !== shape.rotation) {
        shape.rotation = rotate;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyConstrainerProportions(shape: Shape, prop: boolean) {
    shape.constrainerProportions = prop;
}
export function shapeModifyName(shape: Shape, name: string) {
    shape.name = name;
}
export function shapeModifyVisible(shape: Shape, isVisible: boolean) {
    shape.isVisible = isVisible;
}
export function shapeModifyLock(shape: Shape, isLocked: boolean) {
    shape.isLocked = isLocked;
}
export function shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    shape.isFlippedHorizontal = hflip;
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
}
export function shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    shape.isFlippedVertical = vflip;
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
}
export function shapeModifyResizingConstraint(shape: Shape, resizingConstraint: number) {
    shape.setResizingConstraint(resizingConstraint);
}
export function shapeModifyRadius(shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
    shape.setRadius(lt, rt, rb, lb);
}
export function shapeModifyFixedRadius(shape: GroupShape, fixedRadius: number | undefined) {
    shape.fixedRadius = fixedRadius;
}
export function shapeModifyBackgroundColor(shape: Shape, color: Color) {
    if (shape.type === ShapeType.Artboard) {
        (shape as Artboard).setArtboardColor(color);
    }
}
export function shapeModifyBoolOp(shape: Shape, op: BoolOp | undefined) {
    shape.boolOp = op;
}
export function shapeModifyBoolOpShape(shape: GroupShape, isOpShape: boolean | undefined) {
    if (isOpShape) shape.isBoolOpShape = true;
    else shape.isBoolOpShape = undefined;
}

export function insertSimpleText(shape: TextShape, text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
    shape.text.insertText(text, index, props)
}
export function insertComplexText(shape: TextShape, text: Text, index: number) {
    shape.text.insertFormatText(text, index);
}
export function deleteText(shape: TextShape, index: number, count: number): Text | undefined {
    return shape.text.deleteText(index, count);
}
export function textModifyColor(shape: TextShape, idx: number, len: number, color: Color | undefined) {
    const attr = new SpanAttrSetter();
    attr.color = color;
    attr.colorIsSet = true;
    const ret = shape.text.formatText(idx, len, { attr })
    const spans = ret.spans;
    const origin: { color: Color | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ color: span.color, length: span.length })
    })
    return origin;
}
export function textModifyFontName(shape: TextShape, idx: number, len: number, fontname: string | undefined) {
    const attr = new SpanAttrSetter();
    attr.fontName = fontname;
    attr.fontNameIsSet = true;
    const ret = shape.text.formatText(idx, len, { attr })
    const spans = ret.spans;
    const origin: { fontName: string | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ fontName: span.fontName, length: span.length })
    })
    return origin;
}
export function textModifyFontSize(shape: TextShape, idx: number, len: number, fontsize: number | undefined) {
    const attr = new SpanAttrSetter();
    attr.fontSize = fontsize;
    attr.fontSizeIsSet = true;
    const ret = shape.text.formatText(idx, len, { attr })
    const spans = ret.spans;
    const origin: { fontSize: number | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ fontSize: span.fontSize, length: span.length })
    })
    return origin;
}
export function shapeModifyTextColor(shape: TextShape, color: Color | undefined) {
    const text = shape.text;
    const origin = text.attr?.color;
    text.setDefaultTextColor(color);
    return origin;
}
export function shapeModifyTextFontName(shape: TextShape, fontName: string | undefined) {
    const text = shape.text;
    const origin = text.attr?.fontName;
    text.setDefaultFontName(fontName);
    return origin;
}
export function shapeModifyTextFontSize(shape: TextShape, fontSize: number) {
    const text = shape.text;
    const origin = text.attr?.fontSize;
    text.setDefaultFontSize(fontSize);
    return origin;
}
export function shapeModifyTextBehaviour(page: Page, shape: TextShape, textBehaviour: TextBehaviour) {
    const text = shape.text;
    if (textBehaviour === TextBehaviour.Flexible) {
        // default
        if (!text.attr || !text.attr.textBehaviour || text.attr.textBehaviour === TextBehaviour.Flexible) return TextBehaviour.Flexible;
    }
    const origin = text.attr?.textBehaviour;
    text.setTextBehaviour(textBehaviour);
    return origin ?? TextBehaviour.Flexible;
}
export function shapeModifyTextVerAlign(shape: TextShape, verAlign: TextVerAlign) {
    const text = shape.text;
    if (verAlign === TextVerAlign.Top) {
        // default
        if (!text.attr || !text.attr.verAlign || text.attr.verAlign === TextVerAlign.Top) return TextVerAlign.Top;
    }
    const origin = text.attr?.verAlign;
    text.setTextVerAlign(verAlign);
    return origin ?? TextVerAlign.Top;
}
export function textModifyHorAlign(shape: TextShape, horAlign: TextHorAlign, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.alignment = horAlign;
    attr.alignmentIsSet = true;
    const ret = shape.text.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { alignment: TextHorAlign | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ alignment: para.alignment, length: para.length })
    })
    return origin;
}
export function shapeModifyTextDefaultHorAlign(shape: TextShape, horAlign: TextHorAlign) {
    const text = shape.text;
    if (horAlign === TextHorAlign.Left) {
        // default
        if (!text.attr || !text.attr.alignment || text.attr.alignment === TextHorAlign.Left) return TextHorAlign.Left;
    }
    const origin = text.attr?.alignment;
    text.setDefaultTextHorAlign(horAlign);
    return origin ?? TextHorAlign.Left;
}
export function textModifyMinLineHeight(shape: TextShape, minLineheight: number, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.minimumLineHeight = minLineheight;
    attr.minimumLineHeightIsSet = true;
    const ret = shape.text.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { minimumLineHeight?: number, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ minimumLineHeight: para.minimumLineHeight, length: para.length })
    })
    return origin;
}
export function textModifyMaxLineHeight(shape: TextShape, maxLineheight: number, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.maximumLineHeight = maxLineheight;
    attr.maximumLineHeightIsSet = true;
    const ret = shape.text.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { maximumLineHeight: number | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ maximumLineHeight: para.maximumLineHeight, length: para.length })
    })
    return origin;
}
export function textModifyParaKerning(shape: TextShape, kerning: number | undefined, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.kerning = kerning;
    attr.kerningIsSet = true;
    const ret = shape.text.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { kerning: number | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ kerning: para.kerning, length: para.length })
    })
    return origin;
}
export function textModifySpanKerning(shape: TextShape, kerning: number | undefined, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.kerning = kerning;
    attr.kerningIsSet = true;
    const ret = shape.text.formatText(index, len, { attr: attr })
    const spans = ret.spans;
    const origin: { kerning: number | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ kerning: span.kerning, length: span.length })
    })
    return origin;
}
export function textModifyParaSpacing(shape: TextShape, paraSpacing: number, index: number, len: number) {
    const attr = new ParaAttrSetter();
    attr.paraSpacing = paraSpacing;
    attr.paraSpacingIsSet = true;
    const ret = shape.text.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { paraSpacing: number | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ paraSpacing: para.paraSpacing, length: para.length })
    })
    return origin;
}
export function shapeModifyTextDefaultMinLineHeight(shape: TextShape, minLineheight: number) {
    const text = shape.text;
    const origin = text.attr?.minimumLineHeight;
    text.setDefaultMinLineHeight(minLineheight);
    return origin ?? 0;
}
export function shapeModifyTextDefaultMaxLineHeight(shape: TextShape, maxLineheight: number) {
    const text = shape.text;
    const origin = text.attr?.maximumLineHeight;
    text.setDefaultMaxLineHeight(maxLineheight);
    return origin ?? 0;
}

export function textModifySpanTransfrom(shape: TextShape, transform: TextTransformType | undefined, index: number, len: number) {
    // 句属性
    const attr = new SpanAttrSetter();
    attr.transform = transform;
    attr.transformIsSet = true;
    const ret = shape.text.formatText(index, len, { attr: attr })
    const spans = ret.spans;
    const origin: { transform: TextTransformType | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ transform: span.transform, length: span.length })
    })
    return origin;
}
export function textModifyParaTransfrom(shape: TextShape, transform: TextTransformType | undefined, index: number, len: number) {
    // 段落属性
    const attr = new ParaAttrSetter();
    attr.transform = transform;
    attr.transformIsSet = true;
    const ret = shape.text.formatText(index, len, { paraAttr: attr })
    const paras = ret.paras;
    const origin: { transform: TextTransformType | undefined, length: number }[] = [];
    paras.forEach((para) => {
        origin.push({ transform: para.transform, length: para.length })
    })
    return origin;
}
export function shapeModifyTextTransform(shape: TextShape, transform: TextTransformType | undefined) {
    const text = shape.text;
    const origin = text.attr?.transform;
    text.setDefaultTransform(transform);
    return origin ?? 0;
}
export function shapeModifyTextKerning(shape: TextShape, kerning: number) {

}
export function shapeModifyTextParaSpacing(shape: TextShape, paraSpacing: number) {

}
export function shapeModifyTextUnderline(shape: TextShape, underline: UnderlineType | undefined) {

}
export function shapeModifyStrikethrough(shape: TextShape, strikethrouth: StrikethroughType | undefined) {

}
export function shapeModifyTextDefaultBold(shape: TextShape, bold: boolean) {

}
export function shapeModifyTextDefaultItalic(shape: TextShape, italic: boolean) {

}

export function textModifyHighlightColor(shape: TextShape, idx: number, len: number, color: Color | undefined) {
    const attr = new SpanAttrSetter();
    attr.highlight = color;
    attr.highlightIsSet = true;
    const ret = shape.text.formatText(idx, len, { attr })
    const spans = ret.spans;
    const origin: { highlight: Color | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ highlight: span.highlight, length: span.length })
    })
    return origin;
}
export function textModifyUnderline(shape: TextShape, underline: UnderlineType | undefined, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.underline = underline;
    attr.underlineIsSet = true;
    const ret = shape.text.formatText(index, len, { attr })
    const spans = ret.spans;
    const origin: { underline: UnderlineType | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ underline: span.underline, length: span.length })
    })
    return origin;
}
export function textModifyStrikethrough(shape: TextShape, strikethrough: StrikethroughType | undefined, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.strikethrough = strikethrough;
    attr.strikethroughIsSet = true;
    const ret = shape.text.formatText(index, len, { attr })
    const spans = ret.spans;
    const origin: { strikethrough: StrikethroughType | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ strikethrough: span.strikethrough, length: span.length })
    })
    return origin;
}
export function textModifyBold(shape: TextShape, bold: boolean, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.bold = bold;
    attr.boldIsSet = true;
    const ret = shape.text.formatText(index, len, { attr })
    const spans = ret.spans;
    const origin: { bold: boolean | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ bold: span.bold, length: span.length })
    })
    return origin;
}
export function textModifyItalic(shape: TextShape, italic: boolean, index: number, len: number) {
    const attr = new SpanAttrSetter();
    attr.italic = italic;
    attr.italicIsSet = true;
    const ret = shape.text.formatText(index, len, { attr })
    const spans = ret.spans;
    const origin: { italic: boolean | undefined, length: number }[] = [];
    spans.forEach((span) => {
        origin.push({ italic: span.italic, length: span.length })
    })
    return origin;
}

export function textModifyBulletNumbersType(shape: TextShape, type: BulletNumbersType, index: number, len: number) {
    shape.text.setBulletNumbersType(type, index, len);
}

export function textModifyBulletNumbersStart(shape: TextShape, start: number, index: number, len: number) {
    shape.text.setBulletNumbersStart(start, index, len);
}

export function textModifyBulletNumbersBehavior(shape: TextShape, behavior: BulletNumbersBehavior, index: number, len: number) {
    shape.text.setBulletNumbersBehavior(behavior, index, len);
}

export function textModifyParaIndent(shape: TextShape, indent: number | undefined, index: number, len: number) {
    shape.text.setParaIndent(indent, index, len);
}

export function shapeModifyCurvPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
    const p = shape.points[index];
    p.point.x = point.x;
    p.point.y = point.y;
}
export function shapeModifyCurvFromPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
    const p = shape.points[index];
    p.curveFrom.x = point.x;
    p.curveFrom.y = point.y;
}
export function shapeModifyCurvToPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
    const p = shape.points[index];
    p.curveTo.x = point.x;
    p.curveTo.y = point.y;
}