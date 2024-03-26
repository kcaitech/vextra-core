import { BasicArray, BasicMap, ResourceMgr } from "./basic";
import { Style } from "./style";
import * as classes from "./baseclasses"
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType,
} from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType, VariableType } from "./baseclasses"
import { uuid } from "../basic/uuid";
import { Shape, SymbolShape } from "./shape";
import { Path } from "./path";
import { Variable } from "./variable";
import { SymbolMgr } from "./symbolmgr";
import { PathType } from "./consts";
// import { findOverrideAndVar } from "./utils";

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
    // __childs?: Shape[];

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

    onRemoved(): void {
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
        if (mgr) {
            mgr.addRef(this.refId, this);
        }
    }
    getSymbolMgr() {
        return this.__symMgr;
    }

    // getRefId2(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    //     if (this.isVirtualShape) return this.refId;
    //     if (!varsContainer) return this.refId;
    //     const _vars = findOverrideAndVar(this, OverrideType.SymbolID, varsContainer);
    //     if (!_vars) return this.refId;
    //     const _var = _vars[_vars.length - 1];
    //     if (_var && _var.type === VariableType.SymbolRef) {
    //         return _var.value;
    //     }
    //     return this.refId;
    // }

    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [
            ["M", x, y],
            ["l", w, 0],
            ["l", 0, h],
            ["l", -w, 0],
            ["z"]
        ]
        return new Path(path);
    }

    private _createVar4Override(type: OverrideType, value: any) {
        switch (type) {
            case OverrideType.Borders:
                return new Variable(uuid(), VariableType.Borders, "", value);
            case OverrideType.Fills:
                return new Variable(uuid(), VariableType.Fills, "", value);
            case OverrideType.Image:
                return new Variable(uuid(), VariableType.ImageRef, "", value);
            // case OverrideType.StringValue:
            //     return new Variable(uuid(), classes.VariableType.StringValue, "");
            case OverrideType.Text:
                return new Variable(uuid(), VariableType.Text, "", value);
            case OverrideType.Visible:
                return new Variable(uuid(), VariableType.Visible, "", value);
            case OverrideType.Lock:
                return new Variable(uuid(), VariableType.Lock, "", value);
            case OverrideType.SymbolID:
                return new Variable(uuid(), VariableType.SymbolRef, "", value);
            case OverrideType.Variable:
                const _val = value as Variable;
                return _val;
            case OverrideType.EndMarkerType:
                return new Variable(uuid(), VariableType.MarkerType, "", value);
            case OverrideType.StartMarkerType:
                return new Variable(uuid(), VariableType.MarkerType, "", value);
            case OverrideType.ContextSettings:
                return new Variable(uuid(), VariableType.ContextSettings, "", value);
            case OverrideType.Shadows:
                return new Variable(uuid(), VariableType.Shadows, "", value);
            case OverrideType.TableCell:
                return new Variable(uuid(), VariableType.TableCell, "", value);
            default:
                throw new Error("unknow override type: " + type)
        }
    }

    private createVar4Override(type: OverrideType, value: any) {
        const v = this._createVar4Override(type, value);
        return this.addVar(v);
    }

    private createOverrid(refId: string, type: OverrideType, value: any) {

        refId = genRefId(refId, type); // id+type->var

        const v: Variable = this.createVar4Override(type, value);

        if (!this.overrides) this.overrides = new BasicMap<string, string>();
        this.overrides.set(refId, v.id);

        return { refId, v };
    }

    // overrideValues
    addOverrid(refId: string, attr: OverrideType, value: any) {
        switch (attr) {
            case OverrideType.Text:
            case OverrideType.Image:
            case OverrideType.Borders:
            case OverrideType.Fills:
            case OverrideType.Visible:
            case OverrideType.Lock:
            case OverrideType.SymbolID:
            case OverrideType.StartMarkerType:
            case OverrideType.EndMarkerType:
            case OverrideType.ContextSettings:
            case OverrideType.Shadows:
            case OverrideType.TableCell:
                {
                    let override = this.getOverrid(refId, attr);
                    if (!override) {
                        override = this.createOverrid(refId, attr, value);
                    }
                    // override.v.value = value;
                    return override;
                }
            case OverrideType.Variable:
                {
                    let override = this.getOverrid(refId, attr);
                    if (!override) {
                        override = this.createOverrid(refId, attr, value);
                    } else {
                        const _val = value as Variable;
                        this.overrides?.set(override.refId, _val.id);// 映射到新变量
                        override.v = this.addVar(_val);
                    }
                    return override;
                }
            default:
                console.error("unknow override: " + attr, value)
        }
    }

    addOverrid2(refId: string, attr: OverrideType, value: string) {
        refId = genRefId(refId, attr); // id+type->var
        if (!this.overrides) this.overrides = new BasicMap<string, string>();
        this.overrides.set(refId, value);
    }

    removeOverrid2(refId: string, attr: OverrideType) {
        refId = genRefId(refId, attr); // id+type->var
        if (this.overrides) {
            this.overrides.delete(refId);
        }
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

    deleteOverride(overrideId: string) {
        if ((this as any).varbindsEx) {
            (this as any).varbindsEx.delete(overrideId);
        }
    }
    addVar(v: Variable) {
        if (!this.variables) this.variables = new BasicMap<string, Variable>();
        this.variables.set(v.id, v);
        return this.variables.get(v.id)!;
    }
    deleteVar(varId: string) {
        if (this.variables) {
            return this.variables.delete(varId);
        }
    }
    getVar(varId: string) {
        return this.variables && this.variables.get(varId);
    }
    removeVar(key: string) {
        if (!this.variables) return false;
        // TODO 解绑
        return this.variables.delete(key);
    }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }
}