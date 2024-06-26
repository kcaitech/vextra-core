
import * as basicapi from "../basicapi"
import { Page } from "../../data/page";
import { Document } from "../../data/document";
import {
    GroupShape,
    Shape,
    PathShape,
    PathShape2,
    TextShape,
    Variable,
    SymbolShape,
    CurveMode, PathSegment,
    PolygonShape,
    StarShape, ShapeType
} from "../../data/shape";
import { updateShapesFrame } from "./utils";
import { Blur, Border, BorderPosition, BorderStyle, Fill, Gradient, MarkerType, Shadow } from "../../data/style";
import { BulletNumbers, SpanAttr, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "../../data/text";
import {
    RectShape,
    SymbolRefShape,
    TableCell,
    TableCellType,
    TableShape,
    Artboard, Guide
} from "../../data/classes";
import {
    BoolOp,
    BulletNumbersBehavior,
    BulletNumbersType,
    ExportFileFormat,
    OverrideType,
    Point2D,
    StrikethroughType,
    TextTransformType,
    UnderlineType,
    ShadowPosition,
    ExportFormatNameingScheme,
    FillType,
    BlendMode,
    CornerType,
    BorderSideSetting,
    BlurType,
    Transform,
} from "../../data/typesdefine";
import { _travelTextPara } from "../../data/texttravel";
import { uuid } from "../../basic/uuid";
import { ContactForm, ContactRole, ContextSettings, CurvePoint, ExportFormat, ExportOptions } from "../../data/baseclasses";
import { ContactShape } from "../../data/contact"
import { Color } from "../../data/classes";
import { Op, OpType } from "../../coop/common/op";
import { LocalCmd as Cmd, CmdMergeType, ISave4Restore, LocalCmd, SelectionState } from "./localcmd";
import { IdOpRecord } from "../../coop/client/crdt";
import { Repository } from "../../data/transact";
import { SNumber } from "../../coop/client/snumber";
import { ShapeView, TableCellView, TextShapeView } from "../../dataview";
import { BasicArray } from "../../data";
import { TransformRaw } from "../../index";
import { FMT_VER_latest } from "../../data/fmtver";

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
    private repo: Repository;
    constructor(repo: Repository) {
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

export class Api {
    private constructor() { // 仅能从createApi创建
    }
    static create(repo: Repository): Api {
        return new Proxy<Api>(new Api(), new TrapHdl(repo));
    }

    private cmd: Cmd | undefined;
    private needUpdateFrame: { shape: Shape, page: Page }[] = [];

    start(saveselection: SelectionState | undefined,
        selectionupdater: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void,
        description: string = "") {
        // todo 添加selection op
        this.cmd = {
            id: "",
            // mergeable: true,
            mergetype: CmdMergeType.None,
            delay: 500,
            version: SNumber.MAX_SAFE_INTEGER,
            previousVersion: "",
            baseVer: "",
            batchId: "",
            ops: [],
            isRecovery: false,
            description,
            time: 0,
            posttime: 0,
            saveselection,
            selectionupdater,
            dataFmtVer: FMT_VER_latest,
        };
        this.needUpdateFrame.length = 0;
    }
    updateTextSelectionPath(crdtpath: string[]) {
        if (this.cmd?.saveselection?.text) this.cmd.saveselection.text.path = crdtpath;
    }
    updateTextSelectionRange(start: number, length: number) {
        if (this.cmd?.saveselection?.text) {
            const selection = this.cmd.saveselection.text;
            selection.start = start;
            selection.length = length;
        }
    }
    isNeedCommit(): boolean {
        return this.cmd !== undefined && this.cmd.ops.length > 0;
    }
    rollback() {
        this.cmd = undefined;
        this.needUpdateFrame.length = 0;
    }
    commit(mergetype: CmdMergeType = CmdMergeType.None): Cmd | undefined {
        const cmd = this.cmd;
        if (!cmd || cmd.ops.length === 0) return undefined;
        cmd.id = uuid();
        cmd.time = Date.now();
        cmd.mergetype = mergetype;
        if (this.needUpdateFrame.length > 0) {
            // todo 不同page
            const update = this.needUpdateFrame.slice(0);
            const page = update[0].page;
            const shapes = update.map((v) => v.shape);
            updateShapesFrame(page, shapes, this);
        }
        this.needUpdateFrame.length = 0;
        this.cmd = undefined;
        // merge op
        if (cmd.ops.length > 1) {
            // merge idset
            // shapemove？
            // arraymove？
            // text?
            // todo 这里是否也要保持原来的顺序？
            const ops = [];
            const idsetops = new Map<string, Op>();
            for (let i = 0; i < cmd.ops.length; i++) {
                const op = cmd.ops[i];
                if (op.type === OpType.Idset) {
                    const path = op.path.join(','); // 是否要包含id？path包含id
                    const pre = idsetops.get(path) as IdOpRecord;
                    if (pre) {
                        pre.data = (op as IdOpRecord).data;
                    } else {
                        idsetops.set(path, op);
                    }
                } else {
                    ops.push(op);
                }
            }
            if (idsetops.size > 0) for (let [_, v] of idsetops) {
                const op = v as IdOpRecord;
                if (op.data !== op.origin) ops.push(v);
            }
            if (ops.length < cmd.ops.length) {
                // has merge
                cmd.ops = ops;
            }
            if (cmd.ops.length === 0) return undefined;
        }
        if (cmd.saveselection?.text) { // 文本选区需要加入到op参与变换
            cmd.ops.unshift(cmd.saveselection.text);
        }
        return cmd;
    }

    private addOp(op: Op[] | Op | undefined) {
        if (!this.cmd) throw new Error("need start first");
        if (Array.isArray(op)) this.cmd.ops.push(...op);
        else if (op) this.cmd.ops.push(op);
        else return false;
        return true;
    }

    pageInsert(document: Document, page: Page, index: number) {
        this.addOp(basicapi.pageInsert(document, page, index));
    }
    pageDelete(document: Document, index: number) {
        this.addOp(basicapi.pageDelete(document, index));
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
        this.addOp(basicapi.pageMove(document, fromIdx, toIdx));
    }
    insertGuideToPage(page: Page, guide: Guide) {
        if (!page.guides) {
            page.guides = new BasicArray<Guide>();
        }
        this.addOp(basicapi.crdtArrayInsert(page.guides, page.guides.length, guide));
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
        this.addOp(basicapi.crdtArrayRemove(page.guides, index));
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
        this.addOp(basicapi.crdtArrayInsert(guides, guides.length, guide));
        return guides.length - 1;
    }
    deleteGuide(shape: Shape, index: number) {
        if (!shape.isContainer) {
            return;
        }
        let guides = (shape as Artboard).guides;
        const guide = guides?.[index];
        if (!guide) {
            return;
        }
        this.addOp(basicapi.crdtArrayRemove(guides, index));
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
        this.addOp(basicapi.crdtSetAttr(guide, 'offset', offset));
    }
    // registSymbol(document: Document, symbolId: string, pageId: string) {
    //     this.addOp(basicapi.registSymbol(document, symbolId, pageId));
    // }
    shapeInsert(document: Document, page: Page, parent: GroupShape, shape: Shape, index: number) {
        this.addOp(basicapi.shapeInsert(document, page, parent, shape, index, this.needUpdateFrame));
        return page.getShape(shape.id) as Shape;
    }
    shapeDelete(document: Document, page: Page, parent: GroupShape, index: number) {
        this.addOp(basicapi.shapeDelete(document, page, parent, index, this.needUpdateFrame));
    }
    shapeMove(page: Page, fromParent: GroupShape, fromIdx: number, toParent: GroupShape, toIdx: number) {
        this.addOp(basicapi.shapeMove(page, fromParent, fromIdx, toParent, toIdx, this.needUpdateFrame));
    }
    shapeModifyX(page: Page, shape: Shape, x: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyX(page, shape, x, this.needUpdateFrame));
    }
    shapeModifyY(page: Page, shape: Shape, y: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyY(page, shape, y, this.needUpdateFrame));
    }
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number) {
        this.shapeModifyWidth(page, shape, w);
        this.shapeModifyHeight(page, shape, h);
    }
    shapeModifyWidth(page: Page, shape: Shape, w: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyWidth(page, shape, w, this.needUpdateFrame));
    }
    shapeModifyHeight(page: Page, shape: Shape, h: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyHeight(page, shape, h, this.needUpdateFrame));
    }
    shapeModifyCounts(page: Page, shape: (PolygonShape | StarShape), counts: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyCounts(shape, counts));
    }
    shapeModifyInnerAngle(page: Page, shape: StarShape, offset: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyInnerAngle(shape, offset));
    }
    shapeModifyStartMarkerType(page: Page, shape: Shape, mt: MarkerType) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyStartMarkerType(shape, mt));
    }
    shapeModifyEndMarkerType(page: Page, shape: Shape, mt: MarkerType) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyEndMarkerType(shape, mt));
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
    shapeModifyRotate(page: Page, shape: Shape, rotate: TransformRaw) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyRotate(page, shape, rotate, this.needUpdateFrame));
    }
    shapeModifyConstrainerProportions(page: Page, shape: Shape, prop: boolean) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyConstrainerProportions(shape, prop));
    }
    shapeModifyName(page: Page, shape: Shape, name: string) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, "name", name));
    }
    shapeModifyNameFixed(page: Page, shape: Shape, isFixed: boolean) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyNameFixed(shape, isFixed));
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
        this.addOp(basicapi.shapeAddVariable(page, shape, _var));
    }
    shapeRemoveVariable(page: Page, shape: SymbolShape | SymbolRefShape, key: string) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeRemoveVariable(page, shape, key));
    }
    shapeRemoveOverride(page: Page, shape: SymbolRefShape, key: string) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeRemoveOverride(shape, key));
    }
    shapeBindVar(page: Page, shape: Shape, type: OverrideType, varId: string) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeBindVar(page, shape, type, varId));
    }
    shapeUnbinVar(page: Page, shape: Shape, type: OverrideType) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeUnbindVar(shape, type));
    }

    shapeAddOverride(page: Page, shape: SymbolRefShape, refId: string, value: string) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeAddOverride(page, shape, refId, value));
    }

    private _shapeModifyAttr(page: Page, shape: Shape, attr: string, val: any) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.crdtSetAttr(shape, attr, val));
    }
    /**
     * @description 初始化或修改组件的状态属性
     */
    shapeModifyVartag(page: Page, shape: SymbolShape, varId: string, tag: string) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyVartag(page, shape, varId, tag));
    }
    shapeModifyVisible(page: Page, shape: Shape, isVisible: boolean) {
        this._shapeModifyAttr(page, shape, "isVisible", isVisible);
    }
    shapeModifySymRef(page: Page, shape: SymbolRefShape, refId: string) {
        this._shapeModifyAttr(page, shape, "refId", refId);
    }
    shapeModifyLock(page: Page, shape: Shape, isLocked: boolean) {
        this._shapeModifyAttr(page, shape, "isLocked", isLocked);
    }
    shapeModifyHFlip(page: Page, shape: Shape) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyHFlip(page, shape, this.needUpdateFrame));
    }
    shapeModifyVFlip(page: Page, shape: Shape,) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyVFlip(page, shape, this.needUpdateFrame));
    }
    shapeModifyByTransform(page: Page, shape: Shape, transform: Transform) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyByTransform(page, shape, transform));
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
        this.addOp(basicapi.crdtSetAttr(contextSettings, 'opacity', contextSettingsOpacity));
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
        this.addOp(basicapi.crdtSetAttr(contextSettings, 'blenMode', blendMode));
    }
    shapeModifyResizingConstraint(page: Page, shape: Shape, resizingConstraint: number) {
        this._shapeModifyAttr(page, shape, "resizingConstraint", resizingConstraint);
    }
    shapeModifyRadius(page: Page, shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyRadius(shape, lt, rt, rb, lb));
    }
    shapeModifyRadius2(page: Page, shape: Artboard | SymbolShape | Variable, lt: number, rt: number, rb: number, lb: number) {
        checkShapeAtPage(page, shape);
        const cornerRadius = shape instanceof Variable ? shape.value : shape.cornerRadius;
        this.addOp(basicapi.shapeModifyRadius2(shape, cornerRadius, lt, rt, rb, lb));
    }
    shapeModifyFixedRadius(page: Page, shape: GroupShape | PathShape | PathShape2 | TextShape, fixedRadius: number | undefined) {
        this._shapeModifyAttr(page, shape, "fixedRadius", fixedRadius);
    }
    shapeModifyCurvPoint(page: Page, shape: Shape, index: number, point: Point2D, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyCurvPoint(shape, index, point, segmentIndex));
    }
    shapeModifyCurvFromPoint(page: Page, shape: Shape, index: number, point: Point2D, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyCurvFromPoint(shape, index, point, segmentIndex));
    }
    shapeModifyCurvToPoint(page: Page, shape: Shape, index: number, point: Point2D, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyCurvToPoint(shape, index, point, segmentIndex));
    }
    shapeModifyBoolOp(page: Page, shape: Shape, op: BoolOp | undefined) {
        this._shapeModifyAttr(page, shape, "boolOp", op);
    }
    shapeModifyIsCustomSize(page: Page, shape: SymbolRefShape, isCustomSize: boolean) {
        // if (!(shape instanceof SymbolRefShape)) return;
        this._shapeModifyAttr(page, shape, "isCustomSize", isCustomSize ? true : undefined);
    }

    // 添加一次fill
    addFillAt(page: Page, shape: Shape | Variable, fill: Fill, index: number) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        this.addOp(basicapi.addFillAt(fills, fill, index));
    }
    // 添加多次fill
    addFills(page: Page, shape: Shape | Variable, fills: Fill[]) {
        checkShapeAtPage(page, shape);
        const fillsOld = shape instanceof Shape ? shape.style.fills : shape.value;
        for (let i = 0; i < fills.length; i++) {
            const fill = fills[i];
            this.addOp(basicapi.addFillAt(fillsOld, fill, i));
        }
    }
    // 添加一条border
    addBorderAt(page: Page, shape: Shape | Variable, border: Border, index: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this.addOp(basicapi.addBorderAt(borders, border, index));
    }
    // 添加多条border
    addBorders(page: Page, shape: Shape | Variable, borders: Border[]) {
        checkShapeAtPage(page, shape);
        const bordersOld = shape instanceof Shape ? shape.style.borders : shape.value;
        for (let i = 0; i < borders.length; i++) {
            const border = borders[i];
            this.addOp(basicapi.addBorderAt(bordersOld, border, i));
        }
    }
    // 删除一次fill
    deleteFillAt(page: Page, shape: Shape | Variable, index: number) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        this.addOp(basicapi.deleteBorderAt(fills, index));
    }
    // 批量删除fill
    deleteFills(page: Page, shape: Shape | Variable, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        const fillsOld = shape instanceof Shape ? shape.style.fills : shape.value;
        this.addOp(basicapi.deleteFills(fillsOld, index, strength));
    }
    // 删除一次border
    deleteBorderAt(page: Page, shape: Shape | Variable, index: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this.addOp(basicapi.deleteBorderAt(borders, index));
    }
    // 批量删除border
    deleteBorders(page: Page, shape: Shape | Variable, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        const bordersOld = shape instanceof Shape ? shape.style.borders : shape.value;
        this.addOp(basicapi.deleteBorders(bordersOld, index, strength));
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
    setFillType(page: Page, shape: Shape | Variable, idx: number, fillType: FillType) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        const fill: Fill = fills[idx];
        if (!fill) return;
        this.addOp(basicapi.crdtSetAttr(fill, "fillType", fillType));
    }
    setBorderFillType(page: Page, shape: Shape | Variable, idx: number, fillType: FillType) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        const border: Fill = borders[idx];
        if (!border) return;
        this.addOp(basicapi.crdtSetAttr(border, "fillType", fillType));
    }
    setFillGradient(page: Page, shape: Shape | Variable, idx: number, gradient: Gradient) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        const fill: Fill = fills[idx];
        if (!fill) return;
        this.addOp(basicapi.crdtSetAttr(fill, "gradient", gradient));
    }
    setBorderGradient(page: Page, shape: Shape | Variable, idx: number, gradient: Gradient) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        const border = borders[idx];
        if (!border) return;
        this.addOp(basicapi.crdtSetAttr(border, "gradient", gradient));
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
        this.addOp(basicapi.moveFill(fills, idx, idx2));
    }
    moveBorder(page: Page, shape: Shape | Variable, idx: number, idx2: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this.addOp(basicapi.moveBorder(borders, idx, idx2));
    }
    setBorderCornerType(page: Page, shape: Shape | Variable, idx: number, cornerType: CornerType) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.addOp(basicapi.crdtSetAttr(borders[idx], "cornerType", cornerType));
    }
    setBorderSide(pege: Page, shape: Shape | Variable, idx: number, sideSetting: BorderSideSetting) {
        checkShapeAtPage(pege, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.addOp(basicapi.crdtSetAttr(borders[idx], "sideSetting", sideSetting))
    }
    setBorderThicknessTop(page: Page, shape: Shape | Variable, idx: number, thickness: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this.addOp(basicapi.crdtSetAttr(borders[idx].sideSetting, "thicknessTop", thickness))
    }
    setBorderThicknessLeft(page: Page, shape: Shape | Variable, idx: number, thickness: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this.addOp(basicapi.crdtSetAttr(borders[idx].sideSetting, "thicknessLeft", thickness));
    }
    setBorderThicknessBottom(page: Page, shape: Shape | Variable, idx: number, thickness: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this.addOp(basicapi.crdtSetAttr(borders[idx].sideSetting, "thicknessBottom", thickness));
    }
    setBorderThicknessRight(page: Page, shape: Shape | Variable, idx: number, thickness: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        this.addOp(basicapi.crdtSetAttr(borders[idx].sideSetting, "thicknessRight", thickness));
    }
    // points
    addPointAt(page: Page, shape: Shape, idx: number, point: CurvePoint, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.addPointAt(shape, point, idx, segmentIndex));
    }
    addSegmentAt(page: Page, shape: Shape, idx: number, segment: PathSegment) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.addSegmentAt(shape, segment, idx));
    }
    deletePoints(page: Page, shape: PathShape, index: number, strength: number, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.deletePoints(shape, index, strength, segmentIndex));
    }
    deletePoint(page: Page, shape: Shape, index: number, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.deletePointAt(shape, index, segmentIndex));
    }
    addPoints(page: Page, shape: PathShape, points: CurvePoint[], segmentIndex: number) {
        checkShapeAtPage(page, shape);
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            this.addOp(basicapi.addPointAt(shape, point, i, segmentIndex));
        }
    }
    shapeEditPoints(page: Page, shape: Shape, haveEdit: boolean) {
        this._shapeModifyAttr(page, shape, "haveEdit", haveEdit);
    }

    modifyPointCurveMode(page: Page, shape: Shape, index: number, curveMode: CurveMode, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyCurveMode(shape, index, curveMode, segmentIndex))
    }
    modifyPointHasFrom(page: Page, shape: Shape, index: number, hasFrom: boolean, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyHasFrom(shape, index, hasFrom, segmentIndex));
    }
    modifyPointHasTo(page: Page, shape: Shape, index: number, hasTo: boolean, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyHasTo(shape, index, hasTo, segmentIndex));
    }
    modifyPointCornerRadius(page: Page, shape: Shape, index: number, cornerRadius: number, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyPointCornerRadius(shape, index, cornerRadius, segmentIndex));
    }
    setCloseStatus(page: Page, shape: Shape, isClosed: boolean, segmentIndex: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyPathShapeClosedStatus(shape, isClosed, segmentIndex));
    }
    insertSegmentAt(page: Page, shape: PathShape, index: number, segment: PathSegment) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.insertSegmentAt(shape, index, segment));
    }
    deleteSegmentAt(page: Page, shape: PathShape, segment: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.deleteSegmentAt(shape, segment));
    }
    // contacts
    addContactAt(page: Page, shape: Shape, contactRole: ContactRole, idx: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.addContactShape(shape.style, contactRole));
    }
    removeContactRoleAt(page: Page, shape: Shape, index: number) {
        checkShapeAtPage(page, shape);
        if (!shape.style.contacts || !shape.style.contacts[index]) return;
        this.addOp(basicapi.removeContactRoleAt(shape.style, index));
    }
    // shadow
    addShadows(page: Page, shape: Shape, shadows: Shadow[]) {
        checkShapeAtPage(page, shape);
        for (let i = 0; i < shadows.length; i++) {
            const shadow = shadows[i];
            this.addOp(basicapi.addShadow(shape.style.shadows, shadow, i));
        }
    }
    addShadow(page: Page, shape: Shape | Variable, shadow: Shadow, index: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.addShadow(shadows, shadow, index));
    }
    deleteShadows(page: Page, shape: Shape | Variable, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.deleteShadows(shadows, index, strength));
    }
    deleteShadowAt(page: Page, shape: Shape | Variable, idx: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.deleteShadowAt(shadows, idx));
    }
    setShadowEnable(page: Page, shape: Shape | Variable, idx: number, isEnable: boolean) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.setShadowEnable(shadows, idx, isEnable));
    }
    setShadowOffsetX(page: Page, shape: Shape | Variable, idx: number, offsetX: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.setShadowOffsetX(shadows, idx, offsetX));
    }
    setShadowOffsetY(page: Page, shape: Shape | Variable, idx: number, offsetY: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.setShadowOffsetY(shadows, idx, offsetY));
    }
    setShadowBlur(page: Page, shape: Shape | Variable, idx: number, blur: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.setShadowBlur(shadows, idx, blur));
    }
    setShadowSpread(page: Page, shape: Shape | Variable, idx: number, spread: number) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.setShadowSpread(shadows, idx, spread));
    }
    setShadowColor(page: Page, shape: Shape | Variable, idx: number, color: Color) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.setShadowColor(shadows, idx, color));
    }
    setShadowPosition(page: Page, shape: Shape | Variable, idx: number, position: ShadowPosition) {
        checkShapeAtPage(page, shape);
        const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
        this.addOp(basicapi.setShadowPosition(shadows, idx, position));
    }
    //blur
    shapeModifyBlur(page: Page, shape: Shape | Variable, blendMode: BlendMode) {
        checkShapeAtPage(page, shape);
        let contextSettings;
        if (shape instanceof Shape) {
            if (!shape.style.contextSettings) shape.style.contextSettings = new ContextSettings(BlendMode.Normal, 1);
            contextSettings = shape.style.contextSettings;
        } else {
            contextSettings = shape.value;
        }
        this.addOp(basicapi.crdtSetAttr(contextSettings, 'blenMode', blendMode));
    }
    addBlur(page: Page, shape: Shape | Variable, blur: Blur) {
        checkShapeAtPage(page, shape);
        const style = shape instanceof Shape ? shape.style : shape.value;
        this.addOp(basicapi.crdtSetAttr(style, 'blur', blur));
    }

    deleteBlur(page: Page, shape: Shape | Variable) {
        checkShapeAtPage(page, shape);
        const style = shape instanceof Shape ? shape.style : shape.value;
        this.addOp(basicapi.crdtSetAttr(style, 'blur', undefined));
    }

    shapeModifyBlurSaturation(page: Page, shape: Shape | Variable, saturation: number) {
        checkShapeAtPage(page, shape);
        const blur = shape instanceof Shape ? shape.style.blur : shape.value;
        this.addOp(basicapi.crdtSetAttr(blur, 'saturation', saturation));
    }

    shapeModifyBlurType(page: Page, shape: Shape | Variable, type: BlurType) {
        checkShapeAtPage(page, shape);
        const blur = shape instanceof Shape ? shape.style.blur : shape.value;
        this.addOp(basicapi.crdtSetAttr(blur, 'type', type));
    }

    shapeModifyBlurMotionAngle(page: Page, shape: Shape | Variable, motionAngle: number) {
        checkShapeAtPage(page, shape);
        const blur = shape instanceof Shape ? shape.style.blur : shape.value;
        this.addOp(basicapi.crdtSetAttr(blur, 'motionAngle', motionAngle));
    }

    shapeModifyBlurRadius(page: Page, shape: Shape | Variable, radius: number) {
        checkShapeAtPage(page, shape);
        const blur = shape instanceof Shape ? shape.style.blur : shape.value;
        this.addOp(basicapi.crdtSetAttr(blur, 'radius', radius));
    }

    shapeModifyBlurEdabled(page: Page, shape: Shape | Variable, isEnabled: boolean) {
        checkShapeAtPage(page, shape);
        const blur = shape instanceof Shape ? shape.style.blur : shape.value;
        this.addOp(basicapi.crdtSetAttr(blur, 'isEnabled', isEnabled));
    }

    // cutout
    deleteExportFormatAt(page: Page, shape: Shape | Variable, idx: number) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this.addOp(basicapi.deleteExportFormatAt(options, idx));
    }
    deletePageExportFormatAt(page: Page, idx: number) {
        if (!page.exportOptions) return;
        this.addOp(basicapi.deletePageExportFormatAt(page.exportOptions, idx));
    }
    deleteExportFormats(page: Page, shape: Shape, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this.addOp(basicapi.deleteExportFormats(shape.exportOptions, index, strength));
    }
    addExportFormats(page: Page, shape: Shape, formats: ExportFormat[]) {
        checkShapeAtPage(page, shape);
        for (let i = 0; i < formats.length; i++) {
            const format = formats[i];
            this.addOp(basicapi.addExportFormat(shape, format, i));
        }
    }
    addExportFormat(page: Page, shape: Shape | Variable, format: ExportFormat, index: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.addExportFormat(shape, format, index));
    }
    addPageExportFormat(page: Page, format: ExportFormat, index: number) {
        this.addOp(basicapi.addPageExportFormat(page, format, index));
    }
    setExportFormatScale(page: Page, shape: Shape | Variable, idx: number, scale: number) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this.addOp(basicapi.setExportFormatScale(options, idx, scale));
    }
    setPageExportFormatScale(page: Page, idx: number, scale: number) {
        if (!page.exportOptions) return;
        this.addOp(basicapi.setPageExportFormatScale(page.exportOptions, idx, scale));
    }
    setExportFormatName(page: Page, shape: Shape | Variable, idx: number, name: string) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this.addOp(basicapi.setExportFormatName(options, idx, name));
    }
    setPageExportFormatName(page: Page, idx: number, name: string) {
        if (!page.exportOptions) return;
        this.addOp(basicapi.setPageExportFormatName(page.exportOptions, idx, name));
    }
    setExportFormatFileFormat(page: Page, shape: Shape | Variable, idx: number, fileFormat: ExportFileFormat) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this.addOp(basicapi.setExportFormatFileFormat(options, idx, fileFormat));
    }
    setPageExportFormatFileFormat(page: Page, idx: number, fileFormat: ExportFileFormat) {
        if (!page.exportOptions) return;
        this.addOp(basicapi.setPageExportFormatFileFormat(page.exportOptions, idx, fileFormat));
    }
    setExportFormatPerfix(page: Page, shape: Shape | Variable, idx: number, perfix: ExportFormatNameingScheme) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this.addOp(basicapi.setExportFormatPerfix(options, idx, perfix));
    }
    setPageExportFormatPerfix(page: Page, idx: number, perfix: ExportFormatNameingScheme) {
        if (!page.exportOptions) return;
        this.addOp(basicapi.setPageExportFormatPerfix(page.exportOptions, idx, perfix));
    }
    setExportTrimTransparent(page: Page, shape: Shape | Variable, trim: boolean) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this.addOp(basicapi.setExportTrimTransparent(options, trim));
    }
    setExportCanvasBackground(page: Page, shape: Shape | Variable, background: boolean) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this.addOp(basicapi.setExportCanvasBackground(options, background));
    }
    setExportPreviewUnfold(page: Page, shape: Shape | Variable, unfold: boolean) {
        checkShapeAtPage(page, shape);
        const options = shape instanceof Shape ? shape.exportOptions : shape.value as ExportOptions;
        if (!options) return;
        this.addOp(basicapi.setExportPreviewUnfold(options, unfold));
    }
    setPageExportPreviewUnfold(document: Document, pageId: string, unfold: boolean) {
        const item = document.pagesMgr.getSync(pageId);
        if (!item) return;
        if (!item.exportOptions) return;
        this.addOp(basicapi.setPageExportPreviewUnfold(item.exportOptions, unfold));
    }

    // text
    insertSimpleText(page: Page, shape: TextShapeLike | Variable, idx: number, text: string, attr?: SpanAttr) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.insertSimpleText(shape, _text, text, idx, { attr }));
    }
    insertComplexText(page: Page, shape: TextShapeLike | Variable, idx: number, text: Text) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.insertComplexText(shape, _text, text, idx));
    }
    insertSimpleText2(page: Page, shape: TextShape, idx: number, text: string, attr?: SpanAttr) {
        checkShapeAtPage(page, shape);
        const _text = shape.text;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.insertSimpleText(shape, _text, text, idx, { attr }));
    }
    insertComplexText2(page: Page, shape: TextShape, idx: number, text: Text) {
        checkShapeAtPage(page, shape);
        const _text = shape.text;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.insertComplexText(shape, _text, text, idx));
    }
    deleteText(page: Page, shape: TextShapeLike | Variable, idx: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.deleteText(shape, _text, idx, len));
    }
    deleteText2(page: Page, shape: TextShape, idx: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape.text;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.deleteText(shape, _text, idx, len));
    }
    textModifyColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyColor(shape, _text, idx, len, color));
    }
    textModifyFontName(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontname: string) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyFontName(shape, _text, idx, len, fontname));
    }
    textModifyFontSize(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontsize: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyFontSize(shape, _text, idx, len, fontsize));
    }

    shapeModifyTextBehaviour(page: Page, _text: Text, textBehaviour: TextBehaviour) {
        checkShapeAtPage(page, _text.parent as Shape);
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.shapeModifyTextBehaviour(page, _text, textBehaviour));
    }
    shapeModifyTextVerAlign(page: Page, shape: TextShapeLike | Variable, verAlign: TextVerAlign) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.shapeModifyTextVerAlign(_text, verAlign));
    }

    textModifyHighlightColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyHighlightColor(shape, _text, idx, len, color));
    }
    textModifyUnderline(page: Page, shape: TextShapeLike | Variable, underline: UnderlineType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyUnderline(shape, _text, underline, index, len));
    }
    textModifyStrikethrough(page: Page, shape: TextShapeLike | Variable, strikethrough: StrikethroughType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyStrikethrough(shape, _text, strikethrough, index, len));
    }
    textModifyWeight(page: Page, shape: TextShapeLike | Variable, weight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyWeight(shape, _text, weight, index, len));
    }
    textModifyItalic(page: Page, shape: TextShapeLike | Variable, italic: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyItalic(shape, _text, italic, index, len));
    }
    textModifyFillType(page: Page, shape: TextShapeLike | Variable, fillType: FillType, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyFillType(shape, _text, index, len, fillType));
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
            this.addOp(basicapi.deleteText(shape, _text, removeIndexs[i] - i, 1));
        }
        if (removeIndexs.length > 0) _text.reLayout(); // todo
    }

    private _textModifySetBulletNumbers(page: Page, shape: TextShapeLike | Variable, type: BulletNumbersType, index: number, len: number) {

        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyBulletNumbersType(shape, _text, type, index, len))

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
            this.addOp(basicapi.insertSimpleText(shape, _text, '*', insertIndexs[i] + i, { attr }))
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
        this.addOp(basicapi.textModifyBulletNumbersStart(shape, _text, start, index, len))
    }
    textModifyBulletNumbersInherit(page: Page, shape: TextShapeLike | Variable, inherit: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const behavior = inherit ? BulletNumbersBehavior.Inherit : BulletNumbersBehavior.Renew;
        this.addOp(basicapi.textModifyBulletNumbersBehavior(shape, _text, behavior, index, len))
    }

    textModifyHorAlign(page: Page, shape: TextShapeLike | Variable, horAlign: TextHorAlign, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        // fix index
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this.addOp(basicapi.textModifyHorAlign(shape, _text, horAlign, index, len));
    }

    textModifyParaIndent(page: Page, shape: TextShapeLike | Variable, indent: number | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyParaIndent(shape, _text, indent, index, len));
    }
    textModifyMinLineHeight(page: Page, shape: TextShapeLike | Variable, minLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this.addOp(basicapi.textModifyMinLineHeight(shape, _text, minLineheight, index, len));
    }
    textModifyMaxLineHeight(page: Page, shape: TextShapeLike | Variable, maxLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this.addOp(basicapi.textModifyMaxLineHeight(shape, _text, maxLineheight, index, len));
    }
    textModifyKerning(page: Page, shape: TextShapeLike | Variable, kerning: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifySpanKerning(shape, _text, kerning, index, len));
    }
    textModifyParaSpacing(page: Page, shape: TextShapeLike | Variable, paraSpacing: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();

        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this.addOp(basicapi.textModifyParaSpacing(shape, _text, paraSpacing, index, len));
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
        this.addOp(basicapi.textModifySpanTransfrom(shape, _text, transform, index, len));
    }
    setTextGradient(page: Page, shape: TextShapeLike | Variable, gradient: Gradient | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof ShapeView ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyGradient(shape, _text, index, len, gradient));
    }

    // table
    tableInitCell(page: Page, table: TableShape, rowIdx: number, colIdx: number) {
        checkShapeAtPage(page, table);
        return this.addOp(basicapi.tableInitCell(table, rowIdx, colIdx));
    }

    tableSetCellContentType(page: Page, table: TableShape, cell: TableCellView, contentType: TableCellType | undefined) {
        checkShapeAtPage(page, table);
        // this.addOp(basicapi.tableInitCell(table, rowIdx, colIdx));
        // const cell = table.getCellAt(rowIdx, colIdx);
        this.addOp(basicapi.tableSetCellContentType(cell.data, contentType));
        if (contentType !== TableCellType.Text && cell.data.text) {
            const len = cell.data.text.length;
            if (len > 1) this.addOp(basicapi.deleteText(cell, cell.data.text, 0, len - 1));
        }
    }

    // tableSetCellContentText(page: Page, table: TableShape, cell: TableCell, text: Text | undefined) {
    //     checkShapeAtPage(page, table);
    //     // this.addOp(basicapi.tableInitCell(table, rowIdx, colIdx));
    //     // const cell = table.getCellAt(rowIdx, colIdx);
    //     this.addOp(basicapi.tableSetCellContentText(cell, text));
    // }

    tableSetCellContentImage(page: Page, table: TableShape, cell: TableCellView, ref: string | undefined) {
        checkShapeAtPage(page, table);
        // this.addOp(basicapi.tableInitCell(table, rowIdx, colIdx));
        // const cell = table.getCellAt(rowIdx, colIdx)!;
        const origin = cell.imageRef;
        if (origin !== ref) {
            this.addOp(basicapi.tableSetCellContentImage(cell.data, ref));
        }
    }

    tableModifyColWidth(page: Page, table: TableShape, idx: number, width: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyColWidth(page, table, idx, width));
    }

    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyRowHeight(page, table, idx, height));
    }

    tableInsertRow(page: Page, table: TableShape, idx: number, height: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableInsertRow(table, idx, height));
    }

    tableRemoveRow(page: Page, table: TableShape, idx: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableRemoveRow(table, idx));
        // todo 删除对应的单元格
    }

    tableInsertCol(page: Page, table: TableShape, idx: number, width: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableInsertCol(table, idx, width));
    }

    tableRemoveCol(page: Page, table: TableShape, idx: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableRemoveCol(table, idx));
        // todo 删除对应的单元格
    }

    tableModifyCellSpan(page: Page, table: TableShape, cell: TableCellView, rowSpan: number, colSpan: number) {
        checkShapeAtPage(page, table);
        // this.addOp(basicapi.tableInitCell(table, rowIdx, colIdx));
        // const cell = table.getCellAt(rowIdx, colIdx)!;
        const origin = { rowSpan: cell.rowSpan, colSpan: cell.colSpan };
        if ((origin.rowSpan ?? 1) !== rowSpan || (origin.colSpan ?? 1) !== colSpan) {
            this.addOp(basicapi.tableModifyCellSpan(cell.data, rowSpan, colSpan));
        }
    }

    // table text
    tableModifyTextColor(page: Page, table: TableShape, color: Color | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextColor(table, color));
    }
    tableModifyTextHighlightColor(page: Page, table: TableShape, color: Color | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextHighlightColor(table, color));
    }
    tableModifyTextFontName(page: Page, table: TableShape, fontName: string) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextFontName(table, fontName));
    }
    tableModifyTextFontSize(page: Page, table: TableShape, fontSize: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextFontSize(table, fontSize));
    }
    tableModifyTextVerAlign(page: Page, table: TableShape, verAlign: TextVerAlign) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextVerAlign(table, verAlign));
    }
    tableModifyTextHorAlign(page: Page, table: TableShape, horAlign: TextHorAlign) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextHorAlign(table, horAlign));
    }
    tableModifyTextMinLineHeight(page: Page, table: TableShape, lineHeight: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextMinLineHeight(table, lineHeight));
    }
    tableModifyTextMaxLineHeight(page: Page, table: TableShape, lineHeight: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextMaxLineHeight(table, lineHeight));
    }
    tableModifyTextKerning(page: Page, table: TableShape, kerning: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextKerning(table, kerning));
    }
    tableModifyTextParaSpacing(page: Page, table: TableShape, paraSpacing: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextParaSpacing(table, paraSpacing));
    }
    tableModifyTextUnderline(page: Page, table: TableShape, underline: UnderlineType | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextUnderline(table, underline));
    }
    tableModifyTextStrikethrough(page: Page, table: TableShape, strikethrough: StrikethroughType | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextStrikethrough(table, strikethrough));
    }
    tableModifyTextWeight(page: Page, table: TableShape, weight: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextWeight(table, weight));
    }
    tableModifyTextItalic(page: Page, table: TableShape, italic: boolean) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextItalic(table, italic));
    }
    tableModifyTextTransform(page: Page, table: TableShape, transform: TextTransformType | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextTransform(table, transform));
    }
    tableModifyTextFillType(page: Page, table: TableShape, fillType: FillType | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextFillType(table, fillType));
    }
    tableModifyTextGradient(page: Page, table: TableShape, gradient: Gradient | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextGradient(table, gradient));
    }
}