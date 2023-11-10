import {Style} from "./style";
import {Para, ParaAttr, Span, Text} from "./text";
import {BasicArray} from "./basic";

export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType, Variable, VariableType
} from "./baseclasses"
import {CurvePoint, OverrideType, ShapeFrame, TextBehaviour, VariableType} from "./baseclasses"
import {GroupShape, Shape, SymbolShape, TextShape, VarWatcher, Variable, makeVarWatcher} from "./shape";
import {mergeParaAttr, mergeSpanAttr, mergeTextAttr} from "./textutils";
import {SymbolRefShape} from "./symbolref";
import {__objidkey} from "../basic/objectid";
import {importCurvePoint} from "./baseimport";
import {layoutChilds} from "./symlayout";

// 内核提供给界面的dataface, 仅用于界面获取对象信息
// 绘制独立计算
// 编辑由api重定向

const mutable = new Set([
    // "__startLoad",
    // "__data",
    "__symMgr",
    // "__symproxy_cache",
    __objidkey
]);

function checkNotProxyed(val: Object) {
    if ((val as any).__symbolproxy) throw new Error("");
}

class HdlBase { // protect data
    // __cache: Map<PropertyKey, any> = new Map();
    __parent: any;

    constructor(parent: any) {
        makeVarWatcher(this);
        this.__parent = parent;
    }

    public notify(...args: any[]) {
    }

    // map_get(key: any): any {
    //     // BasicMap, proxy后再proxy
    //     const get = Map.prototype.get.bind(this); // this应该被绑定到target!
    //     const val = get(key);
    //     if (typeof val === 'object') {
    //         if (val instanceof Shape) throw new Error("");
    //         checkNotProxyed(val);
    //         return new Proxy(val, new HdlBase());
    //     }
    //     return val;
    // }

    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        // this.__cache.set(propertyKey, value);
        // return true;
        if (mutable.has(propertyKey.toString())) {
            return Reflect.set(target, propertyKey, value, receiver);
        }
        throw new Error(propertyKey.toString())
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any): any {
        if (propertyKey === "__symbolproxy") {
            return true;
        }
        if (mutable.has(propertyKey.toString())) {
            return Reflect.get(target, propertyKey, receiver);
        }
        if (propertyKey === "remove") {
            // 清除watch
            return this.onRemoved(target);
        }
        if (propertyKey === 'parent' || propertyKey === '__parent') {
            return this.__parent;
        }
        if (target instanceof Map) { // map对象上的属性和方法都会进入get
            if (propertyKey === 'get') { // 高频操作，单独提出并置顶，提高响应速度
                // return this.map_get.bind(target);
                const _get = Reflect.get(target, propertyKey, receiver).bind(target);
                return (key: any) => {
                    const val = _get(key);
                    if (typeof val === 'object') {
                        if (val instanceof Shape) throw new Error("");
                        checkNotProxyed(val);
                        return new Proxy(val, new HdlBase(receiver));
                    }
                    return val;
                }
            } else if (propertyKey === 'set') {
                throw new Error("")
                // return Map.prototype.set.bind(target);
            } else if (propertyKey === 'delete') { // 需要进入事务的方法
                throw new Error("")
                // return Map.prototype.delete.bind(target);
            } else if (propertyKey === 'size') { // map对象上唯一的一个可访问属性
                return target.size;
            } else if (propertyKey === 'clear') { // todo clear操作为批量删除，也需要进入事务
                throw new Error("")
                // return false;
            } else { // 其他操作，get、values、has、keys、forEach、entries，不影响数据
                const val = Reflect.get(target, propertyKey, receiver);
                if (typeof val === 'function') {
                    return val.bind(target);
                }
                return val;
            }
        }
        if (target instanceof Set) { // map对象上的属性和方法都会进入get
            if (propertyKey === 'add') {
                throw new Error("")
                // return Map.prototype.set.bind(target);
            } else if (propertyKey === 'delete') { // 需要进入事务的方法
                throw new Error("")
                // return Map.prototype.delete.bind(target);
            } else if (propertyKey === 'size') { // map对象上唯一的一个可访问属性
                return target.size;
            } else if (propertyKey === 'clear') { // todo clear操作为批量删除，也需要进入事务
                throw new Error("")
                // return false;
            } else { // 其他操作，get、values、has、keys、forEach、entries，不影响数据
                const val = Reflect.get(target, propertyKey, receiver);
                if (typeof val === 'function') {
                    return val.bind(target);
                }
                return val;
            }
        }

        const val = Reflect.get(target, propertyKey, receiver);
        if (typeof val === 'object') {
            if (val instanceof Shape) throw new Error(propertyKey.toString());
            // checkNotProxyed(val);
            if ((val as any).__symbolproxy) return val;
            return new Proxy(val, new HdlBase(receiver));
        }
        return val;
    }

    has(target: object, propertyKey: PropertyKey) {
        if (target instanceof Map || target instanceof Set) {
            return target.has(propertyKey);
        }
        return Reflect.has(target, propertyKey);
    }

    onRemoved(target: object) {
        (this as any as VarWatcher)._var_on_removed();
    }
}

function _getOnVar(
    shape: Shape, // proxyed
    hdl: HdlBase,
    propertyKey: PropertyKey,
    overType: OverrideType,
    varType: VariableType): Variable | undefined {

    if (!(shape as any).__symbolproxy) throw new Error("");
    const varbinds = shape.varbinds;
    const varId = varbinds?.get(overType);
    if (!varId) {
        // find override
        // id: xxx/xxx/xxx
        const id = shape.id;
        const _vars = shape.findOverride(id.substring(id.lastIndexOf('/') + 1), overType);
        if (_vars) {
            (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                return _var;
            }
        }
    } else {
        const _vars: Variable[] = [];
        shape.findVar(varId, _vars);
        // watch vars
        (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === varType) {
            return _var;
        }
    }
}

class StyleHdl extends HdlBase {

    __parent: Shape; // proxyed shape

    constructor(parent: Shape) {
        super(parent);
        this.__parent = parent;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'parent' || propStr === '__parent') return this.__parent;
        if (propStr === 'fills') {
            const val = _getOnVar(
                this.__parent,
                this, propertyKey,
                OverrideType.Fills,
                VariableType.Fills);
            if (val) return val.value;
            return Reflect.get(target, propertyKey, receiver);
        }
        if (propStr === 'borders') {
            const val = _getOnVar(
                this.__parent,
                this,
                propertyKey,
                OverrideType.Borders,
                VariableType.Borders);
            if (val) return val.value;
            return Reflect.get(target, propertyKey, receiver);
        }
        return super.get(target, propertyKey, receiver);
    }

    public notify(...args: any[]): void {
        this.__parent.notify(...args);
    }
}

class ShapeHdl extends HdlBase {
    __root: SymbolRefShape;
    __origin: Shape;
    __parent: Shape;

    // layout
    __frame: ShapeFrame = new ShapeFrame(0, 0, 0, 0);
    __vflip: boolean = false;
    __hflip: boolean = false;
    __rotate: number = 0;
    __points: CurvePoint[] | undefined;

    private get __watcher(): Set<((...args: any[]) => void)> {
        let cache: Map<string, any> = (this.__origin as any).__symproxy_cache;
        if (!cache) {
            cache = new Map<string, any>();
            (this.__origin as any).__symproxy_cache = cache;
        }
        const idx = this.__id + '/' + 'watcher';
        let watcher: Set<((...args: any[]) => void)> = cache.get(idx);
        if (!watcher) {
            watcher = new Set<((...args: any[]) => void)>();
            cache.set(idx, watcher);
        }
        return watcher;
    }

    public watch(watcher: ((...args: any[]) => void)): (() => void) {
        this.__watcher.add(watcher);
        return () => {
            this.__watcher.delete(watcher);
        };
    }

    public unwatch(watcher: ((...args: any[]) => void)): boolean {
        return this.__watcher.delete(watcher);
    }

    public notify(...args: any[]) {
        if (this.__watcher.size === 0) return;
        // 在set的foreach内部修改set会导致无限循环
        Array.from(this.__watcher).forEach(w => {
            w(...args);
        });
    }

    resetLayout() {
        const frame = this.__origin.frame;
        this.__frame.x = frame.x;
        this.__frame.y = frame.y;
        this.__frame.width = frame.width;
        this.__frame.height = frame.height;

        this.__vflip = !!this.__origin.isFlippedVertical;
        this.__hflip = !!this.__origin.isFlippedHorizontal;
        this.__rotate = this.__origin.rotation || 0;

        const points = this.__origin.points;
        if (points) {
            const _points: CurvePoint[] = [];
            points.forEach((p: CurvePoint) => {
                _points.push(importCurvePoint(p))
            })
            this.__points = _points;
        } else {
            this.__points = undefined;
        }
    }

    fireRelayout() {
        this.__parent.relayout();
    }

    // cache
    protected __id: string;
    protected __originId: string;

    private __style?: Style;

    origin_watcher(...args: any[]) {
        if (args.indexOf("variable") >= 0) return;
        this.notify(...args);
        this.fireRelayout();
    }

    root_watcher(...args: any[]) {
        // if (args.indexOf("variable") >= 0) return;
        // this.notify(...args);
        // this.fireRelayout();
    }

    constructor(root: SymbolRefShape, origin: Shape, parent: Shape, id: string) {
        super(parent);
        this.__root = root;
        this.__origin = origin;
        this.__parent = parent;

        if (!(parent instanceof SymbolRefShape) && !parent.__symbolproxy) throw new Error("");

        this.origin_watcher = this.origin_watcher.bind(this);
        this.root_watcher = this.root_watcher.bind(this);

        // watch unwatch
        this.watch = this.watch.bind(this);
        this.unwatch = this.unwatch.bind(this);
        this.notify = this.notify.bind(this);

        origin.watch(this.origin_watcher);

        root.watch(this.root_watcher);

        if (id.startsWith('undefined')) throw new Error("");

        this.__id = id; // xxxx/xxxx/xxxx
        this.__originId = id.substring(id.lastIndexOf('/') + 1);

        this.resetLayout();
    }

    onRemoved(target: object) {
        super.onRemoved(target);
        this.__origin.unwatch(this.origin_watcher);
        this.__root.unwatch(this.root_watcher);
        if (this.__style) (this.__style as any).remove;
    }

    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        const propStr = propertyKey.toString();
        if (propStr === "isFlippedVertical") {
            this.__vflip = value;
            return true;
        }
        if (propStr === "isFlippedHorizontal") {
            this.__hflip = value;
            return true;
        }
        if (propStr === "rotation") {
            this.__rotate = value;
            return true;
        }
        return super.set(target, propertyKey, value, receiver);
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'isVirtualShape') return true;
        if (propStr === 'id') return this.__id;
        if (propStr === 'originId') return this.__originId;
        if (propStr === '__origin') return this.__origin;
        if (propStr === 'parent' || propStr === '__parent') return this.__parent;
        if (propStr === 'style') {
            if (this.__style) return this.__style;
            const hdl = new StyleHdl(receiver as Shape);
            const origin = this.__origin.style;
            checkNotProxyed(origin);
            this.__style = new Proxy<Style>(origin, hdl);
            return this.__style;
        }
        if (propStr === "isVisible") {
            const val = _getOnVar(
                receiver as Shape,
                this,
                propertyKey,
                OverrideType.Visible,
                VariableType.Visible);
            if (val) return val.value;
            return Reflect.get(target, propertyKey, receiver);
        }
        if (propStr === "watch") {
            return this.watch;
        }
        if (propStr === "unwatch") {
            return this.unwatch;
        }
        if (propStr === "notify") {
            return this.notify;
        }
        if (propStr === "frame") {
            return this.__frame;
        }
        if (propStr === "isFlippedVertical") {
            return this.__vflip;
        }
        if (propStr === "isFlippedHorizontal") {
            return this.__hflip;
        }
        if (propStr === "rotation") {
            return this.__rotate;
        }
        if (propStr === "points") {
            return this.__points;
        }
        if (propStr === "relayout") {
            return () => {
                this.__parent.relayout();
            }
        }
        if (propStr === "resetLayout") {
            return this.resetLayout();
        }
        return super.get(target, propertyKey, receiver);
    }
}

class GroupShapeHdl extends ShapeHdl {
    __childs?: Shape[];
    __childsIsDirty: boolean = false;

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'childs' || propStr === 'naviChilds') {
            if (this.__childs) {
                if (this.__childsIsDirty) {
                    this.__childsIsDirty = false;
                    const childs = (this.__origin as GroupShape).childs;
                    const _childs = this.__childs;
                    if (_childs.length > childs.length) {
                        // 回收多余的
                        for (let i = childs.length, len = _childs.length; i < len; ++i) {
                            (_childs[i] as any).remove;
                        }
                    }
                    _childs.length = childs.length;

                    const prefix = this.__id.substring(0, this.__id.lastIndexOf('/') + 1);
                    for (let i = 0, len = childs.length; i < len; ++i) {
                        const c = _childs[i]; // 可能undefined
                        const origin = childs[i];
                        if (c && (c as any).originId === origin.id) {
                            continue;
                        }
                        if (c) (c as any).remove;
                        _childs[i] = proxyShape(this.__root, origin, receiver as Shape, prefix + origin.id);
                    }
                }
                return this.__childs;
            }
            const prefix = this.__id.substring(0, this.__id.lastIndexOf('/') + 1);
            this.__childs = (this.__origin as GroupShape).childs.map((child) => proxyShape(this.__root, child, receiver as Shape, prefix + child.id));
            return this.__childs;
        }
        if (propStr === "layoutChilds") {
            if (this.__childs) this.__childs.forEach((c) => c.layoutChilds);
            return;
        }
        return super.get(target, propertyKey, receiver);
    }

    origin_watcher(...args: any[]): void {
        if (args.indexOf("variable") >= 0) return;
        if (args.indexOf('childs') >= 0) this.__childsIsDirty = true;
        super.origin_watcher(...args);
    }

    onRemoved(target: object): void {
        super.onRemoved(target);
        if (this.__childs) {
            this.__childs.forEach((c: any) => c.remove)
            this.__childs = undefined;
        }
    }

    resetLayout(): void {
        super.resetLayout();
        if (this.__childs) {
            this.__childs.forEach((c) => c.resetLayout);
        }
    }
}

class SymbolRefShapeHdl extends ShapeHdl {
    __childs?: Shape[];
    __childsIsDirty: boolean = false;
    __saveWidth: number = 0;
    __saveHeight: number = 0;

    constructor(root: SymbolRefShape, origin: Shape, parent: Shape, id: string) {
        super(root, origin, parent, id);
        this.updater = this.updater.bind(this);
        this.updater();
        this.relayout = this.relayout.bind(this);
    }

    saveFrame() {
        this.__saveWidth = this.__frame.width;
        this.__saveHeight = this.__frame.height;
    }

    getRefId() {
        let refId = (this.__origin as SymbolRefShape).refId;
        // 从parent开始查找
        const _vars = this.__parent.findOverride(this.__originId, OverrideType.SymbolID);
        if (!_vars) return refId;
        // watch vars
        (this as any as VarWatcher)._watch_vars("symbolRef", _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.SymbolRef) {
            return _var.value;
        }
        return refId;
    }

    getVarsContainer() {
        const varsContainer = [];
        let p: Shape | undefined = this.__parent;
        while (p) {
            if (p instanceof SymbolRefShape) {
                if (p.__subdata) varsContainer.push(p.__subdata);
                if (p.__data) varsContainer.push(p.__data);
                if (!((p as any).__symbolproxy)) {
                    varsContainer.push(p);
                    break;
                }
                varsContainer.push(p.__origin)
            }
            p = p.parent;
        }
        return varsContainer.reverse();
    }

    private __data: SymbolShape | undefined;
    private __subdata: SymbolShape | undefined;
    private __startLoad: string = "";

    updater(notify: boolean = true): boolean { // todo 有父级以上的override，也要更新
        const symMgr = (this.__origin as SymbolRefShape).getSymbolMgr();
        if (!symMgr) return false;
        const refId = this.getRefId();
        if (this.__startLoad === refId) {
            if (this.__data) { // 更新subdata
                if (this.__data.isUnionSymbolShape) {
                    // varscontainer
                    const varsContainer = this.getVarsContainer();
                    const syms = this.__data.getTagedSym(this.__origin, varsContainer); // 不对
                    const subdata = syms[0] || this.__data.childs[0];
                    if (this.__subdata !== subdata) {
                        if (this.__subdata) this.__subdata.unwatch(this.updater);
                        this.__subdata = subdata;
                        if (this.__subdata) this.__subdata.watch(this.updater);
                        this.__childsIsDirty = true;
                        if (notify) this.notify("childs");
                        return true;
                    }
                } else if (!this.__data.isUnionSymbolShape && this.__subdata) {
                    this.__subdata.unwatch(this.updater);
                    this.__subdata = undefined;
                    this.__childsIsDirty = true;
                    if (notify) this.notify("childs");
                    return true;
                }
                // 也要更新下
                this.__childsIsDirty = true;
                if (notify) this.notify("childs");
                return true;
            }
            return false;
        }

        this.__startLoad = refId;
        symMgr.get(refId).then((val) => {
            if (this.__data) this.__data.unwatch(this.updater);
            this.__data = val;
            if (this.__data) this.__data.watch(this.updater);
            // 处理status
            if (val && val.isUnionSymbolShape) {
                const varsContainer = this.getVarsContainer();
                const syms = val.getTagedSym(this.__origin, varsContainer);
                if (this.__subdata) this.__subdata.unwatch(this.updater);
                this.__subdata = syms[0] || val.childs[0];
                if (this.__subdata) this.__subdata.watch(this.updater);
            } else if (this.__subdata) {
                this.__subdata.unwatch(this.updater);
                this.__subdata = undefined;
            }
            this.__childsIsDirty = true;
            // if (notify) this.notify();
            this.notify("childs");
        }, (reject) => {
            console.log(reject)
            this.__startLoad = ""
        })
        return false;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'virtualChilds' || propStr === 'naviChilds') {
            if (!this.__childs) {
                const childs: Shape[] = (this.__subdata || this.__data)?.childs || [];
                if (!childs || childs.length === 0) return;
                const prefix = this.__id + '/';
                this.__childs = childs.map((origin) => proxyShape(this.__root, origin, receiver as Shape, prefix + origin.id));
                layoutChilds(this.__childs, this.__origin.frame, childs[0].parent!.frame);
                this.saveFrame();
                this.__childsIsDirty = false;
                return this.__childs
            }
            if (this.__childsIsDirty) {
                this.__childsIsDirty = false;
                const childs: Shape[] = (this.__subdata || this.__data)?.childs || [];
                const _childs = this.__childs;
                if (_childs.length > childs.length) {
                    // 回收多余的
                    for (let i = childs.length, len = _childs.length; i < len; ++i) {
                        (_childs[i] as any).remove;
                    }
                }
                _childs.length = childs.length;
                const prefix = this.__id + '/';
                for (let i = 0, len = childs.length; i < len; ++i) {
                    const c = _childs[i]; // 可能undefined
                    const origin = childs[i];
                    if (c && (c as any).originId === origin.id) {
                        continue;
                    }
                    if (c) (c as any).remove;
                    _childs[i] = proxyShape(this.__root, origin, receiver as Shape, prefix + origin.id);
                }
            }
            return this.__childs;
        }

        if (propStr === "__data") { // todo hack: 用于findVar
            return this.__data;
        }
        if (propStr === "__subdata") { // todo hack
            return this.__subdata;
        }

        if (propStr === "relayout") {
            return this.relayout;
        }
        if (propStr === "layoutChilds") {
            return this.layoutChilds();
        }
        if (propStr === "varsContainer") {
            return this.getVarsContainer();
        }
        return super.get(target, propertyKey, receiver);
    }

    origin_watcher(...args: any[]): void {
        if (args.indexOf("variable") >= 0) return;
        if (args.indexOf('childs') >= 0) this.__childsIsDirty = true;
        if (this.updater(false)) super.origin_watcher("childs", ...args);
        else super.origin_watcher(...args);
    }

    onRemoved(target: object): void {
        super.onRemoved(target);
        if (this.__childs) {
            this.__childs.forEach((c: any) => c.remove)
            this.__childs = undefined;
        }
        this.__data?.unwatch(this.updater);
        this.__subdata?.unwatch(this.updater);
    }

    private __relayouting: any;

    relayout() {
        if (this.__childs && !this.__relayouting) {
            this.__relayouting = setTimeout(() => {
                const childs = (this.__subdata || this.__data)?.childs || [];
                if (this.__childs && childs && childs.length > 0) {
                    this.__childs.forEach((c) => c.resetLayout);
                    layoutChilds(this.__childs, this.__origin.frame, childs[0].parent!.frame);
                    this.saveFrame();

                    this.__childs.forEach((c) => c.layoutChilds);

                    this.notify();
                }
                this.__relayouting = undefined;
            }, 0);
        }
    }

    // resetLayout(): void { // 需要优化
    //     super.resetLayout();
    //     if (this.__childs) {
    //         this.__childs.forEach((c) => c.resetLayout);
    //     }
    // }

    layoutChilds() {
        if (this.__saveHeight !== this.__frame.height || this.__saveWidth !== this.__frame.width) {
            this.relayout();
        }
    }
}

function createTextByString(stringValue: string, refShape: TextShapeLike) {
    const text = new Text(new BasicArray());
    if (refShape.text.attr) {
        mergeTextAttr(text, refShape.text.attr);
    }
    const para = new Para('\n', new BasicArray());
    para.attr = new ParaAttr();
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    mergeParaAttr(para, refShape.text.paras[0]);
    mergeSpanAttr(span, refShape.text.paras[0].spans[0]);
    text.insertText(stringValue, 0);
    return text;
}

type TextShapeLike = Shape & { text: Text }

const DefaultFontSize = Text.DefaultFontSize;

export function fixTextShapeFrameByLayout(text: Text, frame: ShapeFrame) {
    const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    switch (textBehaviour) {
        case TextBehaviour.FixWidthAndHeight:
            break;
        case TextBehaviour.Fixed: {
            const layout = text.getLayout();
            const fontsize = text.attr?.fontSize ?? DefaultFontSize;
            frame.height = Math.max(fontsize, layout.contentHeight);
            break;
        }
        case TextBehaviour.Flexible: {
            const layout = text.getLayout();
            const fontsize = text.attr?.fontSize ?? DefaultFontSize;
            frame.width = Math.max(fontsize, layout.contentWidth);
            frame.height = Math.max(fontsize, layout.contentHeight);
            break;
        }
    }
}

class TextShapeHdl extends ShapeHdl {

    __text?: Text;

    _getText(target: object, propertyKey: PropertyKey, receiver?: any) {

        const val = _getOnVar(
            receiver as Shape,
            this,
            propertyKey,
            OverrideType.Text,
            VariableType.Text);
        if (val) return val.value;
        return Reflect.get(target, propertyKey, receiver);
    }

    getText(target: object, propertyKey: PropertyKey, receiver?: any) {
        if (this.__text) return this.__text;
        this.__text = this._getText(target, propertyKey, receiver); // todo 编辑过variable后要更新
        if (typeof this.__text === 'string') this.__text = createTextByString(this.__text as string, this.__origin as TextShapeLike);
        const frame = (target as TextShape).frame;
        if (this.__text) this.__text.updateSize(frame.width, frame.height);
        return this.__text;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {

        if (propertyKey === 'frame') {
            const frame = super.get(target, propertyKey, receiver);
            // update frame
            if (!this.__text) {
                const text = this.getText(target, "text", receiver);
                if (text) fixTextShapeFrameByLayout(text, frame);
            }
            return frame;
        }

        if (propertyKey === 'text') {
            return this.getText(target, propertyKey, receiver);
        }

        return super.get(target, propertyKey, receiver);
    }

    notify(...args: any[]) {
        if (args.indexOf("variable") >= 0) {
            this.__text = undefined; // 重新获取
        }
        super.notify(...args);
    }

    root_watcher(...args: any[]): void {
        if (args.indexOf("variable") >= 0) {
            this.__text = undefined; // 重新获取
            return;
        }
        super.root_watcher(...args);
    }
}

function createHandler(root: SymbolRefShape, origin: Shape, parent: Shape, id: string) {
    if (origin instanceof GroupShape) {
        return new GroupShapeHdl(root, origin, parent, id);
    }
    if (origin instanceof TextShape) {
        return new TextShapeHdl(root, origin, parent, id);
    }

    if (origin instanceof SymbolRefShape) {
        return new SymbolRefShapeHdl(root, origin, parent, id);
    }

    return new ShapeHdl(root, origin, parent, id);
}

// 适配左侧导航栏
// 需要cache
export function proxyShape(root: SymbolRefShape, origin: Shape, parent: Shape, id: string): Shape {
    const hdl = createHandler(root, origin, parent, id);
    checkNotProxyed(origin);
    const ret = new Proxy<Shape>(origin, hdl);
    return ret;
}