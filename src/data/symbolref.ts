import { BasicMap, ResourceMgr } from "./basic";
import { Style } from "./style";
import * as classes from "./baseclasses"
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType,
} from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType, VariableType } from "./baseclasses"
import { uuid } from "../basic/uuid";
import { GroupShape, Shape, SymbolShape } from "./shape";
import { Path } from "./path";
import { Variable } from "./variable";
import { proxyShape } from "./symproxy";
import { layoutChilds } from "./symlayout";
import { findOverrideAndVar } from "./utils";

function genRefId(refId: string, type: OverrideType) {
    if (type === OverrideType.Variable) return refId;
    return refId + '/' + type;
}

export class SymbolRefShape extends Shape implements classes.SymbolRefShape {
    // __data: SymbolShape | undefined // 不能缓存了，不同的override，不同的data!
    // __subdata: SymbolShape | undefined; // union symbol shape
    __symMgr?: ResourceMgr<SymbolShape>

    // todo
    // 所有引用的symbol的临时数据都就缓存到这里，如text
    // 绘制实现不使用拷贝数据的方案，以优化性能
    // 仅编辑时拷贝数据？
    // __cache: Map<string, any> = new Map();

    typeId = 'symbol-ref-shape'
    refId: string

    virbindsEx?: BasicMap<string, string> // 同varbinds，只是作用域为引用的symbol对象
    variables?: BasicMap<string, Variable>

    __childs?: Shape[];

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        refId: string
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.refId = refId
        this.origin_watcher = this.origin_watcher.bind(this);
        this.updater = this.updater.bind(this);
        // this.updater();
    }

    private __childsIsDirty: boolean = false;
    origin_watcher(...args: any[]) {
        if (args.indexOf("vairable") >= 0) return;
        if (args.indexOf('childs') >= 0) this.__childsIsDirty = true;
        super.notify(...args);
        this.relayout();
    }

    getTarget(targetId: (string | { rowIdx: number, colIdx: number })[]): Shape | Variable | undefined {
        const id0 = targetId[0];
        if (typeof id0 === 'string' && id0.startsWith('varid:')) {
            const varid = id0.substring('varid:'.length);
            return this.getVar(varid);
        }
        return super.getTarget(targetId);
    }

    switchRef(refId: string) {
        // todo
    }

    private __data: SymbolShape | undefined;
    private __subdata: SymbolShape | undefined;
    private __startLoad: string | undefined;
    updater() {
        const symMgr = this.__symMgr;
        if (!symMgr) return;
        const refId = this.refId;
        if (!refId) return;
        if (this.__startLoad === refId) {
            if (this.__data) { // 更新subdata
                if (this.__data.isUnionSymbolShape && !this.__subdata) {
                    const syms = this.__data.getTagedSym(this);
                    this.__subdata = syms[0] || this.__data.childs[0];
                    if (this.__subdata) this.__subdata.watch(this.updater);
                }
                else if (!this.__data.isUnionSymbolShape && this.__subdata) {
                    this.__subdata.unwatch(this.updater);
                    this.__subdata = undefined;
                }
            }
            return;
        }

        this.__startLoad = refId;
        symMgr.get(refId).then((val) => {
            if (this.__data) this.__data.unwatch(this.updater);
            this.__data = val;
            if (this.__data) this.__data.watch(this.updater);
            // 处理status
            if (val && val.isUnionSymbolShape) {
                const syms = val.getTagedSym(this);
                if (this.__subdata) this.__subdata.unwatch(this.updater);
                this.__subdata = syms[0] || val.childs[0];
                if (this.__subdata) this.__subdata.watch(this.updater);
            }
            else if (this.__subdata) {
                this.__subdata.unwatch(this.updater);
                this.__subdata = undefined;
            }
            this.notify();
        })
    }

    // private __startLoad: string | undefined;
    private getSymChilds(): Shape[] | undefined {
        if (!this.__data) {
            if (!this.__startLoad) this.updater();
            return;
        }
        return (this.__subdata || this.__data)?.childs || [];
    }

    // for render
    get virtualChilds(): Shape[] | undefined {
        if (this.__childs) {
            if (this.__childsIsDirty) {
                // todo
                const childs = this.getSymChilds() || [];
                const _childs = this.__childs;
                if (_childs.length > childs.length) {
                    // 回收多余的
                    for (let i = childs.length, len = _childs.length; i < len; ++i) {
                        (_childs[i] as any).remove;
                    }
                }
                _childs.length = childs.length;
                const prefix = this.id + '/';
                for (let i = 0, len = childs.length; i < len; ++i) {
                    const c = _childs[i]; // 可能undefined
                    const origin = childs[i];
                    if (c && (c as any).originId === origin.id) {
                        continue;
                    }
                    if (c) (c as any).remove;
                    _childs[i] = proxyShape(origin, this, prefix + origin.id);
                }
            }
            return this.__childs;
        }
        const childs = this.getSymChilds();
        if (!childs || childs.length === 0) return;
        const prefix = this.id + '/';
        this.__childs = childs.map((c) => proxyShape(c, this, prefix + c.id));
        layoutChilds(this.__childs, this.frame, childs[0].parent!.frame);
        this.__childsIsDirty = false;
        return this.__childs;
    }

    private __relayouting: any;
    relayout() {
        if (this.__childs && !this.__relayouting) {
            this.__relayouting = setTimeout(() => {
                const childs = this.getSymChilds();
                if (this.__childs && childs && childs.length > 0) {
                    this.__childs.forEach((c) => c.resetLayout);
                    layoutChilds(this.__childs, this.frame, childs[0].parent!.frame);
                    this.__childs.forEach((c) => c.layoutChilds);
                    this.notify();
                }
                this.__relayouting = undefined;
            }, 0);
        }
    }

    // for navigation column
    get naviChilds(): Shape[] | undefined {
        return this.virtualChilds;
    }

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }
    getImageMgr() {
        return this.__imageMgr;
    }

    // get childs() {// 作为引用的symbol的parent，需要提供个childs
    //     return [];
    //     // return this.overrides;
    // }

    setSymbolMgr(mgr: ResourceMgr<SymbolShape>) {
        this.__symMgr = mgr;
    }
    getSymbolMgr() {
        return this.__symMgr;
    }

    getRefId2(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
        if (!varsContainer) return this.refId;
        const _vars = findOverrideAndVar(this, OverrideType.SymbolID, varsContainer);
        if (!_vars) return this.refId;
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.SymbolRef) {
            return _var.value;
        }
        return this.refId;
    }

    // getRefId() { // virtual shape 可用, 
    //     let refId = this.id;
    //     refId = refId.substring(refId.lastIndexOf('/') + 1);
    //     const _vars = super.findOverride(refId, OverrideType.SymbolID);
    //     if (!_vars) return this.refId;
    //     // watch vars
    //     this._watch_vars("symbolRef", _vars);
    //     const _var = _vars[_vars.length - 1];
    //     if (_var && _var.type === VariableType.SymbolRef) {
    //         return _var.value;
    //     }
    //     return this.refId;
    // }
    // private __startLoad: boolean = false;
    // peekSymbol(startLoad: boolean = false): SymbolShape | undefined {
    //     const ret = this.__data;
    //     if (ret) return ret;
    //     if (startLoad && !this.__startLoad && this.__symMgr) {
    //         this.__startLoad = true;
    //         this.__symMgr.get(this.getRefId([])).then((val) => {
    //             if (!this.__data) {
    //                 this.__data = val;
    //                 if (val) {
    //                     val.watch(this.origin_watcher)
    //                     this.notify();
    //                 }
    //             }
    //         })
    //     }
    //     return ret;
    // }
    // async loadSymbol() {
    //     if (this.__data) return this.__data;
    //     const val = this.__symMgr && await this.__symMgr.get(this.getRefId([]));
    //     if (!this.__data) {
    //         this.__data = val;
    //         if (val) {
    //             val.watch(this.origin_watcher)
    //             this.notify();
    //         }
    //     }
    //     return this.__data;
    // }

    onRemoved(): void {
        // 构建symbol proxy shadow, 在这里需要unwatch

        if (this.__childs) {
            // todo compare
            this.__childs.forEach((c: any) => c.remove)
            this.__childs = undefined;
        }
        this.__data?.unwatch(this.updater);
        this.__subdata?.unwatch(this.updater);
    }

    setFrameSize(w: number, h: number): void {
        super.setFrameSize(w, h);
        this.relayout();
    }

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
                return new Variable(uuid(), classes.VariableType.Borders, "", value);
            case OverrideType.Fills:
                return new Variable(uuid(), classes.VariableType.Fills, "", value);
            case OverrideType.Image:
                return new Variable(uuid(), classes.VariableType.ImageRef, "", value);
            // case OverrideType.StringValue:
            //     return new Variable(uuid(), classes.VariableType.StringValue, "");
            case OverrideType.Text:
                return new Variable(uuid(), classes.VariableType.Text, "", value);
            case OverrideType.Visible:
                return new Variable(uuid(), classes.VariableType.Visible, "", value);
            case OverrideType.SymbolID:
                return new Variable(uuid(), classes.VariableType.SymbolRef, "", value);
            case OverrideType.Variable:
                const _val = value as Variable;
                return _val;
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

        if (!this.virbindsEx) this.virbindsEx = new BasicMap<string, string>();
        this.virbindsEx.set(refId, v.id);

        return { refId, v };
    }

    // overrideValues
    addOverrid(refId: string, attr: OverrideType, value: any) {
        switch (attr) {
            case OverrideType.Text:
            // case OverrideType.StringValue:
            case OverrideType.Image:
            case OverrideType.Borders:
            case OverrideType.Fills:
            case OverrideType.Visible:
            case OverrideType.SymbolID:
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
                    }
                    else {
                        const _val = value as Variable;
                        this.virbindsEx?.set(override.refId, _val.id);// 映射到新变量
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
        if (!this.virbindsEx) this.virbindsEx = new BasicMap<string, string>();
        this.virbindsEx.set(refId, value);
    }

    removeOverrid2(refId: string, attr: OverrideType) {
        refId = genRefId(refId, attr); // id+type->var
        if (this.virbindsEx) {
            this.virbindsEx.delete(refId);
        }
    }

    getOverrid(refId: string, type: OverrideType): { refId: string, v: Variable } | undefined {
        refId = genRefId(refId, type); // id+type->var
        const over = this.virbindsEx && this.virbindsEx.get(refId);
        if (over) {
            const v = this.variables && this.variables.get(over);
            if (v) return { refId, v }
        }
    }
    getOverrid2(refId: string, type: OverrideType) {
        refId = genRefId(refId, type); // id+type->var
        return this.virbindsEx && this.virbindsEx.get(refId);
    }

    deleteOverride(overrideId: string) {
        if (this.varbindsEx) {
            this.varbindsEx.delete(overrideId);
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

    findVar(varId: string, ret: Variable[]) {            // todo subdata, proxy
        if (this.__data) {

            const override = this.__data.getOverrid(varId, OverrideType.Variable);
            if (override) {
                ret.push(override.v);
                // scope??
                varId = override.v.id;
            }
            else {
                const _var = this.__data.getVar(varId);
                if (_var) {
                    ret.push(_var);
                }
            }
        }
        const override = this.getOverrid(varId, OverrideType.Variable);
        if (override) {
            ret.push(override.v);
            super.findVar(override.v.id, ret);
            return;
        }
        const _var = this.getVar(varId);
        if (_var) {
            ret.push(_var);
        }
        // 考虑scope
        // varId要叠加上refid
        if (this.isVirtualShape) {
            varId = this.originId + '/' + varId;
        }
        else {
            varId = this.id + '/' + varId;
        }
        super.findVar(varId, ret);
        return;
    }

    findOverride(refId: string, type: OverrideType): Variable[] | undefined {
        if (this.__data) {
            const override = this.__data.getOverrid(refId, type);
            if (override) {
                const ret = [override.v];
                this.findVar(override.v.id, ret);
                return ret;
            }
        }
        const override = this.getOverrid(refId, type);
        if (override) {
            const ret = [override.v];
            super.findVar(override.v.id, ret);
            return ret;
        }
        if (this.isVirtualShape) {
            refId = this.originId + '/' + refId;
        }
        else {
            refId = this.id + '/' + refId;
        }
        return super.findOverride(refId, type);
    }
}