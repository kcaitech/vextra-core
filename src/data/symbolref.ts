import { ResourceMgr } from "./basic";
import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType, Override
} from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType, Override } from "./baseclasses"
import { uuid } from "../basic/uuid";
import { GroupShape, Shape, SymbolShape } from "./shape";
import { proxyShape } from "./symproxy";
import { Path } from "./path";
import { layoutChilds } from "./symlayout";
import { OverrideShape } from "./overrideshape";
import { Variable } from "./variable";
import { IImportContext, importSymbolShape } from "./baseimport";
import { proxyShape2 } from "./symproxy2";
import { Document } from "./document";


function genRefId(refId: string, type: OverrideType) {
    if (type === OverrideType.Variable) return refId;
    return refId + '/' + type;
}

export class SymbolRefShape extends Shape implements classes.SymbolRefShape {
    __data: GroupShape | undefined
    __symMgr?: ResourceMgr<GroupShape>

    // todo
    // 所有引用的symbol的临时数据都就缓存到这里，如text
    // 绘制实现不使用拷贝数据的方案，以优化性能
    // 仅编辑时拷贝数据？
    __cache: Map<string, any> = new Map();

    typeId = 'symbol-ref-shape'
    refId: string // 得支持变量"Variable:xxxxxx" unionsymbol需要引用到子symbol
    overrides: BasicArray<Override>
    variables: BasicArray<Variable>

    __proxyIdMap: Map<string, string> = new Map();
    __childs?: Shape[];

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        refId: string,
        overrides: BasicArray<Override>,
        variables: BasicArray<Variable>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.refId = refId
        this.overrides = overrides
        this.variables = variables;
    }

    mapId(id: string) {
        let _id = this.__proxyIdMap.get(id);
        if (_id) return _id;
        _id = uuid();
        this.__proxyIdMap.set(id, _id);
        return _id;
    }

    private __virtualShape?: OverrideShape;
    private __proxyedVirtualShape?: Shape;
    // 虚构一个OverrideShape, proxy?
    // 修改text fills borders重定向到修改variable
    getTarget(targetId: (string | { rowIdx: number, colIdx: number })[]): Shape {
        if (targetId.length === 0) return this;

        const refId = targetId[0] as string; // "xxxx/xxxx/xxxx" or "variable" or "override" or "fills" or "borders"
        // [0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}
        if (refId.length < 16) return this;

        if (this.__virtualShape) {
            this.__virtualShape.id = refId;
            return this.__proxyedVirtualShape!;
        }
        this.__virtualShape = new OverrideShape(refId,
            "",
            ShapeType.OverrideShape,
            new ShapeFrame(0, 0, 0, 0),
            new Style(new BasicArray(), new BasicArray()));
        // proxy是为了自动将编辑命令定向到override的数据
        // 在api层区分是shape修改还是variable、override修改，简单化数据层
        this.__proxyedVirtualShape = proxyShape(this.__virtualShape, this, [this]);
        return this.__proxyedVirtualShape;
    }

    getVirtualChilds(symRef: SymbolRefShape[] | undefined, parent: SymbolRefShape): Shape[] | undefined {
        if (!this.__data) return;
        const sym = this.__data;

        const _symRef = symRef ? symRef.slice(0) : [];
        _symRef.push(this);

        let _sym = sym;
        // union symbol
        if (sym.isUnionSymbolShape) {
            let _sym = sym.childs[0];
            // symbolref.
            if (sym.unionSymbolRef) {
                const c = sym.findChildById(sym.unionSymbolRef);
                if (c) _sym = c;
            }
        }
        // todo 这里必须要拷贝一份对象数据，否则对象数据里的临时数据会起冲突？
        // 暂时不会，目前所有会修改的都提前拷贝了？？
        // 会串的有： symbolref.__data, 这个支持不同实例后，是不一样的
        // text.__layout
        // objectId
        // 缺少document, 

        const copy = importSymbolShape(_sym as SymbolShape);
        // const childs = (_sym.childs || []).map((v: Shape) => proxyShape(v, parent, _symRef));

        const childs = copy.childs;
        const origin_childs = (_sym as GroupShape).childs;
        for (let i = 0, len = childs.length; i < len; ++i) {
            childs[i] = proxyShape2(childs[i], this, origin_childs[i], _symRef)
        }

        const thisframe = this.frame;
        const symframe = _sym.frame;
        if (thisframe.width !== symframe.width || thisframe.height !== symframe.height) {
            layoutChilds(childs, thisframe, symframe);
        }
        return childs;
    }

    // for render
    get virtualChilds(): Shape[] | undefined {
        // return this._virtualChilds;
        if (this.__childs) return this.__childs;
        this.__childs = this.getVirtualChilds(this.symRefs, this);
        return this.__childs;
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

    setSymbolMgr(mgr: ResourceMgr<GroupShape>) {
        this.__symMgr = mgr;
    }
    getSymbolMgr() {
        return this.__symMgr;
    }
    private __startLoad: boolean = false;
    peekSymbol(startLoad: boolean = false): GroupShape | undefined {
        const ret = this.__data;
        if (ret) return ret;
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            this.__symMgr && this.__symMgr.get(this.refId).then((val) => {
                if (!this.__data) {
                    this.__data = val;
                    if (val) this.notify();
                }
            })
        }
        return ret;
    }

    async loadSymbol() {
        if (this.__data) return this.__data;
        this.__data = this.__symMgr && await this.__symMgr.get(this.refId);
        if (this.__data) this.notify();
        return this.__data;
    }

    onRemoved(): void {
        // 构建symbol proxy shadow, 在这里需要unwatch

        this._reLayout();
        this.__data?.unwatch(this.watcher);
    }

    _reLayout() {
        if (this.__childs) {
            // todo compare
            this.__childs.forEach((c: any) => c.remove)
            this.__childs = undefined;
        }
    }

    private __hasNotify: any;
    reLayout() {
        this._reLayout();
        if (!this.__hasNotify) { // 这里有界面监听实时更新视图，导致反复实例proxy数据
            this.__hasNotify = setTimeout(() => {
                this.notify()
                this.__hasNotify = undefined;
            }, 0);
        }
    }

    setFrameSize(w: number, h: number): void {
        super.setFrameSize(w, h);
        this._reLayout(); // todo 太粗暴了！
    }

    getPath(): Path {
        const x = 0;
        const y = 0;
        const w = this.frame.width;
        const h = this.frame.height;
        const path = [
            ["M", x, y],
            ["l", w, 0],
            ["l", 0, h],
            ["l", -w, 0],
            ["z"]
        ]
        return new Path(path);
    }

    private __varMap?: Map<string, Variable>;
    private __overridesMap?: Map<string, Override>;
    private get overrideMap() {
        if (!this.__overridesMap) {
            const map = new Map();
            this.overrides.forEach((o) => {
                map.set(o.refId, o);
            })
            this.__overridesMap = map;
        }
        return this.__overridesMap;
    }

    private get varMap() { // 不可以构造时就初始化，这时的var没有proxy
        if (!this.__varMap) this.__varMap = new Map(this.variables.map((v) => [v.id, v]));
        return this.__varMap;
    }

    private _createVar4Override(type: OverrideType, value: any) {
        switch (type) {
            case OverrideType.Borders:
                return new Variable(uuid(), classes.VariableType.Borders, "");
            case OverrideType.Fills:
                return new Variable(uuid(), classes.VariableType.Fills, "");
            case OverrideType.Image:
                return new Variable(uuid(), classes.VariableType.ImageRef, "");
            // case OverrideType.StringValue:
            //     return new Variable(uuid(), classes.VariableType.StringValue, "");
            case OverrideType.Text:
                return new Variable(uuid(), classes.VariableType.Text, "");
            case OverrideType.Visible:
                return new Variable(uuid(), classes.VariableType.Visible, "");
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
        let over = new Override(refId, type, v.id);

        this.overrides.push(over);
        over = this.overrides[this.overrides.length - 1];

        if (this.__overridesMap) {
            this.__overridesMap.set(refId, over);
        }

        return { over, v };
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
                {
                    let override = this.getOverrid(refId, attr);
                    if (!override) {
                        override = this.createOverrid(refId, attr, value);
                    }
                    override.v.value = value;
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
                        override.over.varId = _val.id; // 映射到新变量
                        override.v = this.addVar(_val);
                    }
                    return override;
                }
            default:
                console.error("unknow override: " + attr, value)
        }
    }

    getOverrid(refId: string, type: OverrideType): { over: Override, v: Variable } | undefined {
        refId = genRefId(refId, type); // id+type->var
        const over = this.overrideMap.get(refId);
        if (over) {
            const v = this.varMap.get(over.varId);
            if (v) return { over, v }
        }
    }

    addVar(v: Variable) {
        this.variables.push(v);
        if (this.__varMap) this.__varMap.set(v.id, this.variables[this.variables.length - 1]);
        return this.variables[this.variables.length - 1];
    }
    deleteVar(varId: string) {
        const v = this.varMap.get(varId);
        if (v) {
            const i = this.variables.findIndex((v) => v.id === varId)
            this.variables.splice(i, 1);
            this.varMap.delete(varId);
        }
        return v;
    }
    getVar(varId: string) {
        return this.varMap.get(varId);
    }

    findVar(varId: string, ret: Variable[]) {
        const override = this.getOverrid(varId, OverrideType.Variable);
        if (override) {
            ret.push(override.v);
            super.findVar(override.v.id, ret);
            return;
        }
        const _var = this.getVar(varId);
        if (_var) {
            ret.push(_var);
            super.findVar(varId, ret);
            return;
        }
        super.findVar(varId, ret);
    }

    addOverrideAt(over: Override, index: number) {
        this.overrides.splice(index, 0, over);
        if (this.__overridesMap) {
            this.__overridesMap.set(over.refId, over);
        }
    }
    deleteOverrideAt(idx: number) {
        const ret = this.overrides.splice(idx, 1)[0];
        if (ret && this.__overridesMap) {
            this.__overridesMap.delete(ret.refId);
        }
        return ret;
    }
    deleteOverride(overrideId: string) {
        const v = this.overrideMap.get(overrideId);
        if (v) {
            const i = this.overrides.findIndex((v) => v.refId === overrideId)
            this.overrides.splice(i, 1);
            this.overrideMap.delete(overrideId);
        }
        return v;
    }

    addVariableAt(_var: Variable, index: number) {
        this.variables.splice(index, 0, _var);
        if (this.__varMap) {
            this.__varMap.set(_var.id, this.variables[index]);
        }
    }
    deleteVariableAt(idx: number) {
        const ret = this.variables.splice(idx, 1)[0];
        if (ret && this.__varMap) {
            this.__varMap.delete(ret.id);
        }
    }
    modifyVariableAt(idx: number, value: any) {
        this.variables[idx].value = value;
    }
}