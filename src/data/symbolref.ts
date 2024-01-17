import { BasicMap, ResourceMgr } from "./basic";
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
import { findOverrideAndVar } from "./utils";
import { CrdtIndex } from "./crdt";

function genRefId(refId: string, type: OverrideType) {
    if (type === OverrideType.Variable) return refId;
    return refId + '/' + type;
}

export class SymbolRefShape extends Shape implements classes.SymbolRefShape {
    __symMgr?: ResourceMgr<SymbolShape>

    // todo
    // 所有引用的symbol的临时数据都就缓存到这里，如text
    // 绘制实现不使用拷贝数据的方案，以优化性能
    // 仅编辑时拷贝数据？
    // __cache: Map<string, any> = new Map();

    typeId = 'symbol-ref-shape'
    refId: string

    overrides?: BasicMap<string, string> // 同varbinds，只是作用域为引用的symbol对象
    variables: BasicMap<string, Variable>

    // __childs?: Shape[];

    constructor(
        crdtidx: CrdtIndex,
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
        this.refId = refId
        this.variables = variables;
    }

    getOpTarget(path: string[]): any {
        const id0 = targetId[0];
        if (typeof id0 === 'string' && id0.startsWith('varid:')) {
            const varid = id0.substring('varid:'.length);
            return this.getVar(varid);
        }
        return super.getOpTarget(targetId);
    }

    removeVirbindsEx(key: string) {
        if (!this.overrides) return false;
        return this.overrides.delete(key);
    }

    // 由proxy实现
    get symData(): SymbolShape | undefined {
        return undefined;
    }

    // symData: SymbolShape | undefined;
    // private __startLoad: string | undefined;

    // updater(notify: boolean = true): boolean { // 自己的override也要更新
    //     const symMgr = this.__symMgr;
    //     if (!symMgr) return false;
    //     if (this.isVirtualShape) throw new Error("virtual shape can not be updated");
    //     const refId = this.refId;
    //     if (!refId) return false;
    //     if (this.__startLoad === refId) {
    //         if (this.symData) { // 更新subdata

    //             // 也要更新下
    //             this.__childsIsDirty = true;
    //             if (notify) this.notify("childs");
    //             return true;
    //         }
    //         return false;
    //     }

    //     this.__startLoad = refId;
    //     symMgr.get(refId).then((val) => {
    //         if (this.symData) this.symData.unwatch(this.updater);
    //         this.symData = val;
    //         if (this.symData) this.symData.watch(this.updater);

    //         this.__childsIsDirty = true;
    //         // if (notify) this.notify();
    //         this.notify("childs");
    //     })
    //     return false;
    // }

    // private __startLoad: string | undefined;
    // private getSymChilds(): Shape[] | undefined {
    //     if (!this.symData) {
    //         if (!this.__startLoad) this.updater();
    //         return;
    //     }
    //     return (this.symData)?.childs || [];
    // }
    // for render
    // get virtualChilds(): Shape[] | undefined {
    //     if (this.__childs) {
    //         if (this.__childsIsDirty) {
    //             // todo
    //             const childs = this.getSymChilds() || [];
    //             const _childs = this.__childs;
    //             if (_childs.length > childs.length) {
    //                 // 回收多余的
    //                 for (let i = childs.length, len = _childs.length; i < len; ++i) {
    //                     (_childs[i] as any).remove;
    //                 }
    //             }
    //             _childs.length = childs.length;
    //             const prefix = this.id + '/';
    //             for (let i = 0, len = childs.length; i < len; ++i) {
    //                 const c = _childs[i]; // 可能undefined
    //                 const origin = childs[i];
    //                 if (c && (c as any).originId === origin.id) {
    //                     continue;
    //                 }
    //                 if (c) (c as any).remove;
    //                 _childs[i] = proxyShape(this, origin, this, prefix + origin.id);
    //             }
    //             this.__childsIsDirty = false;
    //         }
    //         return this.__childs;
    //     }
    //     const childs = this.getSymChilds();
    //     if (!childs || childs.length === 0) return;
    //     const prefix = this.id + '/';
    //     this.__childs = childs.map((c) => proxyShape(this, c, this, prefix + c.id));
    //     layoutChilds(this.__childs, this.frame, childs[0].parent!.frame);
    //     this.__childsIsDirty = false;
    //     return this.__childs;
    // }

    // private __relayouting: any;
    // relayout() {
    //     if (this.__childs && !this.__relayouting) {
    //         this.__relayouting = setTimeout(() => {
    //             const childs = this.getSymChilds();
    //             if (this.__childs && childs && childs.length > 0) {
    //                 this.__childs.forEach((c) => (c as any).resetLayout);
    //                 layoutChilds(this.__childs, this.frame, childs[0].parent!.frame);
    //                 this.__childs.forEach((c) => (c as any).layoutChilds);
    //                 this.notify();
    //             }
    //             this.__relayouting = undefined;
    //         }, 0);
    //     }
    // }

    // for navigation column
    // get naviChilds(): Shape[] | undefined {
    //     return this.virtualChilds;
    // }

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
        if (this.isVirtualShape) return this.refId;
        if (!varsContainer) return this.refId;
        const _vars = findOverrideAndVar(this, OverrideType.SymbolID, varsContainer);
        if (!_vars) return this.refId;
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.SymbolRef) {
            return _var.value;
        }
        return this.refId;
    }

    // onRemoved(): void {
    //     // 构建symbol proxy shadow, 在这里需要unwatch

    //     if (this.__childs) {
    //         // todo compare
    //         this.__childs.forEach((c: any) => c.remove)
    //         this.__childs = undefined;
    //     }
    //     this.symData?.unwatch(this.updater);
    // }

    // setFrameSize(w: number, h: number): void {
    //     super.setFrameSize(w, h);
    //     this.relayout();
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
            case OverrideType.Lock:
                return new Variable(uuid(), classes.VariableType.Lock, "", value);
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

        if (!this.overrides) this.overrides = new BasicMap<string, string>();
        this.overrides.set(refId, v.id);

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
            case OverrideType.Lock:
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

    // findVar(varId: string, ret: Variable[]) {            // todo subdata, proxy
    //     if (this.symData) {
    //         const override = this.symData.getOverrid(varId, OverrideType.Variable);
    //         if (override) {
    //             ret.push(override.v);
    //             // scope??
    //             varId = override.v.id;
    //         }
    //         else {
    //             const _var = this.symData.getVar(varId);
    //             if (_var) {
    //                 ret.push(_var);
    //             }
    //         }
    //     }
    //     const override = this.getOverrid(varId, OverrideType.Variable);
    //     if (override) {
    //         ret.push(override.v);
    //         super.findVar(override.v.id, ret);
    //         return;
    //     }
    //     const _var = this.getVar(varId);
    //     if (_var) {
    //         ret.push(_var);
    //     }
    //     // 考虑scope
    //     // varId要叠加上refid
    //     if (this.isVirtualShape) {
    //         varId = (this as any).originId + '/' + varId;
    //     }
    //     else {
    //         varId = this.id + '/' + varId;
    //     }
    //     super.findVar(varId, ret);
    //     return;
    // }
    // findOverride(refId: string, type: OverrideType): Variable[] | undefined {
    //     if (this.symData) {
    //         const override = this.symData.getOverrid(refId, type);
    //         if (override) {
    //             const ret = [override.v];
    //             this.findVar(override.v.id, ret);
    //             return ret;
    //         }
    //     }
    //     const override = this.getOverrid(refId, type);
    //     if (override) {
    //         const ret = [override.v];
    //         // this.id
    //         refId = override.v.id;
    //         if (this.isVirtualShape) {
    //             refId = (this as any).originId + '/' + refId;
    //         }
    //         else {
    //             refId = this.id + '/' + refId;
    //         }
    //         super.findVar(refId, ret);
    //         return ret;
    //     }
    //     const thisId = this.isVirtualShape ? (this as any).originId : this.id;
    //     if (refId !== thisId) refId = thisId + '/' + refId; // fix ref自己查找自己的override
    //     return super.findOverride(refId, type);
    // }
    // public notify(...args: any[]): void {
    //     if (this.updater(false)) super.notify("childs", ...args);// todo
    //     else super.notify(...args);
    // }
}