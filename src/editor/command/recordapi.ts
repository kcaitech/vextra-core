
import * as basicapi from "../basicapi"
import { Repository } from "../../data/transact";
import { Page } from "../../data/page";
import { Document } from "../../data/document";
import {
    exportBorder,
    exportBorderPosition,
    exportBorderStyle,
    exportColor,
    exportContactForm,
    exportContactRole, exportCurveMode,
    exportCurvePoint,
    exportFill,
    exportPage,
    exportPoint2D, exportShadow, exportShadowPosition,
    exportTableCell,
    exportText,
    exportVariable,
    exportExportFormat, exportExportFileFormat, exportExportFormatNameingScheme
} from "../../data/baseexport";
import { BORDER_ATTR_ID, BORDER_ID, CONTACTS_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, POINTS_ATTR_ID, POINTS_ID, SHAPE_ATTR_ID, TABLE_ATTR_ID, TEXT_ATTR_ID, SHADOW_ID, SHADOW_ATTR_ID, CUTOUT_ID, CUTOUT_ATTR_ID } from "./consts";
import {
    GroupShape,
    Shape,
    PathShape,
    PathShape2,
    TextShape,
    Variable,
    SymbolShape,
    VariableType, CurveMode
} from "../../data/shape";
import { exportShape, updateShapesFrame } from "../coop/utils";
import { Border, BorderPosition, BorderStyle, ContextSettings, Fill, MarkerType, Style, Shadow } from "../../data/style";
import { BulletNumbers, SpanAttr, SpanAttrSetter, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "../../data/text";
import { RectShape, SymbolRefShape, TableCell, TableCellType, TableShape } from "../../data/classes";
import { BlendMode, BoolOp, BulletNumbersBehavior, BulletNumbersType, ExportFileFormat, FillType, OverrideType, Point2D, StrikethroughType, TextTransformType, UnderlineType, ShadowPosition, ExportFormatNameingScheme } from "../../data/typesdefine";
import { _travelTextPara } from "../../data/texttravel";
import { uuid } from "../../basic/uuid";
import { ContactForm, ContactRole, CurvePoint, ExportFormat, ExportOptions } from "../../data/baseclasses";
import { ContactShape } from "../../data/contact"
import { BasicMap, BasicArray } from "../../data/basic";
import { Color } from "../../data/classes";
import { Op } from "../../coop/common/op";
import { LocalCmd as Cmd } from "../coop/localcmd";

// 要支持variable的修改
type TextShapeLike = Shape & { text: Text }

function varParent(_var: Variable) {
    let p = _var.parent;
    while (p && !(p instanceof Shape)) p = p.parent;
    return p;
}

function checkShapeAtPage(page: Page, obj: Shape | Variable) {
    obj = obj instanceof Shape ? obj : varParent(obj) as Shape;
    const shapeid = obj.shapeId;
    if (!page.getShape(shapeid[0] as string)) throw new Error("shape not inside page")
}

export class Api {
    private uid: string;
    private ops: Op[] = [];
    private needUpdateFrame: { shape: Shape, page: Page }[] = [];
    private repo: Repository;
    constructor(uid: string, repo: Repository) {
        this.uid = uid;
        this.repo = repo;
    }
    start() {
        this.ops.length = 0;
        this.needUpdateFrame.length = 0;
    }
    isNeedCommit(): boolean {
        return this.ops.length > 0;
    }
    commit(): Cmd | undefined {
        if (this.needUpdateFrame.length > 0) {
            const update = this.needUpdateFrame.slice(0);
            const page = update[0].page;
            const shapes = update.map((v) => v.shape);
            updateShapesFrame(page, shapes, basicapi) // 不需要生成op
        }
        this.needUpdateFrame.length = 0;

        // todo
        return {
            id: uuid(),
            mergeable: true,
            delay: 500,
            version: 0,
            userId: this.uid,
            ops: this.ops.slice(0),
            isUndo: false,
            blockId: [""],
            description: "",
            time: 0,
            posttime: 0
        }
    }

    // todo 走proxy
    // private __trap(f: () => void) {
    //     // todo
    //     const save = this.repo.transactCtx.settrap;
    //     this.repo.transactCtx.settrap = false;
    //     try {
    //         f();
    //     }
    //     finally {
    //         this.repo.transactCtx.settrap = save;
    //     }
    // }
    private addOp(op: Op[] | Op | undefined) {
        if (Array.isArray(op)) this.ops.push(...op);
        else if (op) this.ops.push(op);
    }

    pageInsert(document: Document, page: Page, index: number) {
        this.addOp(basicapi.pageInsert(this.uid, document, page, index));
    }
    pageDelete(document: Document, index: number) {
        this.addOp(basicapi.pageDelete(this.uid, document, index));
    }
    pageModifyName(document: Document, pageId: string, name: string) {
        this.addOp(basicapi.pageModifyName(document, pageId, name));
    }
    pageModifyBackground(document: Document, pageId: string, color: Color) {
        const item = document.pagesMgr.getSync(pageId);
        if (!item) return;
        this.addOp(basicapi.crdtSetAttr(item, "backgroundColor", color));
    }
    pageMove(document: Document, pageId: string, fromIdx: number, toIdx: number) {
        this.addOp(basicapi.pageMove(this.uid, document, fromIdx, toIdx));
    }
    shapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number) {
        this.addOp(basicapi.shapeInsert(this.uid, page, parent, shape, index, this.needUpdateFrame));
    }
    shapeDelete(page: Page, parent: GroupShape, index: number) {
        this.addOp(basicapi.shapeDelete(this.uid, page, parent, index, this.needUpdateFrame));
    }
    shapeMove(page: Page, fromParent: GroupShape, fromIdx: number, toParent: GroupShape, toIdx: number) {
        this.addOp(basicapi.shapeMove(this.uid, page, fromParent, fromIdx, toParent, toIdx, this.needUpdateFrame));
    }
    shapeModifyX(page: Page, shape: Shape, x: number) {
        checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (x !== frame.x) this.addOp(basicapi.crdtSetAttr(frame, "x", x));
    }
    shapeModifyY(page: Page, shape: Shape, y: number) {
        checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (y !== frame.y) this.addOp(basicapi.crdtSetAttr(frame, "y", y));
    }
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number) {
        this.shapeModifyWidth(page, shape, w);
        this.shapeModifyHeight(page, shape, h);
    }
    shapeModifyWidth(page: Page, shape: Shape, w: number) {
        checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (w !== frame.width) this.addOp(basicapi.crdtSetAttr(frame, "width", w));
    }
    shapeModifyHeight(page: Page, shape: Shape, h: number) {
        checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (h !== frame.height) this.addOp(basicapi.crdtSetAttr(frame, "height", h));
    }
    shapeModifyStartMarkerType(page: Page, shape: Shape, mt: MarkerType) {
        checkShapeAtPage(page, shape);
        const style = shape.style;
        if (mt !== style.startMarkerType) this.addOp(basicapi.crdtSetAttr(style, "startMarkerType", mt));
    }
    shapeModifyEndMarkerType(page: Page, shape: Shape, mt: MarkerType) {
        checkShapeAtPage(page, shape);
        const style = shape.style;
        if (mt !== style.endMarkerType) this.addOp(basicapi.crdtSetAttr(style, "endMarkerType", mt));
    }

    shapeModifyContactFrom(page: Page, shape: ContactShape, from: ContactForm | undefined) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "from", from));
    }
    shapeModifyContactTo(page: Page, shape: ContactShape, to: ContactForm | undefined) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "to", to));
    }
    contactModifyEditState(page: Page, shape: ContactShape, state: boolean) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "isEdited", state));
    }
    shapeModifyRotate(page: Page, shape: Shape, rotate: number) {
        checkShapeAtPage(page, shape);
        rotate = rotate % 360;
        if (rotate !== shape.rotation) this.addOp(basicapi.crdtSetAttr(shape, "rotation", rotate))
    }
    shapeModifyConstrainerProportions(page: Page, shape: Shape, prop: boolean) {
        checkShapeAtPage(page, shape);
        if (shape.constrainerProportions !== prop) this.addOp(basicapi.crdtSetAttr(shape, "constrainerProportions", prop));
    }
    shapeModifyName(page: Page, shape: Shape, name: string) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "name", name));
    }
    shapeModifyNameFixed(page: Page, shape: Shape, isFixed: boolean) {
        checkShapeAtPage(page, shape);
        if (shape.nameIsFixed !== isFixed) this.addOp(basicapi.crdtSetAttr(shape, "nameIsFixed", isFixed));
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
        this.addOp(basicapi.crdtSetAttr(_var, "value", value));
    }
    shapeModifyVariableName(page: Page, _var: Variable, name: string) {
        checkShapeAtPage(page, _var);
        this.addOp(basicapi.crdtSetAttr(_var, "name", name));
    }
    shapeAddVariable(page: Page, shape: SymbolShape | SymbolRefShape, _var: Variable) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            shape.addVar(_var);
            const shapeId = genShapeId(shape);
            shapeId.push(_var.id);
            const origin = new Variable(_var.id, _var.type, _var.name, undefined);
            this.addOp(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyvar1, exportVariable(_var), exportVariable(origin)));
        })
    }
    shapeRemoveVariable(page: Page, shape: SymbolShape | SymbolRefShape, key: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _var = shape.getVar(key);
            if (!_var) return;
            shape.removeVar(key);
            const shapeId = genShapeId(shape);
            shapeId.push(key);
            const cur = new Variable(_var.id, _var.type, _var.name, undefined);
            this.addOp(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyvar1, exportVariable(cur), exportVariable(_var)));
        })
    }
    shapeRemoveVirbindsEx(page: Page, shape: SymbolShape | SymbolRefShape, key: string, varId: string, type: VariableType) {
        checkShapeAtPage(page, shape);
        const save = shape.overrides?.get(key);
        if (!save) return
        this.__trap(() => {
            const shapeId = genShapeId(shape);
            (shape as SymbolRefShape).removeVirbindsEx(key);
            shapeId.push(type);
            this.addOp(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.overrides, { type, varId: undefined }, { type, varId: save }));
        })
    }
    shapeBindVar(page: Page, shape: Shape, type: OverrideType, varId: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.varbinds?.get(type);
            if (!shape.varbinds) shape.varbinds = new BasicMap();
            shape.varbinds.set(type, varId);
            const shapeId = genShapeId(shape);
            shapeId.push(type);
            this.addOp(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.bindvar, { type, varId }, { type, varId: save }));
        })
    }
    shapeUnbinVar(page: Page, shape: Shape, type: OverrideType) {
        checkShapeAtPage(page, shape);
        const save = shape.varbinds?.get(type);
        if (!save) return;
        this.__trap(() => {
            const shapeId = genShapeId(shape);
            shape.varbinds!.delete(type);
            shapeId.push(type);
            this.addOp(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyoverride1, { type, varId: undefined }, { type, varId: save }));
        })
    }
    // shapeModifyOverride(page: Page, shape: SymbolShape | SymbolRefShape, refId: string, attr: OverrideType, value: string) {
    //     checkShapeAtPage(page, shape);
    //     this.__trap(() => {
    //         const save = shape.getOverrid2(refId, attr);
    //         shape.addOverrid2(refId, attr, value);
    //         const shapeId = genShapeId(shape);
    //         shapeId.push(refId + '/' + attr);
    //         this.addCmd(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyoverride1, { refId, attr, value }, { refId, attr, value: save }));
    //     })
    // }
    shapeAddOverride(page: Page, shape: SymbolShape | SymbolRefShape, refId: string, attr: OverrideType, value: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            shape.addOverrid2(refId, attr, value);
            const shapeId = genShapeId(shape);
            shapeId.push(refId + '/' + attr);
            this.addOp(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyoverride1, { refId, attr, value }, { refId, attr, value: undefined }));
        })
    }

    /**
     * @description 初始化或修改组件的状态属性
     */
    shapeModifyVartag(page: Page, shape: SymbolShape, varId: string, tag: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.symtags?.get(varId);
            const shapeId = genShapeId(shape);
            shapeId.push(varId);
            if (!shape.symtags) shape.symtags = new BasicMap();
            shape.setTag(varId, tag);
            this.addOp(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.symtags, { varId, tag }, { varId, tag: save }));
        })
    }
    shapeModifyVisible(page: Page, shape: Shape, isVisible: boolean) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "isVisible", isVisible));
    }
    shapeModifySymRef(page: Page, shape: SymbolRefShape, refId: string) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "refId", refId));
    }

    shapeModifyLock(page: Page, shape: Shape, isLocked: boolean) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "isLocked", isLocked));
    }
    shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "isFlippedHorizontal", hflip));
    }
    shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "isFlippedVertical", vflip));
    }
    shapeModifyContextSettingsOpacity(page: Page, shape: Shape, contextSettingsOpacity: number) {
        if (shape.isVirtualShape) {
            return; // todo
        }
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            if (!shape.style.contextSettings) {
                shape.style.contextSettings = new ContextSettings(BlendMode.Normal, 1);
            }
            const save = shape.style.contextSettings.opacity;
            shape.setContextSettingsOpacity(contextSettingsOpacity);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.contextSettingsOpacity, contextSettingsOpacity, save))
        })
    }
    shapeModifyResizingConstraint(page: Page, shape: Shape, resizingConstraint: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "resizingConstraint", resizingConstraint));
    }
    shapeModifyRadius(page: Page, shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.getRectRadius();
            shape.setRectRadius(lt, rt, rb, lb);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.radius, { lt, rt, rb, lb }, save))
        })
    }
    shapeModifyFixedRadius(page: Page, shape: GroupShape | PathShape | PathShape2 | TextShape, fixedRadius: number | undefined) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "fixedRadius", fixedRadius));
    }
    shapeModifyCurvPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const p = shape.points[index];
            const origin: Point2D = { x: p.x, y: p.y }
            p.x = point.x;
            p.y = point.y;
            this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, p.id, POINTS_ATTR_ID.point, exportPoint2D(point), origin))
        })
    }
    shapeModifyCurvFromPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const p = shape.points[index];
            const origin = { x: p.fromX, y: p.fromY }
            p.fromX = point.x;
            p.fromY = point.y;
            this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, p.id, POINTS_ATTR_ID.from, exportPoint2D(point), origin))
        })
    }
    shapeModifyCurvToPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const p = shape.points[index];
            const origin = { x: p.toX, y: p.toY };
            p.toX = point.x;
            p.toY = point.y;
            this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, p.id, POINTS_ATTR_ID.to, exportPoint2D(point), origin))
        })
    }
    shapeModifyBoolOp(page: Page, shape: Shape, op: BoolOp | undefined) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "boolOp", op));
    }
    shapeModifyBoolOpShape(page: Page, shape: GroupShape, isOpShape: boolean | undefined) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "isBoolOpShape", isOpShape));
    }

    // 添加一次fill
    addFillAt(page: Page, shape: Shape | Variable, fill: Fill, index: number) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        this.addOp(basicapi.addFillAt(this.uid, fills, fill, index));
    }
    // 添加多次fill
    addFills(page: Page, shape: Shape | Variable, fills: Fill[]) {
        checkShapeAtPage(page, shape);
        const fillsOld = shape instanceof Shape ? shape.style.fills : shape.value;
        for (let i = 0; i < fills.length; i++) {
            const fill = fills[i];
            this.addOp(basicapi.addFillAt(this.uid, fillsOld, fill, i));
        }
    }
    // 添加一条border
    addBorderAt(page: Page, shape: Shape | Variable, border: Border, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const borders = shape instanceof Shape ? shape.style.borders : shape.value;
            basicapi.addBorderAt(borders, border, index);
            this.addOp(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), BORDER_ID, border.id, index, exportBorder(border)))
        })
    }
    // 添加多条border
    addBorders(page: Page, shape: Shape | Variable, borders: Border[]) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const bordersOld = shape instanceof Shape ? shape.style.borders : shape.value;
            for (let i = 0; i < borders.length; i++) {
                const border = borders[i];
                basicapi.addBorderAt(bordersOld, border, i);
                this.addOp(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), BORDER_ID, border.id, i, exportBorder(border)));
            }
        })
    }
    // 删除一次fill
    deleteFillAt(page: Page, shape: Shape | Variable, index: number) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        if (!fills[index]) return;
        this.__trap(() => {
            const fill = basicapi.deleteFillAt(fills, index);
            if (fill) this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, index, exportFill(fill)));
        })
    }
    // 批量删除fill
    deleteFills(page: Page, shape: Shape | Variable, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fillsOld = shape instanceof Shape ? shape.style.fills : shape.value;
            const fills = basicapi.deleteFills(fillsOld, index, strength);
            if (fills && fills.length) {
                for (let i = 0; i < fills.length; i++) {
                    const fill = fills[i];
                    this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, index, exportFill(fill)));
                }
            }
        })
    }
    // 删除一次border
    deleteBorderAt(page: Page, shape: Shape | Variable, index: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[index]) return;
        this.__trap(() => {
            const border = basicapi.deleteBorderAt(borders, index);
            if (border) this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), BORDER_ID, border.id, index, exportBorder(border)));
        })
    }
    // 批量删除border
    deleteBorders(page: Page, shape: Shape | Variable, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const bordersOld = shape instanceof Shape ? shape.style.borders : shape.value;
            const borders = basicapi.deleteBorders(bordersOld, index, strength);
            if (borders && borders.length) {
                for (let i = 0; i < borders.length; i++) {
                    const border = borders[i];
                    this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), BORDER_ID, border.id, index, exportBorder(border)));
                }
            }
        })

    }
    setFillColor(page: Page, shape: Shape | Variable, idx: number, color: Color) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        const fill: Fill = fills[idx];
        if (!fill) return;
        this.addOp(basicapi.crdtSetAttr(fill, "color", color));
    }
    setFillEnable(page: Page, shape: Shape | Variable, idx: number, isEnable: boolean) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        const fill: Fill = fills[idx];
        if (!fill) return;
        this.addOp(basicapi.crdtSetAttr(fill, "isEnabled", isEnable));
    }
    setBorderColor(page: Page, shape: Shape | Variable, idx: number, color: Color) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.addOp(basicapi.crdtSetAttr(borders[idx], "color", color));
    }
    setBorderEnable(page: Page, shape: Shape | Variable, idx: number, isEnable: boolean) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.addOp(basicapi.crdtSetAttr(borders[idx], "isEnabled", isEnable));
    }
    setBorderThickness(page: Page, shape: Shape | Variable, idx: number, thickness: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.addOp(basicapi.crdtSetAttr(borders[idx], "thickness", thickness));
    }
    setBorderPosition(page: Page, shape: Shape | Variable, idx: number, position: BorderPosition) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.addOp(basicapi.crdtSetAttr(borders[idx], "position", position));
    }
    setBorderStyle(page: Page, shape: Shape | Variable, idx: number, borderStyle: BorderStyle) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.addOp(basicapi.crdtSetAttr(borders[idx], "borderStyle", borderStyle));
    }
    moveFill(page: Page, shape: Shape | Variable, idx: number, idx2: number) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        this.addOp(basicapi.moveFill(this.uid, fills, idx, idx2));
    }
    moveBorder(page: Page, shape: Shape | Variable, idx: number, idx2: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const borders = shape instanceof Shape ? shape.style.borders : shape.value;

            const border = borders.splice(idx, 1)[0];
            if (border) {
                borders.splice(idx2, 0, border);
                this.addOp(ShapeArrayAttrMove.Make(page.id, genShapeId(shape), BORDER_ID, idx, idx2))
            }
        })
    }
    // points
    addPointAt(page: Page, shape: PathShape, idx: number, point: CurvePoint) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addPointAt(shape, point, idx)
            this.addOp(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), POINTS_ID, point.id, idx, exportCurvePoint(point)))
        })
    }
    deletePoints(page: Page, shape: PathShape, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const points = basicapi.deletePoints(shape, index, strength);
            if (points && points.length) {
                for (let i = 0; i < points.length; i++) {
                    const point = points[i];
                    this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), POINTS_ID, point.id, index, exportCurvePoint(point)));
                }
            }
        })
    }
    deletePoint(page: Page, shape: PathShape, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const point = basicapi.deletePoints(shape, index, 1)[0];
            if (!point) return;
            this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), POINTS_ID, point.id, index, exportCurvePoint(point)));
        })
    }
    addPoints(page: Page, shape: PathShape, points: CurvePoint[]) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                basicapi.addPointAt(shape, point, i);
                this.addOp(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), POINTS_ID, point.id, i, exportCurvePoint(point)));
            }
        })
    }
    modifyPointCurveMode(page: Page, shape: PathShape, index: number, curveMode: CurveMode) {
        checkShapeAtPage(page, shape);
        const point = shape.points[index];
        if (!point) return;
        this.__trap(() => {
            const save = point.mode;
            point.mode = curveMode;
            this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, point.id, POINTS_ATTR_ID.curveMode, exportCurveMode(curveMode), exportCurveMode(save)));
        })
    }
    modifyPointHasFrom(page: Page, shape: PathShape, index: number, hasFrom: boolean) {
        checkShapeAtPage(page, shape);
        const point = shape.points[index];
        if (!point) return;
        this.__trap(() => {
            const save = point.hasFrom;
            point.hasFrom = hasFrom;
            this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, point.id, POINTS_ATTR_ID.hasFrom, hasFrom, save));
        })
    }
    modifyPointHasTo(page: Page, shape: PathShape, index: number, hasTo: boolean) {
        checkShapeAtPage(page, shape);
        const point = shape.points[index];
        if (!point) return;
        this.__trap(() => {
            const save = point.hasTo;
            point.hasTo = hasTo;
            this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, point.id, POINTS_ATTR_ID.hasTo, hasTo, save));
        })
    }
    modifyPointCornerRadius(page: Page, shape: PathShape, index: number, cornerRadius: number) {
        checkShapeAtPage(page, shape);
        const point = shape.points[index];
        if (!point) return;
        this.__trap(() => {
            const save = point.radius;
            point.radius = cornerRadius;
            this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, point.id, POINTS_ATTR_ID.cornerRadius, cornerRadius, save));
        })
    }
    setCloseStatus(page: Page, shape: PathShape, isClosed: boolean) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isClosed;
            shape.setClosedState(isClosed);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.isClosed, isClosed, save));
        })
    }
    // contacts
    addContactAt(page: Page, shape: Shape, contactRole: ContactRole, idx: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addContactShape(shape.style, contactRole);
            this.addOp(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), CONTACTS_ID, contactRole.id, idx, exportContactRole(contactRole)))
        })
    }
    removeContactRoleAt(page: Page, shape: Shape, index: number) {
        checkShapeAtPage(page, shape);
        if (!shape.style.contacts || !shape.style.contacts[index]) return;
        this.__trap(() => {
            const contactRole = basicapi.removeContactRoleAt(shape.style, index);
            if (contactRole) this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), CONTACTS_ID, contactRole.id, index, exportContactRole(contactRole)));
        })
    }
    // shadow
    addShadows(page: Page, shape: Shape, shadows: Shadow[]) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            for (let i = 0; i < shadows.length; i++) {
                const shadow = shadows[i];
                basicapi.addShadow(shape.style.shadows, shadow, i);
                this.addOp(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, i, exportShadow(shadow)));
            }
        })
    }
    addShadow(page: Page, shape: Shape | Variable, shadow: Shadow, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
            basicapi.addShadow(shadows, shadow, index);
            this.addOp(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, index, exportShadow(shadow)))
        })
    }
    deleteShadows(page: Page, shape: Shape | Variable, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
            const dels = basicapi.deleteShadows(shadows, index, strength);
            if (dels && dels.length) {
                for (let i = 0; i < dels.length; i++) {
                    const shadow = dels[i];
                    this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, index, exportShadow(shadow)));
                }
            }
        })
    }
    deleteShadowAt(page: Page, shape: Shape | Variable, idx: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
            const shadow = basicapi.deleteShadowAt(shadows, idx);
            if (shadow) this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, idx, exportShadow(shadow)));
        })
    }
    setShadowEnable(page: Page, shape: Shape | Variable, idx: number, isEnable: boolean) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        const shadow = shadows[idx];
        if (shadow) {
            this.__trap(() => {
                const save = shadow.isEnabled;
                shadow.isEnabled = isEnable;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, SHADOW_ATTR_ID.enable, isEnable, save));
            })
        }
    }
    setShadowOffsetX(page: Page, shape: Shape | Variable, idx: number, offsetX: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        const shadow = shadows[idx];
        if (shadow) {
            this.__trap(() => {
                const save = shadow.offsetX;
                shadow.offsetX = offsetX;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, SHADOW_ATTR_ID.offsetX, offsetX, save));
            })
        }
    }
    setShadowOffsetY(page: Page, shape: Shape | Variable, idx: number, offsetY: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        const shadow = shadows[idx];
        if (shadow) {
            this.__trap(() => {
                const save = shadow.offsetY;
                shadow.offsetY = offsetY;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, SHADOW_ATTR_ID.offsetY, offsetY, save));
            })
        }
    }
    setShadowBlur(page: Page, shape: Shape | Variable, idx: number, blur: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        const shadow = shadows[idx];
        if (shadow) {
            this.__trap(() => {
                const save = shadow.blurRadius;
                shadow.blurRadius = blur;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, SHADOW_ATTR_ID.blurRadius, blur, save));
            })
        }
    }
    setShadowSpread(page: Page, shape: Shape | Variable, idx: number, spread: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        const shadow = shadows[idx];
        if (shadow) {
            this.__trap(() => {
                const save = shadow.spread;
                shadow.spread = spread;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, SHADOW_ATTR_ID.spread, spread, save));
            })
        }
    }
    setShadowColor(page: Page, shape: Shape | Variable, idx: number, color: Color) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        const shadow = shadows[idx];
        if (shadow) {
            this.__trap(() => {
                const save = shadow.color;
                shadow.color = color;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, SHADOW_ATTR_ID.color, exportColor(color), exportColor(save)));
            })
        }
    }
    setShadowPosition(page: Page, shape: Shape | Variable, idx: number, position: ShadowPosition) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        const shadow = shadows[idx];
        if (shadow) {
            this.__trap(() => {
                const save = shadow.position;
                shadow.position = position;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, SHADOW_ATTR_ID.position, exportShadowPosition(position), exportShadowPosition(save)));
            })
        }
    }
    // cutout
    deleteExportFormatAt(page: Page, shape: Shape, idx: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            if (!shape.exportOptions) return;
            const format = basicapi.deleteExportFormatAt(shape.exportOptions, idx);
            if (format) this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), CUTOUT_ID, format.id, idx, exportExportFormat(format)));
        })
    }
    deletePageExportFormatAt(page: Page, idx: number) {
        this.__trap(() => {
            if (!page.exportOptions) return;
            const format = basicapi.deletePageExportFormatAt(page.exportOptions, idx);
            if (format) this.addOp(ShapeArrayAttrRemove.Make(page.id, Array(page.id), CUTOUT_ID, format.id, idx, exportExportFormat(format)));
        })
    }
    deleteExportFormats(page: Page, shape: Shape, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            if (!shape.exportOptions) return;
            const formats = basicapi.deleteExportFormats(shape.exportOptions, index, strength);
            if (formats && formats.length) {
                for (let i = 0; i < formats.length; i++) {
                    const format = formats[i];
                    this.addOp(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), CUTOUT_ID, format.id, index, exportExportFormat(format)));
                }
            }
        })

    }
    addExportFormats(page: Page, shape: Shape, formats: ExportFormat[]) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            for (let i = 0; i < formats.length; i++) {
                const format = formats[i];
                basicapi.addExportFormat(shape, format, i);
                this.addOp(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), CUTOUT_ID, format.id, i, exportExportFormat(format)));
            }
        })
    }
    addExportFormat(page: Page, shape: Shape, format: ExportFormat, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            if (!shape.exportOptions) {
                const formats = new BasicArray<ExportFormat>();
                const includedChildIds = new BasicArray<string>();
                shape.exportOptions = new ExportOptions(formats, includedChildIds, 0, false, false, false, false);
            }
            basicapi.addExportFormat(shape, format, index);
            this.addOp(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), CUTOUT_ID, format.id, index, exportExportFormat(format)))
        })
    }
    addPageExportFormat(page: Page, format: ExportFormat, index: number) {
        this.__trap(() => {
            if (!page.exportOptions) {
                const formats = new BasicArray<ExportFormat>();
                const includedChildIds = new BasicArray<string>();
                page.exportOptions = new ExportOptions(formats, includedChildIds, 0, false, false, false, false);
            }
            basicapi.addPageExportFormat(page, format, index);
            this.addOp(ShapeArrayAttrInsert.Make(page.id, Array(page.id), CUTOUT_ID, format.id, index, exportExportFormat(format)))
        })
    }
    setExportFormatScale(page: Page, shape: Shape, idx: number, scale: number) {
        checkShapeAtPage(page, shape);
        const format = shape.exportOptions?.exportFormats[idx];
        if (format) {
            this.__trap(() => {
                const save = format.scale;
                format.scale = scale;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), CUTOUT_ID, format.id, CUTOUT_ATTR_ID.scale, scale, save));
            })
        }
    }
    setPageExportFormatScale(page: Page, idx: number, scale: number) {
        const format = page.exportOptions?.exportFormats[idx];
        if (format) {
            this.__trap(() => {
                const save = format.scale;
                format.scale = scale;
                this.addOp(ShapeArrayAttrModify.Make(page.id, Array(page.id), CUTOUT_ID, format.id, CUTOUT_ATTR_ID.scale, scale, save));
            })
        }
    }
    setExportFormatName(page: Page, shape: Shape, idx: number, name: string) {
        checkShapeAtPage(page, shape);
        const format = shape.exportOptions?.exportFormats[idx];
        if (format) {
            this.__trap(() => {
                const save = format.name;
                format.name = name;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), CUTOUT_ID, format.id, CUTOUT_ATTR_ID.name, name, save));
            })
        }
    }
    setPageExportFormatName(page: Page, idx: number, name: string) {
        const format = page.exportOptions?.exportFormats[idx];
        if (format) {
            this.__trap(() => {
                const save = format.name;
                format.name = name;
                this.addOp(ShapeArrayAttrModify.Make(page.id, Array(page.id), CUTOUT_ID, format.id, CUTOUT_ATTR_ID.name, name, save));
            })
        }
    }
    setExportFormatFileFormat(page: Page, shape: Shape, idx: number, fileFormat: ExportFileFormat) {
        checkShapeAtPage(page, shape);
        const format = shape.exportOptions?.exportFormats[idx];
        if (format) {
            this.__trap(() => {
                const save = format.fileFormat;
                format.fileFormat = fileFormat;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), CUTOUT_ID, format.id, CUTOUT_ATTR_ID.fileFormat, exportExportFileFormat(fileFormat), exportExportFileFormat(save)));
            })
        }
    }
    setPageExportFormatFileFormat(page: Page, idx: number, fileFormat: ExportFileFormat) {
        const format = page.exportOptions?.exportFormats[idx];
        if (format) {
            this.__trap(() => {
                const save = format.fileFormat;
                format.fileFormat = fileFormat;
                this.addOp(ShapeArrayAttrModify.Make(page.id, Array(page.id), CUTOUT_ID, format.id, CUTOUT_ATTR_ID.fileFormat, exportExportFileFormat(fileFormat), exportExportFileFormat(save)));
            })
        }
    }
    setExportFormatPerfix(page: Page, shape: Shape, idx: number, perfix: ExportFormatNameingScheme) {
        checkShapeAtPage(page, shape);
        const format = shape.exportOptions?.exportFormats[idx];
        if (format) {
            this.__trap(() => {
                const save = format.namingScheme;
                format.namingScheme = perfix;
                this.addOp(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), CUTOUT_ID, format.id, CUTOUT_ATTR_ID.perfix, exportExportFormatNameingScheme(perfix), exportExportFormatNameingScheme(save)));
            })
        }
    }
    setPageExportFormatPerfix(page: Page, idx: number, perfix: ExportFormatNameingScheme) {
        const format = page.exportOptions?.exportFormats[idx];
        if (format) {
            this.__trap(() => {
                const save = format.namingScheme;
                format.namingScheme = perfix;
                this.addOp(ShapeArrayAttrModify.Make(page.id, Array(page.id), CUTOUT_ID, format.id, CUTOUT_ATTR_ID.perfix, exportExportFormatNameingScheme(perfix), exportExportFormatNameingScheme(save)));
            })
        }
    }
    setExportTrimTransparent(page: Page, shape: Shape, trim: boolean) {
        checkShapeAtPage(page, shape);
        const options = shape.exportOptions;
        if (options) {
            this.__trap(() => {
                const save = options.trimTransparent;
                options.trimTransparent = trim;
                this.addOp(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.trimTransparent, trim, save));
            })
        }
    }
    setExportCanvasBackground(page: Page, shape: Shape, background: boolean) {
        checkShapeAtPage(page, shape);
        const options = shape.exportOptions;
        if (options) {
            this.__trap(() => {
                const save = options.canvasBackground;
                options.canvasBackground = background;
                this.addOp(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.canvasBackground, background, save));
            })
        }
    }
    setExportPreviewUnfold(page: Page, shape: Shape, unfold: boolean) {
        checkShapeAtPage(page, shape);
        const options = shape.exportOptions;
        if (options) {
            this.__trap(() => {
                const save = options.unfold;
                options.unfold = unfold;
                this.addOp(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.previewUnfold, unfold, save));
            })
        }
    }
    setPageExportPreviewUnfold(document: Document, pageId: string, unfold: boolean) {
        const item = document.pagesMgr.getSync(pageId);
        if (!item) return;
        const s_unfold = item.exportOptions!.unfold || false;
        const save = this.repo.transactCtx.settrap;
        this.repo.transactCtx.settrap = false;
        try {
            item.exportOptions!.unfold = unfold;
        } finally {
            this.repo.transactCtx.settrap = save;
        }
        console.log(pageId, 'pageId');

        this.addOp(PageCmdModify.Make(document.id, pageId, PAGE_ATTR_ID.previewUnfold, JSON.stringify(unfold), JSON.stringify(s_unfold)));
    }
    // text
    insertSimpleText(page: Page, shape: TextShapeLike | Variable, idx: number, text: string, attr?: SpanAttr) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            basicapi.insertSimpleText(_text, text, idx, { attr })
            this.addOp(TextCmdInsert.Make(page.id, genShapeId(shape), idx, text.length, { type: "simple", text, attr, length: text.length }))
        })
    }
    insertComplexText(page: Page, shape: TextShapeLike | Variable, idx: number, text: Text) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            basicapi.insertComplexText(_text, text, idx)
            this.addOp(TextCmdInsert.Make(page.id, genShapeId(shape), idx, text.length, { type: "complex", text: exportText(text), length: text.length }))
        })
    }
    deleteText(page: Page, shape: TextShapeLike | Variable, idx: number, len: number) {
        checkShapeAtPage(page, shape);
        let del: Text | undefined;
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            del = basicapi.deleteText(_text, idx, len)
            if (del && del.length > 0) this.addOp(TextCmdRemove.Make(page.id, genShapeId(shape), idx, del.length, { type: "complex", text: exportText(del), length: del.length }))
        })
        return del;
    }
    textModifyColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyColor(_text, idx, len, color);
            ret.forEach((m) => {
                const colorEqual = m.color === color || m.color && color && color.equals(m.color);
                if (!colorEqual) {
                    const cmd = TextCmdModify.Make(page.id,
                        genShapeId(shape),
                        idx,
                        m.length,
                        TEXT_ATTR_ID.color,
                        color ? exportColor(color) : undefined,
                        m.color ? exportColor(m.color) : undefined);
                    this.addOp(cmd);
                }
                idx += m.length;
            })
        })
    }
    textModifyFontName(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontname: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyFontName(_text, idx, len, fontname);
            ret.forEach((m) => {
                if (fontname !== m.fontName) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), idx, m.length, TEXT_ATTR_ID.fontName, fontname, m.fontName));
                idx += m.length;
            })
        })
    }
    textModifyFontSize(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontsize: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyFontSize(_text, idx, len, fontsize);
            ret.forEach((m) => {
                if (fontsize !== m.fontSize) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), idx, m.length, TEXT_ATTR_ID.fontSize, fontsize, m.fontSize));
                idx += m.length;
            })
        })
    }

    shapeModifyTextBehaviour(page: Page, _text: Text, textBehaviour: TextBehaviour) {
        checkShapeAtPage(page, _text.parent as Shape);
        this.__trap(() => {
            // const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.shapeModifyTextBehaviour(page, _text, textBehaviour);
            if (ret !== textBehaviour) {
                this.addOp(ShapeCmdModify.Make(page.id, genShapeId(_text.parent as Shape), SHAPE_ATTR_ID.textBehaviour, textBehaviour, ret));
            }
        })
    }
    shapeModifyTextVerAlign(page: Page, shape: TextShapeLike | Variable, verAlign: TextVerAlign) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.shapeModifyTextVerAlign(_text, verAlign);
            if (ret !== verAlign) {
                this.addOp(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.textVerAlign, verAlign, ret));
            }
        })
    }

    textModifyHighlightColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyHighlightColor(_text, idx, len, color);
            ret.forEach((m) => {
                const colorEqual = m.highlight === color || m.highlight && color && color.equals(m.highlight);
                if (!colorEqual) {
                    const cmd = TextCmdModify.Make(page.id,
                        genShapeId(shape),
                        idx,
                        m.length,
                        TEXT_ATTR_ID.highlightColor,
                        color ? exportColor(color) : undefined,
                        m.highlight ? exportColor(m.highlight) : undefined);
                    this.addOp(cmd);
                }
                idx += m.length;
            })
        });
    }
    textModifyUnderline(page: Page, shape: TextShapeLike | Variable, underline: UnderlineType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyUnderline(_text, underline, index, len);
            ret.forEach((m) => {
                if (underline !== m.underline) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.underline, underline, m.underline));
                index += m.length;
            })
        });
    }
    textModifyStrikethrough(page: Page, shape: TextShapeLike | Variable, strikethrough: StrikethroughType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyStrikethrough(_text, strikethrough, index, len);
            ret.forEach((m) => {
                if (strikethrough !== m.strikethrough) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.strikethrough, strikethrough, m.strikethrough));
                index += m.length;
            })
        });
    }
    textModifyBold(page: Page, shape: TextShapeLike | Variable, bold: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyBold(_text, bold, index, len);
            ret.forEach((m) => {
                if (bold !== m.bold) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.bold, bold, m.bold));
                index += m.length;
            })
        });
    }
    textModifyItalic(page: Page, shape: TextShapeLike | Variable, italic: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyItalic(_text, italic, index, len);
            ret.forEach((m) => {
                if (italic !== m.italic) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.italic, italic, m.italic));
                index += m.length;
            })
        });
    }

    private _textModifyRemoveBulletNumbers(page: Page, shape: TextShapeLike | Variable, index: number, len: number) {
        const removeIndexs: number[] = [];
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        _travelTextPara(_text.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
            index -= _index;
            if (para.text[0] === '*' && para.spans[0].bulletNumbers && para.spans[0].length === 1) {
                removeIndexs.push(index - _index);
            }
            index += para.length;
        })

        for (let i = 0, len = removeIndexs.length; i < len; i++) {
            const del = basicapi.deleteText(_text, removeIndexs[i] - i, 1);
            if (del && del.length > 0) this.addOp(TextCmdRemove.Make(page.id, genShapeId(shape), removeIndexs[i] - i, del.length, { type: "complex", text: exportText(del), length: del.length }))
        }
        if (removeIndexs.length > 0) _text.reLayout();
    }

    private _textModifySetBulletNumbers(page: Page, shape: TextShapeLike | Variable, type: BulletNumbersType, index: number, len: number) {

        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const modifyeds = _text.setBulletNumbersType(type, index, len);
        modifyeds.forEach((m) => {
            this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), m.index, 1, TEXT_ATTR_ID.bulletNumbersType, type, m.origin));
        })

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
            const attr = new SpanAttrSetter();
            attr.placeholder = true;
            attr.bulletNumbers = new BulletNumbers(type);
            basicapi.insertSimpleText(_text, '*', insertIndexs[i] + i, { attr });
            this.addOp(TextCmdInsert.Make(page.id, genShapeId(shape), insertIndexs[i] + i, 1, { type: "simple", text: '*', attr, length: 1 }))
        }
        if (insertIndexs.length > 0) _text.reLayout();
    }

    textModifyBulletNumbers(page: Page, shape: TextShapeLike | Variable, type: BulletNumbersType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
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
        });
    }

    textModifyBulletNumbersStart(page: Page, shape: TextShapeLike | Variable, start: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const modifyeds = _text.setBulletNumbersStart(start, index, len);
            modifyeds.forEach((m) => {
                this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), m.index, 1, TEXT_ATTR_ID.bulletNumbersStart, start, m.origin));
            })
        });
    }
    textModifyBulletNumbersInherit(page: Page, shape: TextShapeLike | Variable, inherit: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const behavior = inherit ? BulletNumbersBehavior.Inherit : BulletNumbersBehavior.Renew;
            const modifyeds = _text.setBulletNumbersBehavior(behavior, index, len);
            modifyeds.forEach((m) => {
                this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), m.index, 1, TEXT_ATTR_ID.bulletNumbersBehavior, behavior, m.origin));
            })
        });
    }

    textModifyHorAlign(page: Page, shape: TextShapeLike | Variable, horAlign: TextHorAlign, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            // fix index
            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyHorAlign(_text, horAlign, index, len);
            ret.forEach((m) => {
                if (horAlign !== m.alignment) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.textHorAlign, horAlign, m.alignment));
                index += m.length;
            })
        })
    }

    textModifyParaIndent(page: Page, shape: TextShapeLike | Variable, indent: number | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            // fix index
            // const alignRange = shape.text.alignParaRange(index, len);
            // index = alignRange.index;
            // len = alignRange.len;
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = _text.setParaIndent(indent, index, len);
            ret.forEach((m) => {
                if (indent !== m.origin) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.len, TEXT_ATTR_ID.indent, indent, m.origin));
                index += m.len;
            })
        })
    }
    textModifyMinLineHeight(page: Page, shape: TextShapeLike | Variable, minLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyMinLineHeight(_text, minLineheight, index, len);
            ret.forEach((m) => {
                if (minLineheight !== m.minimumLineHeight) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.textMinLineheight, minLineheight, m.minimumLineHeight));
                index += m.length;
            })
        })
    }
    textModifyMaxLineHeight(page: Page, shape: TextShapeLike | Variable, maxLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyMaxLineHeight(_text, maxLineheight, index, len);
            ret.forEach((m) => {
                if (maxLineheight !== m.maximumLineHeight) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.textMaxLineheight, maxLineheight, m.maximumLineHeight));
                index += m.length;
            })
        })
    }
    textModifyKerning(page: Page, shape: TextShapeLike | Variable, kerning: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            // const alignRange = shape.text.alignParaRange(index, len);
            // index = alignRange.index;
            // len = alignRange.len;

            // const ret1 = basicapi.textModifyParaKerning(shape, kerning, index, len);
            // ret1.forEach((m) => {
            //     this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.paraKerning, kerning, m.kerning));
            //     index += m.length;
            // })

            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifySpanKerning(_text, kerning, index, len);
            ret.forEach((m) => {
                if (m.kerning !== kerning) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.spanKerning, kerning, m.kerning));
                index += m.length;
            })
        })
    }
    textModifyParaSpacing(page: Page, shape: TextShapeLike | Variable, paraSpacing: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();

            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyParaSpacing(_text, paraSpacing, index, len);
            ret.forEach((m) => {
                if (paraSpacing !== m.paraSpacing) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.paraSpacing, paraSpacing, m.paraSpacing));
                index += m.length;
            })
        })
    }
    textModifyTransform(page: Page, shape: TextShapeLike | Variable, transform: TextTransformType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();

            if (transform === TextTransformType.UppercaseFirst) {
                const alignRange = _text.alignParaRange(index, len);
                index = alignRange.index;
                len = alignRange.len;
            }
            const ret1 = basicapi.textModifySpanTransfrom(_text, transform, index, len);
            ret1.forEach((m) => {
                if (m.transform !== transform) this.addOp(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.spanTransform, transform, m.transform));
                index += m.length;
            })
        })
    }

    // table
    tableSetCellContentType(page: Page, table: TableShape, rowIdx: number, colIdx: number, contentType: TableCellType | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const cell = table.getCellAt(rowIdx, colIdx, true)!;
            const origin = cell.cellType;
            basicapi.tableSetCellContentType(cell, contentType);
            this.addOp(ShapeCmdModify.Make(page.id, [table.id, new TableIndex(rowIdx, colIdx)], SHAPE_ATTR_ID.cellContentType, contentType, origin))
        })
    }

    tableSetCellContentText(page: Page, table: TableShape, rowIdx: number, colIdx: number, text: Text | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const cell = table.getCellAt(rowIdx, colIdx, true)!;
            const origin = cell.text && exportText(cell.text);
            if (origin !== text) { // undefined
                basicapi.tableSetCellContentText(cell, text);
                this.addOp(ShapeCmdModify.Make(page.id, [table.id, new TableIndex(rowIdx, colIdx)], SHAPE_ATTR_ID.cellContentText, text && exportText(text), origin))
            }
        })
    }

    tableSetCellContentImage(page: Page, table: TableShape, rowIdx: number, colIdx: number, ref: string | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const cell = table.getCellAt(rowIdx, colIdx, true)!;
            const origin = cell.imageRef;
            if (origin !== ref) {
                basicapi.tableSetCellContentImage(cell, ref);
                this.addOp(ShapeCmdModify.Make(page.id, [table.id, new TableIndex(rowIdx, colIdx)], SHAPE_ATTR_ID.cellContentImage, ref, origin))
            }
        })
    }

    tableModifyColWidth(page: Page, table: TableShape, idx: number, width: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.colWidths[idx];
            basicapi.tableModifyColWidth(page, table, idx, width);
            this.addOp(TableCmdModify.Make(page.id, table.id, idx, TableOpTarget.Col, TABLE_ATTR_ID.colWidth, width, origin));
        })
    }

    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.rowHeights[idx];
            basicapi.tableModifyRowHeight(page, table, idx, height);
            this.addOp(TableCmdModify.Make(page.id, table.id, idx, TableOpTarget.Row, TABLE_ATTR_ID.rowHeight, height, origin));
        })
    }

    tableInsertRow(page: Page, table: TableShape, idx: number, height: number, data: TableCell[]) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            basicapi.tableInsertRow(page, table, idx, height, data);
            const cells = data.map((cell) => exportTableCell(cell));
            this.addOp(TableCmdInsert.Make(page.id, table.id, idx, TableOpTarget.Row, cells, height));
        })
    }

    tableRemoveRow(page: Page, table: TableShape, idx: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.rowHeights[idx];
            const del = basicapi.tableRemoveRow(page, table, idx);
            const cells = del.map((cell) => cell && ((cell.cellType ?? TableCellType.None) !== TableCellType.None) && exportTableCell(cell));
            this.addOp(TableCmdRemove.Make(page.id, table.id, idx, TableOpTarget.Row, cells, origin));
        })
    }

    tableInsertCol(page: Page, table: TableShape, idx: number, width: number, data: TableCell[]) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            basicapi.tableInsertCol(page, table, idx, width, data);
            const cells = data.map((cell) => exportTableCell(cell));
            this.addOp(TableCmdInsert.Make(page.id, table.id, idx, TableOpTarget.Col, cells, width));
        })
    }

    tableRemoveCol(page: Page, table: TableShape, idx: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.colWidths[idx];
            const del = basicapi.tableRemoveCol(page, table, idx);
            const cells = del.map((cell) => cell && ((cell.cellType ?? TableCellType.None) !== TableCellType.None) && exportTableCell(cell));
            this.addOp(TableCmdRemove.Make(page.id, table.id, idx, TableOpTarget.Col, cells, origin));
        })
    }

    tableModifyCellSpan(page: Page, table: TableShape, rowIdx: number, colIdx: number, rowSpan: number, colSpan: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const cell = table.getCellAt(rowIdx, colIdx, true)!;
            const origin = { rowSpan: cell?.rowSpan, colSpan: cell?.colSpan };
            if ((origin.rowSpan ?? 1) !== rowSpan || (origin.colSpan ?? 1) !== colSpan) {
                basicapi.tableModifyCellSpan(cell, rowSpan, colSpan);
                this.addOp(ShapeCmdModify.Make(page.id, [table.id, new TableIndex(rowIdx, colIdx)], SHAPE_ATTR_ID.cellSpan, { rowSpan, colSpan }, origin))
            }
        })
    }

    // text
    tableModifyTextColor(page: Page, table: TableShape, color: Color | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.color ? exportColor(table.textAttr?.color) : undefined;
            basicapi.tableModifyTextColor(table, color);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextColor, color ? exportColor(color) : undefined, origin));
        })
    }
    tableModifyTextHighlightColor(page: Page, table: TableShape, color: Color | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.highlight ? exportColor(table.textAttr?.highlight) : undefined;
            basicapi.tableModifyTextHighlightColor(table, color);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextHighlight, color ? exportColor(color) : undefined, origin));
        })
    }
    tableModifyTextFontName(page: Page, table: TableShape, fontName: string) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.fontName;
            basicapi.tableModifyTextFontName(table, fontName);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextFontName, fontName, origin));
        })
    }
    tableModifyTextFontSize(page: Page, table: TableShape, fontSize: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.fontSize;
            basicapi.tableModifyTextFontSize(table, fontSize);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextFontSize, fontSize, origin));
        })
    }
    tableModifyTextVerAlign(page: Page, table: TableShape, verAlign: TextVerAlign) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.verAlign;
            basicapi.tableModifyTextVerAlign(table, verAlign);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextVerAlign, verAlign, origin));
        })
    }
    tableModifyTextHorAlign(page: Page, table: TableShape, horAlign: TextHorAlign) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.alignment;
            basicapi.tableModifyTextHorAlign(table, horAlign);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextHorAlign, horAlign, origin));
        })
    }
    tableModifyTextMinLineHeight(page: Page, table: TableShape, lineHeight: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.minimumLineHeight;
            basicapi.tableModifyTextMinLineHeight(table, lineHeight);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextMinLineHeight, lineHeight, origin));
        })
    }
    tableModifyTextMaxLineHeight(page: Page, table: TableShape, lineHeight: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.maximumLineHeight;
            basicapi.tableModifyTextMaxLineHeight(table, lineHeight);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextMaxLineHeight, lineHeight, origin));
        })
    }
    tableModifyTextKerning(page: Page, table: TableShape, kerning: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.kerning;
            basicapi.tableModifyTextKerning(table, kerning);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextKerning, kerning, origin));
        })
    }
    tableModifyTextParaSpacing(page: Page, table: TableShape, paraSpacing: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.paraSpacing;
            basicapi.tableModifyTextParaSpacing(table, paraSpacing);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextParaSpacing, paraSpacing, origin));
        })
    }
    tableModifyTextUnderline(page: Page, table: TableShape, underline: UnderlineType | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.underline;
            basicapi.tableModifyTextUnderline(table, underline);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextUnderline, underline, origin));
        })
    }
    tableModifyTextStrikethrough(page: Page, table: TableShape, strikethrough: StrikethroughType | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.strikethrough;
            basicapi.tableModifyTextStrikethrough(table, strikethrough);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextStrikethrough, strikethrough, origin));
        })
    }
    tableModifyTextBold(page: Page, table: TableShape, bold: boolean) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.bold;
            basicapi.tableModifyTextBold(table, bold);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextBold, bold, origin));
        })
    }
    tableModifyTextItalic(page: Page, table: TableShape, italic: boolean) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.italic;
            basicapi.tableModifyTextItalic(table, italic);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextItalic, italic, origin));
        })
    }
    tableModifyTextTransform(page: Page, table: TableShape, transform: TextTransformType | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.transform;
            basicapi.tableModifyTextTransform(table, transform);
            this.addOp(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextTransform, transform, origin));
        })
    }
}