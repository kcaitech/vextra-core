import { BasicArray, BasicMap, ResourceMgr } from "./basic";
import { Style } from "./style";
import * as classes from "./baseclasses"
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType,
} from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType } from "./baseclasses"
import { Shape, SymbolShape, CornerRadius } from "./shape";
import { Path } from "./path";
import { Variable } from "./variable";
import { SymbolMgr } from "./symbolmgr";
import { FrameType, PathType, RadiusType } from "./consts";
import { exportSymbolRefShape } from "./baseexport";

function genRefId(refId: string, type: OverrideType) {
    if (type === OverrideType.Variable) return refId;
    return refId.length > 0 ? refId + '/' + type : type;
}

export class SymbolRefShape extends Shape implements classes.SymbolRefShape {
    __symMgr?: SymbolMgr

    typeId = 'symbol-ref-shape'
    private __refId: string // set 方法会进事务

    overrides?: BasicMap<string, string> // 同varbinds，只是作用域为引用的symbol对象
    variables: BasicMap<string, Variable>
    isCustomSize?: boolean
    cornerRadius?: CornerRadius
    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        refId: string,
        variables: BasicMap<string, Variable>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.__refId = refId
        this.variables = variables;
    }

    toJSON() { // 直接json导出没有导出refId
        return exportSymbolRefShape(this);
    }

    getOpTarget(path: string[]): any {
        if (path[0] === 'overrides' && !this.overrides) this.overrides = new BasicMap<string, string>();
        return super.getOpTarget(path);
    }

    removeVirbindsEx(key: string) {
        if (!this.overrides) return false;
        return this.overrides.delete(key);
    }

    // 由proxy实现
    get symData(): SymbolShape | undefined {
        return undefined;
    }

    onSymbolReady() {
        this.notify('symbol-ready');
    }

    get refId() {
        return this.__refId;
    }
    set refId(id: string) {
        const mgr = this.__symMgr;
        if (id !== this.__refId) {
            if (mgr) mgr.removeRef(this.__refId, this);
            this.__refId = id;
            if (mgr) mgr.addRef(id, this);
        }
    }

    __isAdded: boolean = false;
    onAdded(): void {
        this.__isAdded = true;
        const mgr = this.__symMgr;
        if (mgr) {
            mgr.addRef(this.refId, this);
        }
    }
    onRemoved(): void {
        this.__isAdded = false;
        const mgr = this.__symMgr;
        if (mgr) {
            mgr.removeRef(this.refId, this);
        }
    }

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }
    getImageMgr() {
        return this.__imageMgr;
    }

    setSymbolMgr(mgr: SymbolMgr) {
        this.__symMgr = mgr;
        if (mgr && this.__isAdded) {
            mgr.addRef(this.refId, this);
        }
    }
    getSymbolMgr() {
        return this.__symMgr;
    }

    getPathOfFrame(frame: classes.ShapeFrame, fixedRadius?: number | undefined): Path {
        const w = frame.width;
        const h = frame.height;
        const path = [
            ["M", 0, 0],
            ["l", w, 0],
            ["l", 0, h],
            ["l", -w, 0],
            ["z"]
        ]
        return new Path(path);
    }

    getOverrid(refId: string, type: OverrideType): { refId: string, v: Variable } | undefined {
        refId = genRefId(refId, type); // id+type->var
        const over = this.overrides && this.overrides.get(refId);
        if (over) {
            const v = this.variables && this.variables.get(over);
            if (v) return { refId, v }
        }
    }
    getOverrid2(refId: string, type: OverrideType) {
        refId = genRefId(refId, type); // id+type->var
        return this.overrides && this.overrides.get(refId);
    }

    getVar(varId: string) {
        return this.variables && this.variables.get(varId);
    }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }

    get radius(): number[] {
        return [0];
    }

    get radiusType() {
        return RadiusType.Rect;
    }

    get frameType() {
        return FrameType.Flex;
    }
    getImageFill() {
        return false;
    }
}