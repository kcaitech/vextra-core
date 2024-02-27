
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
    VariableType,
    CurveMode
} from "../../data/shape";
import { updateShapesFrame } from "./utils";
import { Border, BorderPosition, BorderStyle, Fill, MarkerType, Shadow } from "../../data/style";
import { BulletNumbers, SpanAttr, SpanAttrSetter, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "../../data/text";
import { RectShape, SymbolRefShape, TableCellType, TableShape } from "../../data/classes";
import {
    BoolOp, BulletNumbersBehavior, BulletNumbersType, ExportFileFormat, OverrideType, Point2D,
    StrikethroughType, TextTransformType, UnderlineType, ShadowPosition, ExportFormatNameingScheme
} from "../../data/typesdefine";
import { _travelTextPara } from "../../data/texttravel";
import { uuid } from "../../basic/uuid";
import { ContactForm, ContactRole, ContextSettings, CurvePoint, ExportFormat } from "../../data/baseclasses";
import { ContactShape } from "../../data/contact"
import { Color } from "../../data/classes";
import { Op, OpType } from "../../coop/common/op";
import { LocalCmd as Cmd, CmdMergeType, ISave4Restore, LocalCmd, SelectionState } from "./localcmd";
import { IdOpRecord } from "../../coop/client/crdt";
import { Repository } from "../../data/transact";
import { SNumber } from "../../coop/client/snumber";
import { ArrayOpSelection } from "../../coop/client/arrayop";

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
            selectionupdater
        };
        this.needUpdateFrame.length = 0;
    }
    updateTextSelection(op: ArrayOpSelection | undefined) {
        if (this.cmd?.saveselection) this.cmd.saveselection.text = op;
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
                    const path = op.path.join(',');
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
                ops.push(v);
            }
            if (ops.length < cmd.ops.length) {
                // has merge
                cmd.ops = ops;
            }
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
    registSymbol(document: Document, symbolId: string, pageId: string) {
        this.addOp(basicapi.registSymbol(document, symbolId, pageId));
    }
    shapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number) {
        this.addOp(basicapi.shapeInsert(page, parent, shape, index, this.needUpdateFrame));
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
    shapeModifyRotate(page: Page, shape: Shape, rotate: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyRotate(page, shape, rotate));
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
    shapeRemoveVirbindsEx(page: Page, shape: SymbolShape | SymbolRefShape, key: string, varId: string, type: VariableType) {
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

    shapeAddOverride(page: Page, shape: SymbolShape | SymbolRefShape, refId: string, attr: OverrideType, value: string) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeAddOverride(page, shape, refId, attr, value));
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

    shapeModifySymOvContextSettings(page: Page, shape: SymbolRefShape, val: true | undefined) {
        this._shapeModifyAttr(page, shape, "overrideContextSettings", val);
    }
    shapeModifySymOvBorderOptions(page: Page, shape: SymbolRefShape, val: true | undefined) {
        this._shapeModifyAttr(page, shape, "overrideBorderOptions", val);
    }
    shapeModifySymOvBorders(page: Page, shape: SymbolRefShape, val: true | undefined) {
        this._shapeModifyAttr(page, shape, "overrideBorders", val);
    }
    shapeModifySymOvFills(page: Page, shape: SymbolRefShape, val: true | undefined) {
        this._shapeModifyAttr(page, shape, "overrideFills", val);
    }
    shapeModifySymOvShadows(page: Page, shape: SymbolRefShape, val: true | undefined) {
        this._shapeModifyAttr(page, shape, "overrideShadows", val);
    }

    shapeModifyLock(page: Page, shape: Shape, isLocked: boolean) {
        this._shapeModifyAttr(page, shape, "isLocked", isLocked);
    }
    shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined) {
        this._shapeModifyAttr(page, shape, "isFlippedHorizontal", hflip);
    }
    shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined) {
        this._shapeModifyAttr(page, shape, "isFlippedVertical", vflip);
    }
    shapeModifyContextSettingsOpacity(page: Page, shape: Shape, contextSettingsOpacity: number) {
        if (shape.isVirtualShape) {
            return; // todo
        }
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyContextSettingOpacity(shape, contextSettingsOpacity));
        if (shape instanceof SymbolRefShape && !shape.overrideContextSettings) {
            this.shapeModifySymOvContextSettings(page, shape, true);
        }
    }
    shapeModifyResizingConstraint(page: Page, shape: Shape, resizingConstraint: number) {
        this._shapeModifyAttr(page, shape, "resizingConstraint", resizingConstraint);
    }
    shapeModifyRadius(page: Page, shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyRadius(shape, lt, rt, rb, lb));
    }
    shapeModifyFixedRadius(page: Page, shape: GroupShape | PathShape | PathShape2 | TextShape, fixedRadius: number | undefined) {
        this._shapeModifyAttr(page, shape, "fixedRadius", fixedRadius);
    }
    shapeModifyCurvPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyCurvPoint(page, shape, index, point));
    }
    shapeModifyCurvFromPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyCurvFromPoint(page, shape, index, point));
    }
    shapeModifyCurvToPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyCurvToPoint(page, shape, index, point));
    }
    shapeModifyBoolOp(page: Page, shape: Shape, op: BoolOp | undefined) {
        this._shapeModifyAttr(page, shape, "boolOp", op);
    }
    shapeModifyBoolOpShape(page: Page, shape: GroupShape, isOpShape: boolean | undefined) {
        this._shapeModifyAttr(page, shape, "isBoolOpShape", isOpShape);
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
    // points
    addPointAt(page: Page, shape: PathShape, idx: number, point: CurvePoint) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.addPointAt(shape, point, idx));
    }
    deletePoints(page: Page, shape: PathShape, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.deletePoints(shape, index, strength));
    }
    deletePoint(page: Page, shape: PathShape, index: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.deletePointAt(shape, index));
    }
    addPoints(page: Page, shape: PathShape, points: CurvePoint[]) {
        checkShapeAtPage(page, shape);
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            this.addOp(basicapi.addPointAt(shape, point, i));
        }
    }
    modifyPointCurveMode(page: Page, shape: PathShape, index: number, curveMode: CurveMode) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyCurveMode(page, shape, index, curveMode))
    }
    modifyPointHasFrom(page: Page, shape: PathShape, index: number, hasFrom: boolean) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyHasFrom(page, shape, index, hasFrom));
    }
    modifyPointHasTo(page: Page, shape: PathShape, index: number, hasTo: boolean) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyHasTo(page, shape, index, hasTo));
    }
    modifyPointCornerRadius(page: Page, shape: PathShape, index: number, cornerRadius: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyPointCornerRadius(page, shape, index, cornerRadius));
    }
    setCloseStatus(page: Page, shape: PathShape, isClosed: boolean) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.shapeModifyPathShapeClosedStatus(shape, isClosed));
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
    // cutout
    deleteExportFormatAt(page: Page, shape: Shape, idx: number) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this.addOp(basicapi.deleteExportFormatAt(shape.exportOptions, idx));
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
    addExportFormat(page: Page, shape: Shape, format: ExportFormat, index: number) {
        checkShapeAtPage(page, shape);
        this.addOp(basicapi.addExportFormat(shape, format, index));
    }
    addPageExportFormat(page: Page, format: ExportFormat, index: number) {
        this.addOp(basicapi.addPageExportFormat(page, format, index));
    }
    setExportFormatScale(page: Page, shape: Shape, idx: number, scale: number) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this.addOp(basicapi.setExportFormatScale(shape.exportOptions, idx, scale));
    }
    setPageExportFormatScale(page: Page, idx: number, scale: number) {
        if (!page.exportOptions) return;
        this.addOp(basicapi.setPageExportFormatScale(page.exportOptions, idx, scale));
    }
    setExportFormatName(page: Page, shape: Shape, idx: number, name: string) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this.addOp(basicapi.setExportFormatName(shape.exportOptions, idx, name));
    }
    setPageExportFormatName(page: Page, idx: number, name: string) {
        if (!page.exportOptions) return;
        this.addOp(basicapi.setPageExportFormatName(page.exportOptions, idx, name));
    }
    setExportFormatFileFormat(page: Page, shape: Shape, idx: number, fileFormat: ExportFileFormat) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this.addOp(basicapi.setExportFormatFileFormat(shape.exportOptions, idx, fileFormat));
    }
    setPageExportFormatFileFormat(page: Page, idx: number, fileFormat: ExportFileFormat) {
        if (!page.exportOptions) return;
        this.addOp(basicapi.setPageExportFormatFileFormat(page.exportOptions, idx, fileFormat));
    }
    setExportFormatPerfix(page: Page, shape: Shape, idx: number, perfix: ExportFormatNameingScheme) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this.addOp(basicapi.setExportFormatPerfix(shape.exportOptions, idx, perfix));
    }
    setPageExportFormatPerfix(page: Page, idx: number, perfix: ExportFormatNameingScheme) {
        if (!page.exportOptions) return;
        this.addOp(basicapi.setPageExportFormatPerfix(page.exportOptions, idx, perfix));
    }
    setExportTrimTransparent(page: Page, shape: Shape, trim: boolean) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this.addOp(basicapi.setExportTrimTransparent(shape.exportOptions, trim));
    }
    setExportCanvasBackground(page: Page, shape: Shape, background: boolean) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this.addOp(basicapi.setExportCanvasBackground(shape.exportOptions, background));
    }
    setExportPreviewUnfold(page: Page, shape: Shape, unfold: boolean) {
        checkShapeAtPage(page, shape);
        if (!shape.exportOptions) return;
        this.addOp(basicapi.setExportPreviewUnfold(shape.exportOptions, unfold));
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
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.insertSimpleText(shape, _text, text, idx, { attr }));
    }
    insertComplexText(page: Page, shape: TextShapeLike | Variable, idx: number, text: Text) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.insertComplexText(shape, _text, text, idx));
    }
    deleteText(page: Page, shape: TextShapeLike | Variable, idx: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.deleteText(shape, _text, idx, len));
    }
    textModifyColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyColor(shape, _text, idx, len, color));
    }
    textModifyFontName(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontname: string) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyFontName(shape, _text, idx, len, fontname));
    }
    textModifyFontSize(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontsize: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
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
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.shapeModifyTextVerAlign(_text, verAlign));
    }

    textModifyHighlightColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyHighlightColor(shape, _text, idx, len, color));
    }
    textModifyUnderline(page: Page, shape: TextShapeLike | Variable, underline: UnderlineType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyUnderline(shape, _text, underline, index, len));
    }
    textModifyStrikethrough(page: Page, shape: TextShapeLike | Variable, strikethrough: StrikethroughType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyStrikethrough(shape, _text, strikethrough, index, len));
    }
    textModifyBold(page: Page, shape: TextShapeLike | Variable, bold: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyBold(shape, _text, bold, index, len));
    }
    textModifyItalic(page: Page, shape: TextShapeLike | Variable, italic: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyItalic(shape, _text, italic, index, len));
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
            this.addOp(basicapi.deleteText(shape, _text, removeIndexs[i] - i, 1));
        }
        if (removeIndexs.length > 0) _text.reLayout(); // todo
    }

    private _textModifySetBulletNumbers(page: Page, shape: TextShapeLike | Variable, type: BulletNumbersType, index: number, len: number) {

        const _text = shape instanceof Shape ? shape.text : shape.value;
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
            const attr = new SpanAttrSetter();
            attr.placeholder = true;
            attr.bulletNumbers = new BulletNumbers(type);
            this.addOp(basicapi.insertSimpleText(shape, _text, '*', insertIndexs[i] + i, { attr }))
        }
        if (insertIndexs.length > 0) _text.reLayout();
    }

    textModifyBulletNumbers(page: Page, shape: TextShapeLike | Variable, type: BulletNumbersType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
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
    }

    textModifyBulletNumbersStart(page: Page, shape: TextShapeLike | Variable, start: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyBulletNumbersStart(shape, _text, start, index, len))
    }
    textModifyBulletNumbersInherit(page: Page, shape: TextShapeLike | Variable, inherit: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const behavior = inherit ? BulletNumbersBehavior.Inherit : BulletNumbersBehavior.Renew;
        this.addOp(basicapi.textModifyBulletNumbersBehavior(shape, _text, behavior, index, len))
    }

    textModifyHorAlign(page: Page, shape: TextShapeLike | Variable, horAlign: TextHorAlign, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        // fix index
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this.addOp(basicapi.textModifyHorAlign(shape, _text, horAlign, index, len));
    }

    textModifyParaIndent(page: Page, shape: TextShapeLike | Variable, indent: number | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifyParaIndent(shape, _text, indent, index, len));
    }
    textModifyMinLineHeight(page: Page, shape: TextShapeLike | Variable, minLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this.addOp(basicapi.textModifyMinLineHeight(shape, _text, minLineheight, index, len));
    }
    textModifyMaxLineHeight(page: Page, shape: TextShapeLike | Variable, maxLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this.addOp(basicapi.textModifyMaxLineHeight(shape, _text, maxLineheight, index, len));
    }
    textModifyKerning(page: Page, shape: TextShapeLike | Variable, kerning: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        this.addOp(basicapi.textModifySpanKerning(shape, _text, kerning, index, len));
    }
    textModifyParaSpacing(page: Page, shape: TextShapeLike | Variable, paraSpacing: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();

        const alignRange = _text.alignParaRange(index, len);
        index = alignRange.index;
        len = alignRange.len;
        this.addOp(basicapi.textModifyParaSpacing(shape, _text, paraSpacing, index, len));
    }
    textModifyTransform(page: Page, shape: TextShapeLike | Variable, transform: TextTransformType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();

        if (transform === TextTransformType.UppercaseFirst) {
            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;
        }
        this.addOp(basicapi.textModifySpanTransfrom(shape, _text, transform, index, len));
    }

    // table
    tableSetCellContentType(page: Page, table: TableShape, rowIdx: number, colIdx: number, contentType: TableCellType | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableInitCell(table, rowIdx, colIdx));
        const cell = table.getCellAt(rowIdx, colIdx);
        if (cell) this.addOp(basicapi.tableSetCellContentType(cell, contentType));
    }

    tableSetCellContentText(page: Page, table: TableShape, rowIdx: number, colIdx: number, text: Text | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableInitCell(table, rowIdx, colIdx));
        const cell = table.getCellAt(rowIdx, colIdx);
        if (cell) this.addOp(basicapi.tableSetCellContentText(cell, text));
    }

    tableSetCellContentImage(page: Page, table: TableShape, rowIdx: number, colIdx: number, ref: string | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableInitCell(table, rowIdx, colIdx));
        const cell = table.getCellAt(rowIdx, colIdx)!;
        const origin = cell.imageRef;
        if (origin !== ref) {
            this.addOp(basicapi.tableSetCellContentImage(cell, ref));
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

    tableModifyCellSpan(page: Page, table: TableShape, rowIdx: number, colIdx: number, rowSpan: number, colSpan: number) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableInitCell(table, rowIdx, colIdx));
        const cell = table.getCellAt(rowIdx, colIdx)!;
        const origin = { rowSpan: cell?.rowSpan, colSpan: cell?.colSpan };
        if ((origin.rowSpan ?? 1) !== rowSpan || (origin.colSpan ?? 1) !== colSpan) {
            this.addOp(basicapi.tableModifyCellSpan(cell, rowSpan, colSpan));
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
    tableModifyTextBold(page: Page, table: TableShape, bold: boolean) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextBold(table, bold));
    }
    tableModifyTextItalic(page: Page, table: TableShape, italic: boolean) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextItalic(table, italic));
    }
    tableModifyTextTransform(page: Page, table: TableShape, transform: TextTransformType | undefined) {
        checkShapeAtPage(page, table);
        this.addOp(basicapi.tableModifyTextTransform(table, transform));
    }
}