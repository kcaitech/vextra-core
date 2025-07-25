/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BasicOp, BasicOpImpl } from "./basicop"
import { Page } from "../data/page";
import { Document } from "../data/document";
import {
    CurveMode,
    GroupShape,
    PathSegment,
    PathShape,
    PolygonShape,
    Shape,
    StarShape,
    SymbolShape,
    TextShape,
    Variable,
} from "../data/shape";
import {
    Blur,
    Border,
    BorderMaskType,
    BorderPosition,
    BorderStyle,
    Fill,
    Gradient,
    MarkerType,
    Shadow,
    StyleSheet
} from "../data/style";
import { BulletNumbers, SpanAttr, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "../data/text/text";
import {
    Artboard,
    Color,
    FillMask,
    Guide,
    OverlayBackgroundAppearance,
    OverlayBackgroundInteraction,
    OverlayBackgroundType,
    OverlayMargin,
    OverlayPosition,
    OverlayPositionType,
    Point2D,
    PrototypeConnectionType,
    PrototypeEasingType,
    PrototypeEvents,
    PrototypeNavigationType,
    PrototypeStartingPoint,
    PrototypeTransitionType,
    RadiusMask,
    RectShape,
    ScrollBehavior,
    ScrollDirection,
    Style,
    StyleMangerMember,
    SymbolRefShape,
    TableCell,
    TableCellType,
    TableShape,
    TextMask,
    Transform
} from "../data/classes";
import * as types from "../data/typesdefine";
import {
    BlendMode,
    BlurType,
    BoolOp,
    BorderSideSetting,
    BulletNumbersBehavior,
    BulletNumbersType,
    CornerType,
    ExportFileFormat,
    ExportFormatNameingScheme,
    FillType,
    ImageScaleMode,
    OverrideType,
    PaintFilterType,
    ShadowPosition,
    StackAlign,
    StackMode,
    StackPositioning,
    StackSizing,
    StackWrap,
    StrikethroughType,
    TextTransformType,
    UnderlineType,
} from "../data/typesdefine";
import { _travelTextPara } from "../data/text/texttravel";
import { uuid } from "../basic/uuid";
import {
    AutoLayout,
    ContactForm,
    ContactRole,
    ContextSettings,
    CurvePoint,
    ExportFormat,
    ExportOptions,
    PaintFilter,
    PrototypeEasingBezier,
    PrototypeInteraction
} from "../data/baseclasses";
import { ContactShape } from "../data/contact"
import { TransactDataGuard } from "../data/transact";
import { ShapeView, TableCellView, TextShapeView } from "../dataview";
import { Basic, BasicArray, PaddingDir } from "../data";
import { BorderOp } from "./border";
import { ContactOp } from "./contact";
import { CutoutOp } from "./cutout";
import { FillOp } from "./fill";
import { PageOp } from "./page";
import { PointsOp } from "./points";
import { ShadowOp } from "./shadow";
import { ShapeOp } from "./shape";
import { TableOp } from "./table";
import { TextOp } from "./text";
import { StyleLibOp } from "./stylelib";


// 要支持variable的修改
export type TextShapeLike = TableCellView | TextShapeView


function varParent(_var: Variable) {
    let p = _var.parent;
    while (p && !(p instanceof Shape)) p = p.parent;
    return p;
}

function checkShapeAtPage(page: Page, obj: Shape | Variable | ShapeView) {
    if (obj instanceof ShapeView) obj = obj.data;
    obj = obj instanceof Shape ? (obj instanceof TableCell ? obj.parent as TableShape : obj) : varParent(obj) as Shape;
    const shapeid = obj.id;
    if (!page.getShape(shapeid)) throw new Error("shape not inside page")
}

class TrapHdl { // wap api's function
    private repo: TransactDataGuard;
    constructor(repo: TransactDataGuard) {
        this.repo = repo;
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const ret = Reflect.get(target, propertyKey, receiver);
        if (typeof ret !== "function") return ret;
        return (...args: any[]) => {
            const save = this.repo.transactCtx.settrap;
            this.repo.transactCtx.settrap = false;
            try {
                return ret.apply(target, args);
            }
            finally {
                this.repo.transactCtx.settrap = save;
            }
        }
    }
}

export class OperatorT<T extends BasicOp> {
    private _borderop: BorderOp;
    private _contactop: ContactOp;
    private _cutoutop: CutoutOp;
    private _fillop: FillOp;
    private _pageop: PageOp;
    private _pointsop: PointsOp;
    private _shadowop: ShadowOp;
    private _shapeop: ShapeOp;
    private _stylelibop: StyleLibOp;
    private _tableop: TableOp;
    private _textop: TextOp;

    private constructor(private _basicop: T) { // 仅能从createApi创建
        this._borderop = new BorderOp(_basicop);
        this._contactop = new ContactOp(_basicop);
        this._cutoutop = new CutoutOp(_basicop);
        this._fillop = new FillOp(_basicop);
        this._pageop = new PageOp(_basicop);
        this._pointsop = new PointsOp(_basicop);
        this._shadowop = new ShadowOp(_basicop);
        this._shapeop = new ShapeOp(_basicop);
        this._stylelibop = new StyleLibOp(_basicop);
        this._tableop = new TableOp(_basicop);
        this._textop = new TextOp(_basicop);
    }

    get basicop() {
        return this._basicop;
    }
    get borderop() {
        return this._borderop;
    }
    get contactop() {
        return this._contactop;
    }
    get cutoutop() {
        return this._cutoutop;
    }
    get fillop() {
        return this._fillop;
    }
    get pageop() {
        return this._pageop;
    }
    get pointsop() {
        return this._pointsop;
    }
    get shadowop() {
        return this._shadowop;
    }
    get shapeop() {
        return this._shapeop;
    }
    get stylelibop() {
        return this._stylelibop;
    }
    get tableop() {
        return this._tableop;
    }
    get textop() {
        return this._textop;
    }

    static create(repo: TransactDataGuard, _basicop?: BasicOp): OperatorT<BasicOp>
    static create<T extends BasicOp>(repo: TransactDataGuard, _basicop: T): OperatorT<T>
    static create<T extends BasicOp>(repo: TransactDataGuard, _basicop: T): OperatorT<T> {
        if (!_basicop) _basicop = new BasicOpImpl() as T;
        return new Proxy<OperatorT<T>>(new OperatorT<T>(_basicop), new TrapHdl(repo));
    }

    modifyDocumentName(document: Document, name: string) {
        this._basicop.crdtSetAttr(document, 'name', name);
    }

    styleInsert(document: Document, style: StyleMangerMember) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs?.length) {
            libs = new BasicArray<StyleSheet>();
            const lib = new StyleSheet([0] as BasicArray<number>, document.id, document.name, []);
            libs.push(lib);
            document.stylelib = libs;
        }
        const lib = libs.find(s => s.id === document.id)!;
        this._stylelibop.addStyle(lib, style);
        this._basicop.crdtSetAttr(document.stylesMgr, style.id, style);
    }

    modifyStyleName(document: Document, sheetid: string, maskid: string, name: string) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const mask = lib.variables.find(s => s.id === maskid)
        if (!mask) return
        this._basicop.crdtSetAttr(mask, "name", name);
    }

    modifyStyleDescription(document: Document, sheetid: string, maskid: string, des: string | undefined) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const mask = lib.variables.find(s => s.id === maskid)
        if (!mask) return
        const v = des ? des : ''
        this._basicop.crdtSetAttr(mask, "description", v);
    }

    modifyRadiusMaskRadiusSetting(document: Document, sheetid: string, maskid: string, value: number[]) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const radiusMask = lib.variables.find(s => s.id === maskid)
        if (!(radiusMask && radiusMask instanceof RadiusMask)) return
        this._basicop.crdtSetAttr(radiusMask, "radius", value);
    }

    modifyTextMaskFontName(document: Document, sheetid: string, maskid: string, value: string) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "fontName", value);
    }

    modifyTextMaskWeight(document: Document, sheetid: string, maskid: string, weight: number) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "weight", weight);
    }

    modifyTextMaskItalic(document: Document, sheetid: string, maskid: string, italic: boolean) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "italic", italic);
    }

    modifyTextMaskFontSize(document: Document, sheetid: string, maskid: string, size: number) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "fontSize", size);
    }

    modifyTextMaskAutoHeight(document: Document, sheetid: string, maskid: string, isAuto: boolean) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "autoLineHeight", isAuto);
    }

    modifyTextMaskMinHeight(document: Document, sheetid: string, maskid: string, lineHeight: number | undefined) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "minimumLineHeight", lineHeight);
    }

    modifyTextMaskMaxHeight(document: Document, sheetid: string, maskid: string, lineHeight: number | undefined) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "maximumLineHeight", lineHeight);
    }

    modifyTextMaskKerning(document: Document, sheetid: string, maskid: string, kerning: number) {
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "kerning", kerning);
    }

    modifyTextMaskUnderline(document: Document, sheetid: string, maskid: string, underline: UnderlineType | undefined) {    
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "underline", underline);
    }

    modifyTextMaskStrikethrough(document: Document, sheetid: string, maskid: string, strikethrough: StrikethroughType | undefined) {    
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "strikethrough", strikethrough);
    }

    modifyTextMaskTransform(document: Document, sheetid: string, maskid: string, transform: TextTransformType | undefined) {    
        let libs = document.stylelib as BasicArray<StyleSheet>;
        if (!libs) return
        const lib = libs.find(s => s.id === sheetid);
        if (!lib) return
        const textMask = lib.variables.find(s => s.id === maskid)
        if (!(textMask && textMask instanceof TextMask)) return
        this._basicop.crdtSetAttr(textMask.text, "transform", transform);
    }

    pageInsert(document: Document, page: Page, index: number) {
        this._pageop.pageInsert(document, page, index);
    }
    pageDelete(document: Document, index: number) {
        this._pageop.pageDelete(document, index);
    }
    pageModifyName(document: Document, pageId: string, name: string) {
        this._pageop.pageModifyName(document, pageId, name);
    }
    pageModifyBackground(document: Document, pageId: string, color: Color) {
        const item = document.pagesMgr.getSync(pageId);
        if (!item) return;
        this._basicop.crdtSetAttr(item, "backgroundColor", color);
    }
    pageMove(document: Document, fromIdx: number, toIdx: number) {
        this._pageop.pageMove(document, fromIdx, toIdx);
    }
    insertGuideToPage(page: Page, guide: Guide) {
        if (!page.guides) {
            page.guides = new BasicArray<Guide>();
        }
        this._basicop.crdtArrayInsert(page.guides, page.guides.length, guide);
        return page.guides.length - 1;
    }
    deleteGuideFromPage(page: Page, index: number) {
        if (!page.guides) {
            return;
        }
        const g = page.guides[index];
        if (!g) {
            return;
        }
        this._basicop.crdtArrayRemove(page.guides, index);
        return g;
    }
    insertGuide(shape: Shape, guide: Guide) {
        if (!shape.isContainer) {
            return -1;
        }
        let guides = (shape as Artboard).guides;
        if (!guides) {
            (shape as Artboard).guides = new BasicArray<Guide>();
            guides = (shape as Artboard).guides!;
        }
        this._basicop.crdtArrayInsert(guides, guides.length, guide);
        return guides.length - 1;
    }
    deleteGuide(shape: Shape, index: number) {
        if (!shape.isContainer) {
            return;
        }
        let guides = (shape as Artboard).guides;
        if (!guides) return;
        const guide = guides[index];
        if (!guide) {
            return;
        }
        this._basicop.crdtArrayRemove(guides, index);
        return guide;
    }
    modifyGuideOffset(shape: Shape, index: number, offset: number) {
        if (!shape.isContainer) {
            return;
        }
        let guides = (shape as Artboard).guides;
        const guide = guides?.[index];
        if (!guide) {
            return;
        }
        this._basicop.crdtSetAttr(guide, 'offset', offset);
    }
    // registSymbol(document: Document, symbolId: string, pageId: string) {
    //     (this.basicapi.registSymbol(document, symbolId, pageId));
    // }
    shapeInsert(document: Document, page: Page, parent: GroupShape, shape: Shape, index: number) {
        this._pageop.shapeInsert(document, page, parent, shape, index);
        return page.getShape(shape.id) as Shape;
    }
    shapeDelete(document: Document, page: Page, parent: GroupShape, index: number) {
        this._pageop.shapeDelete(document, page, parent, index);
    }
    shapeMove(page: Page, fromParent: GroupShape, fromIdx: number, toParent: GroupShape, toIdx: number) {
        this._pageop.shapeMove(page, fromParent, fromIdx, toParent, toIdx);
    }
    shapeModifyXY(page: Page, shape: Shape, x: number, y: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyXY(page, shape, x, y);
    }
    // shapeModifyY(page: Page, shape: Shape, y: number) {
    //     checkShapeAtPage(page, shape);
    //     (this.basicapi.shapeModifyY(page, shape, y));
    // }
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number) {
        this.shapeModifyWidth(page, shape, w);
        this.shapeModifyHeight(page, shape, h);
    }
    shapeModifyWidth(page: Page, shape: Shape, w: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyWidth(page, shape, Math.max(w, 0.01));
    }
    shapeModifyHeight(page: Page, shape: Shape, h: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyHeight(page, shape, Math.max(h, 0.01));
    }
    shapeModifyCounts(page: Page, shape: (PolygonShape | StarShape), counts: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyCounts(shape, counts);
    }
    shapeModifyInnerAngle(page: Page, shape: StarShape, offset: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyInnerAngle(shape, offset);
    }
    shapeModifyStartMarkerType(page: Page, shape: Shape, mt: MarkerType) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyStartMarkerType(shape, mt);
    }
    shapeModifyEndMarkerType(page: Page, shape: Shape, mt: MarkerType) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyEndMarkerType(shape, mt);
    }

    shapeModifyContactFrom(page: Page, shape: ContactShape, from: ContactForm | undefined) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, "from", from);
    }
    shapeModifyContactTo(page: Page, shape: ContactShape, to: ContactForm | undefined) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, "to", to);
    }
    contactModifyEditState(page: Page, shape: ContactShape, state: boolean) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, "isEdited", state);
    }
    shapeModifyTransform(page: Page, shape: Shape, transform: Transform) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyTransform(page, shape, transform);
    }
    shapeModifyRotate(page: Page, shape: Shape, rotate: Transform) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyTransform(page, shape, rotate);
    }
    shapeModifyConstrainerProportions(page: Page, shape: Shape, prop: boolean) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyConstrainerProportions(shape, prop);
    }
    shapeModifyName(page: Page, shape: Shape, name: string) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, "name", name);
    }
    shapeModifyNameFixed(page: Page, shape: Shape, isFixed: boolean) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyNameFixed(shape, isFixed);
    }
    shapeModifyVariable(page: Page, _var: Variable, value: any) {
        // modify text var
        if (_var.value instanceof Text) {
            const _str = value.toString();
            const _len = _var.value.length;
            this.deleteText(page, _var, 0, _len);
            this.insertSimpleText(page, _var, 0, _str);
            return;
        }
        checkShapeAtPage(page, _var);
        this._basicop.crdtSetAttr(_var, "value", value);
    }
    shapeModifyVariableName(page: Page, _var: Variable, name: string) {
        checkShapeAtPage(page, _var);
        this._basicop.crdtSetAttr(_var, "name", name);
    }
    shapeAddVariable(page: Page, shape: SymbolShape | SymbolRefShape, _var: Variable) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeAddVariable(page, shape, _var);
    }
    shapeRemoveVariable(page: Page, shape: SymbolShape | SymbolRefShape, key: string) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeRemoveVariable(page, shape, key);
    }
    shapeRemoveOverride(page: Page, shape: SymbolRefShape, key: string) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeRemoveOverride(shape, key);
    }
    shapeBindVar(page: Page, shape: Shape, type: OverrideType, varId: string) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeBindVar(page, shape, type, varId);
    }
    shapeUnbinVar(page: Page, shape: Shape, type: OverrideType) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeUnbindVar(shape, type);
    }

    shapeAddOverride(page: Page, shape: SymbolRefShape, refId: string, value: string) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeAddOverride(page, shape, refId, value);
    }

    private _shapeModifyAttr(page: Page, shape: Shape, attr: string, val: any) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, attr, val);
    }
    /**
     * @description 初始化或修改组件的状态属性
     */
    shapeModifyVartag(page: Page, shape: SymbolShape, varId: string, tag: string) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyVartag(page, shape, varId, tag);
    }
    shapeModifyVisible(page: Page, shape: Shape, isVisible: boolean) {
        this._shapeModifyAttr(page, shape, "isVisible", isVisible);
    }
    shapeModifyMask(page: Page, shape: Shape, mask: boolean) {
        this._shapeModifyAttr(page, shape, "mask", mask);
    }
    shapeModifySymRef(page: Page, shape: SymbolRefShape, refId: string) {
        this._shapeModifyAttr(page, shape, "refId", refId);
    }
    shapeModifyLock(page: Page, shape: Shape, isLocked: boolean) {
        this._shapeModifyAttr(page, shape, "isLocked", isLocked);
    }
    shapeModifyHFlip(page: Page, shape: Shape) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyHFlip(page, shape);
    }
    shapeModifyVFlip(page: Page, shape: Shape,) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyVFlip(page, shape);
    }

    shapeModifyContextSettingsOpacity(page: Page, shape: Shape | Variable, contextSettingsOpacity: number) {
        // if (shape.isVirtualShape) {
        //     return; // todo
        // }
        checkShapeAtPage(page, shape);
        let contextSettings;
        if (shape instanceof Shape) {
            if (!shape.style.contextSettings) shape.style.contextSettings = new ContextSettings(BlendMode.Normal, 1);
            contextSettings = shape.style.contextSettings;
        } else {
            contextSettings = shape.value;
        }
        this._basicop.crdtSetAttr(contextSettings, 'opacity', contextSettingsOpacity);
    }
    shapeModifyContextSettingsBlendMode(page: Page, shape: Shape | Variable, blendMode: BlendMode) {
        checkShapeAtPage(page, shape);
        let contextSettings;
        if (shape instanceof Shape) {
            if (!shape.style.contextSettings) shape.style.contextSettings = new ContextSettings(BlendMode.Normal, 1);
            contextSettings = shape.style.contextSettings;
        } else {
            contextSettings = shape.value;
        }
        this._basicop.crdtSetAttr(contextSettings, 'blenMode', blendMode);
    }
    setShapeProtoStart(page: Page, shape: Shape, PSPoint: PrototypeStartingPoint | undefined) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, "prototypeStartingPoint", PSPoint);
    }

    delShapeProtoStart(page: Page, shape: Shape) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, "prototypeStartingPoint", undefined);
    }

    insertShapeprototypeInteractions(page: Page, shape: Shape | Variable, action: PrototypeInteraction) {
        checkShapeAtPage(page, shape)
        let prototypeInteractions = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions && shape instanceof Shape) {
            shape.prototypeInteractions = new BasicArray<PrototypeInteraction>();
            prototypeInteractions = shape.prototypeInteractions!;
        }
        if (!prototypeInteractions) throw new Error();
        (this._basicop.crdtArrayInsert(prototypeInteractions, prototypeInteractions.length, action))
    }

    deleteShapePrototypeInteractions(page: Page, shape: Shape | Variable, id: string) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const index = prototypeInteractions.findIndex(i => i.id === id)
        this._basicop.crdtArrayRemove(prototypeInteractions, index)
    }

    shapeModifyPrototypeActionDeleted(page: Page, shape: Shape | Variable, id: string, isDeleted: boolean) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        const action = prototypeInteractions?.find(i => i.id === id)
        if (!action || (!!action.isDeleted) === isDeleted) return;
        this._basicop.crdtSetAttr(action, 'isDeleted', isDeleted)
    }

    shapeModifyPrototypeActionEvent(page: Page, shape: Shape | Variable, id: string, value: PrototypeEvents) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        const action = prototypeInteractions?.find(i => i.id === id)
        if (!action) return;
        this._basicop.crdtSetAttr(action.event, 'interactionType', value)
    }

    shapeModifyPrototypeActionEventTime(page: Page, shape: Shape | Variable, id: string, value: number) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        const action = prototypeInteractions?.find(i => i.id === id)
        if (!action) return;
        this._basicop.crdtSetAttr(action.event, 'transitionTimeout', value)
    }

    shapeModifyPrototypeActionConnNav(page: Page, shape: Shape | Variable, id: string, conn: PrototypeConnectionType | undefined, nav: PrototypeNavigationType | undefined) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        this._basicop.crdtSetAttr(action, 'connectionType', conn)
        this._basicop.crdtSetAttr(action, 'navigationType', nav)
    }

    shapeModifyPrototypeActionTargetNodeID(page: Page, shape: Shape | Variable, id: string, value: string | undefined) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        this._basicop.crdtSetAttr(action, 'targetNodeID', value)
    }

    shapeModifyPrototypeActionTransitionType(page: Page, shape: Shape | Variable, id: string, value: PrototypeTransitionType) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        this._basicop.crdtSetAttr(action, 'transitionType', value)
    }

    shapeModifyPrototypeActionTransitionDuration(page: Page, shape: Shape | Variable, id: string, value: number) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        this._basicop.crdtSetAttr(action, 'transitionDuration', value)
    }

    shapeModifyPrototypeActionEasingType(page: Page, shape: Shape | Variable, id: string, value: PrototypeEasingType) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        this._basicop.crdtSetAttr(action, 'easingType', value)
    }

    shapeModifyPrototypeActionConnectionURL(page: Page, shape: Shape | Variable, id: string, value: string) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        this._basicop.crdtSetAttr(action, 'connectionURL', value)
    }

    shapeModifyPrototypeIsOpenNewTab(page: Page, shape: Shape | Variable, id: string, value: boolean) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        this._basicop.crdtSetAttr(action, 'openUrlInNewTab', value)
    }

    shapeModifyPrototypeActionOpenUrlInNewTab(page: Page, shape: Shape | Variable, id: string, value: boolean) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        this._basicop.crdtSetAttr(action, 'openUrlInNewTab', value)
    }

    shapeModifyPrototypeActionEasingFunction(page: Page, shape: Shape | Variable, id: string, value: PrototypeEasingBezier) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        let easingFunction = action.easingFunction;
        if (!easingFunction) {
            easingFunction = new PrototypeEasingBezier(0, 0, 1, 1)
            this._basicop.crdtSetAttr(action, 'easingFunction', easingFunction)
        }
        this._basicop.crdtSetAttr(action, 'easingFunction', value)
    }

    shapeModifyPrototypeExtraScrollOffsetX(page: Page, shape: Shape | Variable, id: string, value: number) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        let extraScrollOffset = action.extraScrollOffset
        if (!extraScrollOffset) {
            const id = uuid()
            extraScrollOffset = new Point2D(0, 0)
            this._basicop.crdtSetAttr(action, 'extraScrollOffset', extraScrollOffset)
        }
        this._basicop.crdtSetAttr(extraScrollOffset, 'x', value)
    }

    shapeModifyPrototypeExtraScrollOffsetY(page: Page, shape: Shape | Variable, id: string, value: number) {
        checkShapeAtPage(page, shape)
        const prototypeInteractions: BasicArray<PrototypeInteraction> = shape instanceof Variable ? shape.value : shape.prototypeInteractions;
        if (!prototypeInteractions) return;
        const action = prototypeInteractions?.find(i => i.id === id)?.actions;
        if (!action) return;
        let extraScrollOffset = action.extraScrollOffset
        if (!extraScrollOffset) {
            const id = uuid()
            extraScrollOffset = new Point2D(0, 0)
            this._basicop.crdtSetAttr(action, 'extraScrollOffset', extraScrollOffset)
        }
        this._basicop.crdtSetAttr(extraScrollOffset, 'y', value)

    }

    shapeModifyOverlayPositionType(page: Page, shape: Shape, value: OverlayPositionType) {
        checkShapeAtPage(page, shape)
        let overlayPosition: OverlayPosition | undefined = shape.overlayPosition
        if (!overlayPosition && shape instanceof Shape) {
            overlayPosition = new OverlayPosition(OverlayPositionType.CENTER, new OverlayMargin())
            shape.overlayPosition = overlayPosition;
        }
        if (!overlayPosition) throw new Error();
        this._basicop.crdtSetAttr(overlayPosition, 'position', value)
        const margin = overlayPosition.margin
        if (!margin) return;
        if (margin.top) this._basicop.crdtSetAttr(margin, 'top', 0)
        if (margin.bottom) this._basicop.crdtSetAttr(margin, 'bottom', 0)
        if (margin.left) this._basicop.crdtSetAttr(margin, 'left', 0)
        if (margin.right) this._basicop.crdtSetAttr(margin, 'right', 0)
    }

    shapeModifyOverlayPositionTypeMarginTop(page: Page, shape: Shape, value: number) {
        checkShapeAtPage(page, shape)
        const overlayPosition: OverlayPosition | undefined = shape.overlayPosition
        const margin = overlayPosition?.margin
        if (!margin) return;
        this._basicop.crdtSetAttr(margin, 'top', value)
    }

    shapeModifyOverlayPositionTypeMarginBottom(page: Page, shape: Shape, value: number) {
        checkShapeAtPage(page, shape)
        const overlayPosition: OverlayPosition | undefined = shape.overlayPosition
        const margin = overlayPosition?.margin
        if (!margin) return;
        this._basicop.crdtSetAttr(margin, 'bottom', value)
    }

    shapeModifyOverlayPositionTypeMarginLeft(page: Page, shape: Shape, value: number) {
        checkShapeAtPage(page, shape)
        const overlayPosition: OverlayPosition | undefined = shape.overlayPosition
        const margin = overlayPosition?.margin
        if (!margin) return;
        this._basicop.crdtSetAttr(margin, 'left', value)
    }

    shapeModifyOverlayPositionTypeMarginRight(page: Page, shape: Shape, value: number) {
        checkShapeAtPage(page, shape)
        const overlayPosition: OverlayPosition | undefined = shape.overlayPosition
        const margin = overlayPosition?.margin
        if (!margin) return;
        this._basicop.crdtSetAttr(margin, 'right', value)
    }

    shapeModifyOverlayBackgroundInteraction(page: Page, shape: Shape, value: OverlayBackgroundInteraction) {
        checkShapeAtPage(page, shape)
        this._basicop.crdtSetAttr(shape, "overlayBackgroundInteraction", value);
    }

    shapeModifyOverlayBackgroundAppearance(page: Page, shape: Shape, value?: OverlayBackgroundAppearance) {
        checkShapeAtPage(page, shape)
        let Appearance = (shape as Artboard).overlayBackgroundAppearance
        if (!Appearance) {
            const val = new OverlayBackgroundAppearance(OverlayBackgroundType.SOLIDCOLOR, new Color(0.25, 0, 0, 0))
            this._basicop.crdtSetAttr(shape, "overlayBackgroundAppearance", val);
        } else {
            this._basicop.crdtSetAttr(shape, "overlayBackgroundAppearance", value);
        }
    }

    shapeModifyscrollDirection(page: Page, shape: Shape, value: ScrollDirection) {
        checkShapeAtPage(page, shape)
        this._basicop.crdtSetAttr(shape, "scrollDirection", value);
    }

    shapeModifyScrollBehavior(page: Page, shape: Shape, value: ScrollBehavior) {
        checkShapeAtPage(page, shape)
        this._basicop.crdtSetAttr(shape, "scrollBehavior", value);
    }

    shapeModifyResizingConstraint(page: Page, shape: Shape, resizingConstraint: number) {
        this._shapeModifyAttr(page, shape, "resizingConstraint", resizingConstraint);
    }
    shapeModifyRadius(page: Page, shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyRadius(shape, lt, rt, rb, lb);
    }
    shapeModifyRadius2(page: Page, shape: Artboard | SymbolShape | Variable, lt: number, rt: number, rb: number, lb: number) {
        checkShapeAtPage(page, shape);
        const cornerRadius = shape instanceof Variable ? shape.value : shape.cornerRadius;
        this._shapeop.shapeModifyRadius2(shape, cornerRadius, lt, rt, rb, lb);
    }
    shapeModifyFixedRadius(page: Page, shape: GroupShape | PathShape | TextShape, fixedRadius: number | undefined) {
        this._shapeModifyAttr(page, shape, "fixedRadius", fixedRadius);
    }
    shapeModifyCurvPoint(page: Page, shape: PathShape, index: number, point: types.Point2D, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyCurvPoint(shape, index, point, segmentIndex);
    }
    shapeModifyCurvFromPoint(page: Page, shape: PathShape, index: number, point: types.Point2D, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyCurvFromPoint(shape, index, point, segmentIndex);
    }
    shapeModifyCurvToPoint(page: Page, shape: PathShape, index: number, point: types.Point2D, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyCurvToPoint(shape, index, point, segmentIndex);
    }
    shapeModifyBoolOp(page: Page, shape: Shape, op: BoolOp | undefined) {
        this._shapeModifyAttr(page, shape, "boolOp", op);
    }
    shapeModifyIsCustomSize(page: Page, shape: SymbolRefShape, isCustomSize: boolean) {
        // if (!(shape instanceof SymbolRefShape)) return;
        this._shapeModifyAttr(page, shape, "isCustomSize", isCustomSize ? true : undefined);
    }

    // 自动布局
    shapeAutoLayout(page: Page, shape: Shape | Variable, autoLayout: AutoLayout | undefined) {
        checkShapeAtPage(page, shape);
        if (!(shape instanceof Variable) && !(shape instanceof Artboard) && !(shape instanceof SymbolShape)) return;
        this._shapeop.shapeAutoLayout(shape, autoLayout);
    }

    shapeModifyAutoLayoutPadding(page: Page, shape: Shape | Variable, padding: number, direction: PaddingDir) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout) return;
        if (direction === 'top') {
            this._basicop.crdtSetAttr(autoLayout, 'stackVerticalPadding', padding);
        } else if (direction === 'right') {
            this._basicop.crdtSetAttr(autoLayout, 'stackPaddingRight', padding);
        } else if (direction === 'bottom') {
            this._basicop.crdtSetAttr(autoLayout, 'stackPaddingBottom', padding);
        } else if (direction === 'left') {
            this._basicop.crdtSetAttr(autoLayout, 'stackHorizontalPadding', padding);
        }
    }
    shapeModifyAutoLayoutHorPadding(page: Page, shape: Shape | Variable, hor: number, right: number) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;

        if (!autoLayout) return;
        this._basicop.crdtSetAttr(autoLayout, 'stackHorizontalPadding', hor);
        this._basicop.crdtSetAttr(autoLayout, 'stackPaddingRight', right);
    }
    shapeModifyAutoLayoutVerPadding(page: Page, shape: Shape | Variable, ver: number, bottom: number) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout) return;
        this._basicop.crdtSetAttr(autoLayout, 'stackVerticalPadding', ver);
        this._basicop.crdtSetAttr(autoLayout, 'stackPaddingBottom', bottom);
    }
    shapeModifyAutoLayoutWrap(page: Page, shape: Shape | Variable, wrap: StackWrap) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout || autoLayout.stackWrap === wrap) return;
        this._basicop.crdtSetAttr(autoLayout, 'stackWrap', wrap);
    }

    shapeModifyAutoLayoutMode(page: Page, shape: Shape | Variable, mode: StackMode) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout || autoLayout.stackMode === mode) return;
        this._basicop.crdtSetAttr(autoLayout, 'stackMode', mode);
    }

    shapeModifyAutoLayoutSpace(page: Page, shape: Shape | Variable, space: number, direction: PaddingDir) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout) return;
        if (direction === 'ver') {
            this._basicop.crdtSetAttr(autoLayout, 'stackCounterSpacing', space);
        } else if (direction === 'hor') {
            this._basicop.crdtSetAttr(autoLayout, 'stackSpacing', space);
        }
    }

    shapeModifyAutoLayoutAlignItems(page: Page, shape: Shape | Variable, primary: StackAlign, counter: StackAlign) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout) return;
        if (autoLayout.stackCounterAlignItems !== counter) {
            this._basicop.crdtSetAttr(autoLayout, 'stackCounterAlignItems', counter);
        }
        if (autoLayout.stackPrimaryAlignItems !== primary) {
            this._basicop.crdtSetAttr(autoLayout, 'stackPrimaryAlignItems', primary);
        }
    }

    shapeModifyAutoLayoutSizing(page: Page, shape: Shape | Variable, sizing: StackSizing, direction: PaddingDir) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout) return;
        if (direction === 'ver' && autoLayout.stackCounterSizing !== sizing) {
            this._basicop.crdtSetAttr(autoLayout, 'stackCounterSizing', sizing);
        } else if (direction === 'hor' && autoLayout.stackPrimarySizing !== sizing) {
            this._basicop.crdtSetAttr(autoLayout, 'stackPrimarySizing', sizing);
        }
    }
    shapeModifyAutoLayoutGapSizing(page: Page, shape: Shape | Variable, sizing: StackSizing, direction: PaddingDir) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout) return;
        if (direction === 'ver' && autoLayout.stackVerticalGapSizing !== sizing) {
            this._basicop.crdtSetAttr(autoLayout, 'stackVerticalGapSizing', sizing);
        } else if (direction === 'hor' && autoLayout.stackHorizontalGapSizing !== sizing) {
            this._basicop.crdtSetAttr(autoLayout, 'stackHorizontalGapSizing', sizing);
        }
    }
    shapeModifyAutoLayoutStackZIndex(page: Page, shape: Shape | Variable, stack: boolean) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout) return;
        this._basicop.crdtSetAttr(autoLayout, 'stackReverseZIndex', stack);
    }
    shapeModifyAutoLayoutStroke(page: Page, shape: Shape | Variable, stroke: boolean) {
        checkShapeAtPage(page, shape);
        const autoLayout = shape instanceof Variable ? shape.value : (shape as Artboard).autoLayout;
        if (!autoLayout) return;
        this._basicop.crdtSetAttr(autoLayout, 'bordersTakeSpace', stroke);
    }

    addStrokePaint(page: Page, shape: Shape | Variable, strokePaint: Fill, index: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this._borderop.addStrokePaint(borders.strokePaints, strokePaint, index);
    }
    addStrokePaints(page: Page, shape: Shape | Variable, strokePaints: Fill[]) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        for (let i = 0; i < strokePaints.length; i++) {
            const strokePaint = strokePaints[i];
            this._borderop.addStrokePaint(borders.strokePaints, strokePaint, i)
        }
    }

    deleteStrokePaintAt(page: Page, shape: Shape | Variable, index: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (borders && borders.strokePaints) {
            this._borderop.deleteStrokePaintAt(borders.strokePaints, index);
        }
    }

    deleteStrokePaints(page: Page, shape: Shape | Variable, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        const bordersOld = shape instanceof Shape ? shape.style.borders : shape.value;
        this._borderop.deleteStrokePaints(bordersOld.strokePaints, index, strength);
    }

    /* 添加一条填充 */
    addFillAt(fills: BasicArray<Fill>, fill: Fill, index: number) {
        this._fillop.addFillAt(fills, fill, index);
    }

    /* 添加多条填充 */
    addFills(fills: BasicArray<Fill>, plus: Fill[]) {
        plus.forEach(fill => this._fillop.addFillAt(fills, fill, fills.length))
    }

    /* 删除一条填充 */
    deleteFillAt(fills: BasicArray<Fill>, index: number) {
        this._fillop.deleteFillAt(fills, index);
    }

    /* 批量删除fill */
    deleteFills(fills: BasicArray<Fill>, index: number, strength: number) {
        this._fillop.deleteFills(fills, index, strength);
    }

    /* 设置一条填充的填充类型 */
    setFillType(fill: Fill, fillType: FillType) {
        this._basicop.crdtSetAttr(fill, "fillType", fillType);
    }

    /* 修改一条填充的颜色 */
    setFillColor(fill: Fill, color: Color) {
        this._basicop.crdtSetAttr(fill, "color", color);
    }

    /* 隐藏与显示一条填充 */
    setFillEnable(fill: Fill, isEnable: boolean) {
        this._basicop.crdtSetAttr(fill, "isEnabled", isEnable);
    }

    /* 当一个填充以图片作为填充物时，用于修改图片的填充方式 */
    setFillScaleMode(fill: Fill, mode: ImageScaleMode) {
        this._basicop.crdtSetAttr(fill, "imageScaleMode", mode);
    }

    /* 当一个填充以图片作为填充物时，用于修改图片的资源链接 */
    setFillImageRef(document: Document, fill: Fill, urlRef: string, imageMgr: { buff: Uint8Array, base64: string }) {
        document.mediasMgr.add(urlRef, imageMgr);
        fill.setImageMgr(document.mediasMgr);
        this._basicop.crdtSetAttr(fill, "imageRef", urlRef);
    }

    /* 当一个填充以图片作为填充物时，用于修改图片的原始宽度 */
    setFillImageOriginWidth(fill: Fill, width: number) {
        this._basicop.crdtSetAttr(fill, "originalImageWidth", width);
    }

    /* 当一个填充以图片作为填充物时，用于修改图片的原始高度 */
    setFillImageOriginHeight(fill: Fill, height: number) {
        this._basicop.crdtSetAttr(fill, "originalImageHeight", height);
    }

    /* 当一个填充以图片作为填充物并以平铺方式填充时，用于修改图片相对于原始尺寸的缩放值 */
    setFillImageScale(fill: Fill, scale: number) {
        this._basicop.crdtSetAttr(fill, "scale", scale);
    }

    /* 当一个填充以图片作为填充物并以平铺方式填充时，用于旋转图片 */
    setFillImageRotate(fill: Fill, rotate: number) {
        this._basicop.crdtSetAttr(fill, "rotation", rotate);
    }

    /* 当一个填充以图片作为填充物并以平铺方式填充时，用于修改图片滤镜 */
    setFillImageFilter(fill: Fill, key: PaintFilterType, value: number) {
        if (fill.paintFilter) {
            this._basicop.crdtSetAttr(fill.paintFilter, key, value);
        } else {
            const paintFilter = new PaintFilter(0, 0, 0, 0, 0, 0, 0);
            paintFilter[key] = value;
            this._basicop.crdtSetAttr(fill, "paintFilter", paintFilter);
        }
    }

    /* 修改一条填充的渐变色 */
    setFillGradient(fill: Fill, gradient: Gradient) {
        this._basicop.crdtSetAttr(fill, "gradient", gradient);
    }

    setGradientOpacity(gradient: Gradient, opacity: number) {
        this._basicop.crdtSetAttr(gradient, "gradientOpacity", opacity);
    }

    setBorderGradient(page: Page, shape: Shape | Variable, idx: number, gradient: Gradient) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        const strokePaint: Fill = borders.strokePaints[idx];
        this._basicop.crdtSetAttr(strokePaint, "gradient", gradient);
    }
    setBorderColor(page: Page, shape: Shape | Variable | FillMask, idx: number, color: Color) {
        // checkShapeAtPage(page, shape);
        if (shape instanceof FillMask) {
            const fill: Fill = shape.fills[idx];
            if (!fill) return;
            this._basicop.crdtSetAttr(fill, "color", color);
        } else {
            const borders = shape instanceof Shape ? shape.style.borders : shape.value;
            const strokePaint: Fill = borders.strokePaints[idx];
            this._basicop.crdtSetAttr(strokePaint, "color", color);
        }
    }
    setBorderEnable(page: Page, shape: Shape | Variable, idx: number, isEnable: boolean) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        const strokePaint: Fill = borders.strokePaints[idx];
        this._basicop.crdtSetAttr(strokePaint, "isEnabled", isEnable);
    }
    setBorderPosition(border: Border | BorderMaskType, position: BorderPosition) {
        this._basicop.crdtSetAttr(border, "position", position);
    }
    setBorderStyle(page: Page, shape: Shape | Variable, borderStyle: BorderStyle) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this._basicop.crdtSetAttr(borders, "borderStyle", borderStyle);
    }

    setBorderFillMask(style: Style, value: string | undefined) {
        this._basicop.crdtSetAttr(style.borders, "fillsMask", value);
    }

    delBorderFillMask(style: Style) {
        this._basicop.crdtSetAttr(style.borders, "fillsMask", undefined);
    }

    moveFill(page: Page, shape: Shape | Variable, idx: number, idx2: number) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        this._fillop.moveFill(fills, idx, idx2);
    }
    moveStrokePaint(page: Page, shape: Shape | Variable, idx: number, idx2: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this._borderop.moveStrokePaint(borders.strokePaints, idx, idx2);
    }
    setBorderCornerType(page: Page, shape: Shape | Variable, cornerType: CornerType) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this._basicop.crdtSetAttr(borders, "cornerType", cornerType);
    }
    setBorderSide(border: Border, sideSetting: BorderSideSetting) {
        this._basicop.crdtSetAttr(border, "sideSetting", sideSetting)
    }
    setBorderThicknessTop(border: Border, thickness: number) {
        this._basicop.crdtSetAttr(border.sideSetting, "thicknessTop", thickness)
    }
    setBorderThicknessLeft(border: Border, thickness: number) {
        this._basicop.crdtSetAttr(border.sideSetting, "thicknessLeft", thickness);
    }
    setBorderThicknessBottom(border: Border, thickness: number) {
        this._basicop.crdtSetAttr(border.sideSetting, "thicknessBottom", thickness);
    }
    setBorderThicknessRight(border: Border, thickness: number) {
        this._basicop.crdtSetAttr(border.sideSetting, "thicknessRight", thickness);
    }
    // points
    addPointAt(page: Page, shape: PathShape, idx: number, point: CurvePoint, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._pointsop.addPointAt(shape, point, idx, segmentIndex);
    }
    addSegmentAt(page: Page, shape: PathShape, idx: number, segment: PathSegment) {
        checkShapeAtPage(page, shape);
        this._pointsop.addSegmentAt(shape, segment, idx);
    }
    deletePoints(page: Page, shape: PathShape, index: number, strength: number, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._pointsop.deletePoints(shape, index, strength, segmentIndex);
    }
    deletePoint(page: Page, shape: PathShape, index: number, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._pointsop.deletePointAt(shape, index, segmentIndex);
    }
    addPoints(page: Page, shape: PathShape, points: CurvePoint[], segmentIndex: number) {
        checkShapeAtPage(page, shape);
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            this._pointsop.addPointAt(shape, point, i, segmentIndex);
        }
    }
    shapeEditPoints(page: Page, shape: Shape, haveEdit: boolean) {
        this._shapeModifyAttr(page, shape, "haveEdit", haveEdit);
    }

    modifyPointCurveMode(page: Page, shape: PathShape, index: number, curveMode: CurveMode, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyCurveMode(shape, index, curveMode, segmentIndex)
    }
    modifyPointHasFrom(page: Page, shape: PathShape, index: number, hasFrom: boolean, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyHasFrom(shape, index, hasFrom, segmentIndex);
    }
    modifyPointHasTo(page: Page, shape: PathShape, index: number, hasTo: boolean, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyHasTo(shape, index, hasTo, segmentIndex);
    }
    modifyPointCornerRadius(page: Page, shape: PathShape, index: number, cornerRadius: number, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyPointCornerRadius(shape, index, cornerRadius, segmentIndex);
    }
    setCloseStatus(page: Page, shape: PathShape, isClosed: boolean, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this._shapeop.shapeModifyPathShapeClosedStatus(shape, isClosed, segmentIndex);
    }
    // insertSegmentAt(page: Page, shape: PathShape, index: number, segment: PathSegment) {
    //     checkShapeAtPage(page, shape);
    //     (this.basicapi.insertSegmentAt(shape, index, segment));
    // }
    deleteSegmentAt(page: Page, shape: PathShape, segment: number) {
        checkShapeAtPage(page, shape);
        this._pointsop.deleteSegmentAt(shape, segment);
    }
    // contacts
    addContactAt(page: Page, shape: Shape, contactRole: ContactRole, idx: number) {
        checkShapeAtPage(page, shape);
        this._contactop.addContactShape(shape.style, contactRole);
    }
    removeContactRoleAt(page: Page, shape: Shape, index: number) {
        checkShapeAtPage(page, shape);
        if (!shape.style.contacts || !shape.style.contacts[index]) return;
        this._contactop.removeContactRoleAt(shape.style, index);
    }
    // shadow
    addShadows(shadows: BasicArray<Shadow>, plus: Shadow[]) {
        for (let i = 0; i < plus.length; i++) {
            this._shadowop.addShadow(shadows, plus[i], i);
        }
    }

    addShadow(shadows: BasicArray<Shadow>, shadow: Shadow, index: number) {
        this._shadowop.addShadow(shadows, shadow, index);
    }
    deleteShadows(shadows: BasicArray<Shadow>, index: number, strength: number) {
        this._shadowop.deleteShadows(shadows, index, strength);
    }
    deleteShadowAt(shadows: Shadow[], idx: number) {
        this._shadowop.deleteShadowAt(shadows as BasicArray<Shadow>, idx);
    }
    setShadowEnable(shadow: Shadow, isEnable: boolean) {
        this._basicop.crdtSetAttr(shadow, "isEnabled", isEnable);
    }
    setShadowOffsetX(shadow: Shadow, offsetX: number) {
        this._basicop.crdtSetAttr(shadow, "offsetX", offsetX);
    }
    setShadowOffsetY(shadow: Shadow, offsetY: number) {
        this._basicop.crdtSetAttr(shadow, "offsetY", offsetY);
    }
    setShadowBlur(shadow: Shadow, blur: number) {
        this._basicop.crdtSetAttr(shadow, "blurRadius", blur);
    }
    setShadowSpread(shadow: Shadow, spread: number) {
        this._basicop.crdtSetAttr(shadow, "spread", spread);
    }
    setShadowColor(shadow: Shadow, color: Color) {
        this._basicop.crdtSetAttr(shadow, "color", color);
    }
    setShadowPosition(shadow: Shadow, position: ShadowPosition) {
        this._basicop.crdtSetAttr(shadow, "position", position);
    }

    /* 添加模糊 */
    addBlur(blurContainer: Basic & { blur?: Blur }, blur: Blur) {
        this._basicop.crdtSetAttr(blurContainer, 'blur', blur);
    }

    /* 删除模糊 */
    deleteBlur(blurContainer: Basic & { blur?: Blur }) {
        this._basicop.crdtSetAttr(blurContainer, 'blur', undefined);
    }

    /* 修改模糊值 */
    shapeModifyBlurSaturation(blur: Blur, saturation: number) {
        this._basicop.crdtSetAttr(blur, 'saturation', saturation);
    }

    /* 修改模糊类型 */
    shapeModifyBlurType(blur: Blur, type: BlurType) {
        this._basicop.crdtSetAttr(blur, 'type', type);
    }

    /* 隐藏与显示模糊 */
    shapeModifyBlurEnabled(blur: Blur, isEnabled: boolean) {
        this._basicop.crdtSetAttr(blur, 'isEnabled', isEnabled);
    }

    /* 修改图层的填充遮罩 */
    modifyFillsMask(page: Page, shape: Shape, id: string | undefined) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape.style, 'fillsMask', id);
    }

    /* 修改图层的阴影遮罩 */
    modifyShadowsMask(page: Page, shape: Shape, id: string | undefined) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape.style, 'shadowsMask', id);
    }

    /* 修改图层的模糊遮罩 */
    modifyBlurMask(page: Page, shape: Shape, id: string | undefined) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape.style, 'blursMask', id);
    }

    /* 修改图层的边框遮罩 */
    modifyBorderMask(style: Style, id: string | undefined) {
        this._basicop.crdtSetAttr(style, 'bordersMask', id);
    }

    /* 修改图层的圆角遮罩 */
    modifyRadiusMask(shape: Shape, id: string | undefined) {
        this._basicop.crdtSetAttr(shape, 'radiusMask', id);
    }

    /**
     * @deprecated
     */
    delfillmask(page: Page, shape: Shape | Variable) {
        checkShapeAtPage(page, shape);
        const style: Style = shape instanceof Shape ? shape.style : shape.value;
        this._basicop.crdtSetAttr(style, 'fillsMask', undefined);
    }

    /**
     * @deprecated
     */
    delblurmask(page: Page, shape: Shape | Variable) {
        checkShapeAtPage(page, shape);
        const style: Style = shape instanceof Shape ? shape.style : shape.value;
        this._basicop.crdtSetAttr(style, 'blursMask', undefined);
    }

    /**
     * @deprecated
     */
    delradiusmask(shape: Shape | Variable) {
        this._basicop.crdtSetAttr(shape, 'radiusMask', undefined);
    }

    modifyMaskRadius(radiusMask: RadiusMask, value: number[]) {
        this._basicop.crdtSetAttr(radiusMask, "radius", value);
    }

    disableMask(mask: StyleMangerMember) {
        this._basicop.crdtSetAttr(mask, 'disabled', true);
    }

    shapeModifyBlurMotionAngle(page: Page, shape: Shape | Variable, motionAngle: number) {
        checkShapeAtPage(page, shape);
        const blur = shape instanceof Shape ? shape.style.blur : shape.value;
        this._basicop.crdtSetAttr(blur, 'motionAngle', motionAngle);
    }

    shapeModifyBlurRadius(page: Page, shape: Shape | Variable, radius: number) {
        checkShapeAtPage(page, shape);
        const blur = shape instanceof Shape ? shape.style.blur : shape.value;
        this._basicop.crdtSetAttr(blur, 'radius', radius);
    }

    ovalModifyStartingAngle(page: Page, shape: Shape | Variable, angle: number) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, 'startingAngle', angle);
    }

    ovalModifyEndingAngle(page: Page, shape: Shape | Variable, angle: number) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, 'endingAngle', angle);
    }

    ovalModifyInnerRadius(page: Page, shape: Shape | Variable, radius: number) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, 'innerRadius', radius);
    }

    modifyContainersFrameMaskStatus(page: Page, shape: Shape | Variable, val: boolean) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, 'frameMaskDisabled', val);
    }

    // cutout
    deleteExportFormatAt(page: Page, shape: Shape | Variable, idx: number) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this._cutoutop.deleteExportFormatAt(options, idx);
    }
    deletePageExportFormatAt(page: Page, idx: number) {
        if (!page.exportOptions) return;
        this._cutoutop.deletePageExportFormatAt(page.exportOptions, idx);
    }
    deleteExportFormats(page: Page, shape: Shape, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this._cutoutop.deleteExportFormats(shape.exportOptions, index, strength);
    }
    addExportFormats(page: Page, shape: Shape, formats: ExportFormat[]) {
        checkShapeAtPage(page, shape);
        for (let i = 0; i < formats.length; i++) {
            const format = formats[i];
            this._cutoutop.addExportFormat(shape, format, i);
        }
    }
    addExportFormat(page: Page, shape: Shape | Variable, format: ExportFormat, index: number) {
        checkShapeAtPage(page, shape);
        this._cutoutop.addExportFormat(shape, format, index);
    }
    addPageExportFormat(page: Page, format: ExportFormat, index: number) {
        this._cutoutop.addPageExportFormat(page, format, index);
    }
    setExportFormatScale(page: Page, shape: Shape | Variable, idx: number, scale: number) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this._cutoutop.setExportFormatScale(options, idx, scale);
    }
    setPageExportFormatScale(page: Page, idx: number, scale: number) {
        if (!page.exportOptions) return;
        this._cutoutop.setPageExportFormatScale(page.exportOptions, idx, scale);
    }
    setExportFormatName(page: Page, shape: Shape | Variable, idx: number, name: string) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this._cutoutop.setExportFormatName(options, idx, name);
    }
    setPageExportFormatName(page: Page, idx: number, name: string) {
        if (!page.exportOptions) return;
        this._cutoutop.setPageExportFormatName(page.exportOptions, idx, name);
    }
    setExportFormatFileFormat(page: Page, shape: Shape | Variable, idx: number, fileFormat: ExportFileFormat) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this._cutoutop.setExportFormatFileFormat(options, idx, fileFormat);
    }
    setPageExportFormatFileFormat(page: Page, idx: number, fileFormat: ExportFileFormat) {
        if (!page.exportOptions) return;
        this._cutoutop.setPageExportFormatFileFormat(page.exportOptions, idx, fileFormat);
    }
    setExportFormatPerfix(page: Page, shape: Shape | Variable, idx: number, perfix: ExportFormatNameingScheme) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this._cutoutop.setExportFormatPerfix(options, idx, perfix);
    }
    setPageExportFormatPerfix(page: Page, idx: number, perfix: ExportFormatNameingScheme) {
        if (!page.exportOptions) return;
        this._cutoutop.setPageExportFormatPerfix(page.exportOptions, idx, perfix);
    }
    setExportTrimTransparent(page: Page, shape: Shape | Variable, trim: boolean) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this._cutoutop.setExportTrimTransparent(options, trim);
    }
    setExportCanvasBackground(page: Page, shape: Shape | Variable, background: boolean) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this._cutoutop.setExportCanvasBackground(options, background);
    }
    setExportPreviewUnfold(page: Page, shape: Shape | Variable, unfold: boolean) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this._cutoutop.setExportPreviewUnfold(options, unfold);
    }
    setPageExportPreviewUnfold(document: Document, pageId: string, unfold: boolean) {
        const item = document.pagesMgr.getSync(pageId);
        if (!item) return;
        if (!item.exportOptions) return;
        this._cutoutop.setPageExportPreviewUnfold(item.exportOptions, unfold);
    }

    shapeModifyStackPosition(page: Page, shape: Shape, position: StackPositioning) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, "stackPositioning", position);
    }

    modifyShapeScale(page: Page, shape: Shape, value: number) {
        checkShapeAtPage(page, shape);
        this._basicop.crdtSetAttr(shape, 'uniformScale', value);
    }

    modifyThumbnailViewId(document: Document, thumbnailViewId: string) {
        this._basicop.crdtSetAttr(document, 'thumbnailViewId', thumbnailViewId);
    }
    // text
    insertSimpleText(page: Page, shape: TextShapeLike | Variable, idx: number, text: string, attr?: SpanAttr) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.insertSimpleText(shape, _text, text, idx, { attr });
    }
    insertComplexText(page: Page, shape: TextShapeLike | Variable, idx: number, text: Text) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.insertComplexText(shape, _text, text, idx);
    }
    insertSimpleText2(page: Page, shape: TextShape, idx: number, text: string, attr?: SpanAttr) {
        checkShapeAtPage(page, shape);
        const _text = shape.text;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.insertSimpleText(shape, _text, text, idx, { attr });
    }
    insertComplexText2(page: Page, shape: TextShape, idx: number, text: Text) {
        checkShapeAtPage(page, shape);
        const _text = shape.text;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.insertComplexText(shape, _text, text, idx);
    }
    deleteText(page: Page, shape: TextShapeLike | Variable, idx: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.deleteText(shape, _text, idx, len);
    }
    deleteText2(page: Page, shape: TextShape, idx: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape.text;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.deleteText(shape, _text, idx, len);
    }
    textModifyColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyColor(shape, _text, idx, len, color);
    }
    textModifyFontName(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontname: string) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyFontName(shape, _text, idx, len, fontname);
    }
    textModifyFontSize(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontsize: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyFontSize(shape, _text, idx, len, fontsize);
    }

    textModifyTextMask(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, maskid: string | undefined) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyTextMask(shape, _text, idx, len, maskid);
    }

    shapeModifyTextBehaviour(page: Page, _text: Text, textBehaviour: TextBehaviour) {
        checkShapeAtPage(page, _text.parent as Shape);
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.shapeModifyTextBehaviour(page, _text, textBehaviour);
    }
    shapeModifyTextVerAlign(page: Page, shape: TextShapeLike | Variable, verAlign: TextVerAlign) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.shapeModifyTextVerAlign(_text, verAlign);
    }

    textModifyHighlightColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyHighlightColor(shape, _text, idx, len, color);
    }
    textModifyUnderline(page: Page, shape: TextShapeLike | Variable, underline: UnderlineType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyUnderline(shape, _text, underline, index, len);
    }
    textModifyStrikethrough(page: Page, shape: TextShapeLike | Variable, strikethrough: StrikethroughType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyStrikethrough(shape, _text, strikethrough, index, len);
    }
    textModifyWeight(page: Page, shape: TextShapeLike | Variable, weight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyWeight(shape, _text, weight, index, len);
    }
    textModifyItalic(page: Page, shape: TextShapeLike | Variable, italic: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyItalic(shape, _text, italic, index, len);
    }
    textModifyFillType(page: Page, shape: TextShapeLike | Variable, fillType: FillType, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyFillType(shape, _text, index, len, fillType);
    }

    private _textModifyRemoveBulletNumbers(page: Page, shape: TextShapeLike | Variable, index: number, len: number) {
        const removeIndexs: number[] = [];
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        _travelTextPara(_text.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
            index -= _index;
            if (para.text[0] === '*' && para.spans[0].bulletNumbers && para.spans[0].length === 1) {
                removeIndexs.push(index - _index);
            }
            index += para.length;
        })

        for (let i = 0, len = removeIndexs.length; i < len; i++) {
            this._textop.deleteText(shape, _text, removeIndexs[i] - i, 1);
        }
        if (removeIndexs.length > 0) _text.reLayout(); // todo
    }

    private _textModifySetBulletNumbers(page: Page, shape: TextShapeLike | Variable, type: BulletNumbersType, index: number, len: number) {

        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyBulletNumbersType(shape, _text, type, index, len);

        const insertIndexs: number[] = [];
        _travelTextPara(_text.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
            index -= _index;
            if (para.text[0] === '*' && para.spans[0].bulletNumbers && para.spans[0].length === 1) {
                //
            }
            else {
                // insert with format
                insertIndexs.push(index - _index);
            }
            index += para.length;
        });

        for (let i = 0, len = insertIndexs.length; i < len; i++) {
            const attr = new SpanAttr();
            attr.placeholder = true;
            attr.bulletNumbers = new BulletNumbers(type);
            this._textop.insertSimpleText(shape, _text, '*', insertIndexs[i] + i, { attr });
        }
        if (insertIndexs.length > 0) _text.reLayout();
    }

    textModifyBulletNumbers(page: Page, shape: TextShapeLike | Variable, type: BulletNumbersType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;

        if (type === undefined || type === BulletNumbersType.None) {
            this._textModifyRemoveBulletNumbers(page, shape, index, len);
        }
        else {
            this._textModifySetBulletNumbers(page, shape, type, index, len);
        }
    }

    textModifyBulletNumbersStart(page: Page, shape: TextShapeLike | Variable, start: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyBulletNumbersStart(shape, _text, start, index, len);
    }
    textModifyBulletNumbersInherit(page: Page, shape: TextShapeLike | Variable, inherit: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const behavior = inherit ? BulletNumbersBehavior.Inherit : BulletNumbersBehavior.Renew;
        this._textop.textModifyBulletNumbersBehavior(shape, _text, behavior, index, len);
    }

    textModifyHorAlign(page: Page, shape: TextShapeLike | Variable, horAlign: TextHorAlign, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        // fix index
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this._textop.textModifyHorAlign(shape, _text, horAlign, index, len);
    }

    textModifyParaIndent(page: Page, shape: TextShapeLike | Variable, indent: number | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyParaIndent(shape, _text, indent, index, len);
    }
    textModifyAutoLineHeight(page: Page, shape: TextShapeLike | Variable, auto: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this._textop.textModifyAutoLineHeight(shape, _text, auto, index, len);
    }
    textModifyMinLineHeight(page: Page, shape: TextShapeLike | Variable, minLineheight: number | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this._textop.textModifyMinLineHeight(shape, _text, minLineheight, index, len);
    }
    textModifyMaxLineHeight(page: Page, shape: TextShapeLike | Variable, maxLineheight: number | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this._textop.textModifyMaxLineHeight(shape, _text, maxLineheight, index, len);
    }
    textModifyKerning(page: Page, shape: TextShapeLike | Variable, kerning: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifySpanKerning(shape, _text, kerning, index, len);
    }
    textModifyParaSpacing(page: Page, shape: TextShapeLike | Variable, paraSpacing: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();

        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this._textop.textModifyParaSpacing(shape, _text, paraSpacing, index, len);
    }
    textModifyPaddingHor(page: Page, shape: TextShapeLike | Variable, padding: { left: number, right: number }, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();

        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this._textop.textModifyPaddingHor(shape, _text, padding, index, len);
    }

    textModifParaTextMask(page: Page, shape: TextShapeLike | Variable, index: number, len: number, maskid: string | undefined) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this._textop.textModifyParaTextMask(shape, _text, index, len, maskid);
    }

    textModifyTransform(page: Page, shape: TextShapeLike | Variable, transform: TextTransformType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();

        if (transform === TextTransformType.UppercaseFirst) {
            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;
        }
        this._textop.textModifySpanTransfrom(shape, _text, transform, index, len);
    }
    setTextGradient(page: Page, shape: TextShapeLike | Variable, gradient: Gradient | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this._textop.textModifyGradient(shape, _text, index, len, gradient);
    }

    // table
    tableInitCell(page: Page, table: TableShape, rowIdx: number, colIdx: number) {
        checkShapeAtPage(page, table);
        return this._tableop.tableInitCell(table, rowIdx, colIdx);
    }

    tableSetCellContentType(page: Page, table: TableShape, cell: TableCellView, contentType: TableCellType | undefined) {
        checkShapeAtPage(page, table);
        // (this.basicapi.tableInitCell(table, rowIdx, colIdx));
        // const cell = table.getCellAt(rowIdx, colIdx);
        this._tableop.tableSetCellContentType(cell.data, contentType);
        if (contentType !== TableCellType.Text && cell.data.text) {
            const len = cell.data.text.length;
            if (len > 1) this._textop.deleteText(cell, cell.data.text, 0, len - 1);
        }
    }

    // tableSetCellContentText(page: Page, table: TableShape, cell: TableCell, text: Text | undefined) {
    //     checkShapeAtPage(page, table);
    //     // (this.basicapi.tableInitCell(table, rowIdx, colIdx));
    //     // const cell = table.getCellAt(rowIdx, colIdx);
    //     (this.basicapi.tableSetCellContentText(cell, text));
    // }

    tableSetCellContentImage(page: Page, table: TableShape, cell: TableCellView, ref: string | undefined) {
        checkShapeAtPage(page, table);
        // (this.basicapi.tableInitCell(table, rowIdx, colIdx));
        // const cell = table.getCellAt(rowIdx, colIdx)!;
        const origin = cell.imageRef;
        if (origin !== ref) {
            this._tableop.tableSetCellContentImage(cell.data, ref);
        }
    }

    tableModifyColWidth(page: Page, table: TableShape, idx: number, width: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyColWidth(page, table, idx, width);
    }

    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyRowHeight(page, table, idx, height);
    }

    tableInsertRow(page: Page, table: TableShape, idx: number, height: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableInsertRow(table, idx, height);
    }

    tableRemoveRow(page: Page, table: TableShape, idx: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableRemoveRow(table, idx);
        // todo 删除对应的单元格
    }

    tableInsertCol(page: Page, table: TableShape, idx: number, width: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableInsertCol(table, idx, width);
    }

    tableRemoveCol(page: Page, table: TableShape, idx: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableRemoveCol(table, idx);
        // todo 删除对应的单元格
    }

    tableModifyCellSpan(page: Page, table: TableShape, cell: TableCellView, rowSpan: number, colSpan: number) {
        checkShapeAtPage(page, table);
        // (this.basicapi.tableInitCell(table, rowIdx, colIdx));
        // const cell = table.getCellAt(rowIdx, colIdx)!;
        const origin = { rowSpan: cell.rowSpan, colSpan: cell.colSpan };
        if ((origin.rowSpan ?? 1) !== rowSpan || (origin.colSpan ?? 1) !== colSpan) {
            this._tableop.tableModifyCellSpan(cell.data, rowSpan, colSpan);
        }
    }

    // table text
    tableModifyTextColor(page: Page, table: TableShape, color: Color | undefined) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextColor(table, color);
    }
    tableModifyTextHighlightColor(page: Page, table: TableShape, color: Color | undefined) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextHighlightColor(table, color);
    }
    tableModifyTextFontName(page: Page, table: TableShape, fontName: string) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextFontName(table, fontName);
    }
    tableModifyTextFontSize(page: Page, table: TableShape, fontSize: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextFontSize(table, fontSize);
    }
    tableModifyTextVerAlign(page: Page, table: TableShape, verAlign: TextVerAlign) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextVerAlign(table, verAlign);
    }
    tableModifyTextHorAlign(page: Page, table: TableShape, horAlign: TextHorAlign) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextHorAlign(table, horAlign);
    }

    tableModifyTextAutoLineHeight(page: Page, table: TableShape, autoLineHeight: boolean) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextAutoLineHeight(table, autoLineHeight);
    }
    tableModifyTextMinLineHeight(page: Page, table: TableShape, lineHeight: number | undefined) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextMinLineHeight(table, lineHeight);
    }
    tableModifyTextMaxLineHeight(page: Page, table: TableShape, lineHeight: number | undefined) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextMaxLineHeight(table, lineHeight);
    }
    tableModifyTextKerning(page: Page, table: TableShape, kerning: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextKerning(table, kerning);
    }
    tableModifyTextParaSpacing(page: Page, table: TableShape, paraSpacing: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextParaSpacing(table, paraSpacing);
    }
    tableModifyTextUnderline(page: Page, table: TableShape, underline: UnderlineType | undefined) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextUnderline(table, underline);
    }
    tableModifyTextStrikethrough(page: Page, table: TableShape, strikethrough: StrikethroughType | undefined) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextStrikethrough(table, strikethrough);
    }
    tableModifyTextWeight(page: Page, table: TableShape, weight: number) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextWeight(table, weight);
    }
    tableModifyTextItalic(page: Page, table: TableShape, italic: boolean) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextItalic(table, italic);
    }
    tableModifyTextTransform(page: Page, table: TableShape, transform: TextTransformType | undefined) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextTransform(table, transform);
    }
    tableModifyTextFillType(page: Page, table: TableShape, fillType: FillType | undefined) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextFillType(table, fillType);
    }
    tableModifyTextGradient(page: Page, table: TableShape, gradient: Gradient | undefined) {
        checkShapeAtPage(page, table);
        this._tableop.tableModifyTextGradient(table, gradient);
    }
}

export type Operator = OperatorT<BasicOpImpl>;