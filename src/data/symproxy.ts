import { Style } from "./style";
import { Para, ParaAttr, Span, Text } from "./text";
import { BasicArray, Watchable } from "./basic";
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType, Variable, VariableType
} from "./baseclasses"
import { CurvePoint, OverrideType, ShapeFrame, VariableType } from "./baseclasses"
import { GroupShape, Shape, TextShape, VarWatcher, Variable, makeVarWatcher } from "./shape";
import { mergeParaAttr, mergeSpanAttr, mergeTextAttr } from "./textutils";
import { SHAPE_VAR_SLOT, STYLE_VAR_SLOT } from "./consts";
import { SymbolRefShape } from "./symbolref";
import { __objidkey } from "../basic/objectid";
import { importCurvePoint } from "./baseimport";
import { layoutChilds } from "./symlayout";

// 内核提供给界面的dataface, 仅用于界面获取对象信息
// 绘制独立计算
// 编辑由api重定向

const mutable = new Set([
    "__startLoad",
    "__data",
    "__symMgr",
    __objidkey
]);

function checkNotProxyed(val: Object) {
    if ((val as any).__symbolproxy) throw new Error("");
}

class HdlBase { // protect data
    // __cache: Map<PropertyKey, any> = new Map();
    constructor() {
        makeVarWatcher(this);
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
        throw new Error("")
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any): any {
        if (propertyKey === "__symbolproxy") {
            return true;
        }
        if (mutable.has(propertyKey.toString())) {
            return Reflect.get(target, propertyKey, receiver);
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
                        return new Proxy(val, new HdlBase());
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
        if (propertyKey === "remove") {
            // 清除watch
            return this.onRemoved(target);
        }
        const val = Reflect.get(target, propertyKey, receiver);
        if (typeof val === 'object') {
            if (val instanceof Shape) throw new Error("");
            checkNotProxyed(val);
            return new Proxy(val, new HdlBase());
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
    varSlot: string,
    varType: VariableType) {

    if (!(shape as any).__symbolproxy) throw new Error("");
    const varbinds = shape.varbinds;
    if (!varbinds) {
        // find override
        // id: xxx/xxx/xxx
        const id = shape.id;
        const _vars = shape.findOverride(id.substring(id.lastIndexOf('/') + 1), overType);
        if (_vars) {
            (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                return _var.value;
            }
        }
    } else {
        const varId = varbinds.get(varSlot);
        if (varId) {
            const _vars: Variable[] = [];
            shape.findVar(varId, _vars);
            // watch vars
            (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                return _var.value;
            }
        }
    }
}

class StyleHdl extends HdlBase {
    __parent: Shape; // proxyed shape

    constructor(parent: Shape) {
        super();
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
                STYLE_VAR_SLOT.fills,
                VariableType.Fills);
            if (val) return val;
            return Reflect.get(target, propertyKey, receiver);
        }
        if (propStr === 'borders') {
            const val = _getOnVar(
                this.__parent,
                this,
                propertyKey,
                OverrideType.Borders,
                STYLE_VAR_SLOT.borders,
                VariableType.Borders);
            if (val) return val;
            return Reflect.get(target, propertyKey, receiver);
        }
        return super.get(target, propertyKey, receiver);
    }

    public notify(...args: any[]): void {
        this.__parent.notify(...args);
    }
}

class ShapeHdl extends Watchable(HdlBase) {
    __origin: Shape;
    __parent: Shape;

    // layout
    __frame: ShapeFrame = new ShapeFrame(0, 0, 0, 0);
    __vflip: boolean = false;
    __hflip: boolean = false;
    __rotate: number = 0;
    __points: CurvePoint[] | undefined;

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
        if (args.indexOf("vairable") >= 0) return;
        super.notify(...args);
        this.fireRelayout();
    }

    constructor(origin: Shape, parent: Shape, id: string) {
        super();
        this.__origin = origin;
        this.__parent = parent;
        this.origin_watcher = this.origin_watcher.bind(this);

        // watch unwatch
        this.watch = this.watch.bind(this);
        this.unwatch = this.unwatch.bind(this);

        origin.watch(this.origin_watcher);

        if (id.startsWith('undefined')) throw new Error("");

        this.__id = id; // xxxx/xxxx/xxxx
        this.__originId = id.substring(id.lastIndexOf('/') + 1);

        this.resetLayout();
    }

    onRemoved(target: object) {
        super.onRemoved(target);
        this.__origin.unwatch(this.origin_watcher);
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
                OverrideType.Variable,
                SHAPE_VAR_SLOT.visible,
                VariableType.Visible);
            if (val) return val;
            return Reflect.get(target, propertyKey, receiver);
        }
        if (propStr === "watch") {
            return this.watch;
        }
        if (propStr === "unwatch") {
            return this.unwatch;
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
                    const prefix = this.__id + '/';
                    for (let i = 0, len = childs.length; i < len; ++i) {
                        const c = _childs[i]; // 可能undefined
                        const origin = childs[i];
                        if (c && (c as any).originId === origin.id) {
                            continue;
                        }
                        if (c) (c as any).remove;
                        _childs[i] = proxyShape(origin, receiver as Shape, prefix + origin.id);
                    }
                }
                return this.__childs;
            }
            const prefix = this.__id + '/';
            this.__childs = (this.__origin as GroupShape).childs.map((child) => proxyShape(child, receiver as Shape, prefix + child.id));
            return this.__childs;
        }
        if (propStr === "layoutChilds") {
            if (this.__childs) this.__childs.forEach((c) => c.layoutChilds);
            return;
        }
        return super.get(target, propertyKey, receiver);
    }

    origin_watcher(...args: any[]): void {
        if (args.indexOf("vairable") >= 0) return;
        super.origin_watcher(args);
        this.__childsIsDirty = true;
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

    saveFrame() {
        this.__saveWidth = this.__frame.width;
        this.__saveHeight = this.__frame.height;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'virtualChilds' || propStr === 'naviChilds') {
            if (!this.__childs) {
                const childs = (this.__origin as SymbolRefShape).getSymChilds() || [];
                if (!childs || childs.length === 0) return;
                const prefix = this.__id + '/';
                this.__childs = childs.map((origin) => proxyShape(origin, receiver as Shape, prefix + origin.id));
                layoutChilds(this.__childs, this.__origin.frame, childs[0].parent!.frame);
                this.saveFrame();
                this.__childsIsDirty = false;
                return this.__childs
            }
            if (this.__childsIsDirty) {
                this.__childsIsDirty = false;
                const childs = (this.__origin as SymbolRefShape).getSymChilds() || [];
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
                    _childs[i] = proxyShape(origin, receiver as Shape, prefix + origin.id);
                }
            }
            return this.__childs;
        }
        if (propStr === "relayout") {
            return this.relayout();
        }
        if (propStr === "layoutChilds") {
            return this.layoutChilds();
        }
        return super.get(target, propertyKey, receiver);
    }

    origin_watcher(...args: any[]): void {
        if (args.indexOf("vairable") >= 0) return;
        super.origin_watcher(args);
        this.__childsIsDirty = true;
    }

    onRemoved(target: object): void {
        super.onRemoved(target);
        if (this.__childs) {
            this.__childs.forEach((c: any) => c.remove)
            this.__childs = undefined;
        }
    }

    private __relayouting: any;
    relayout() {
        if (this.__childs && !this.__relayouting) {
            this.__relayouting = setTimeout(() => {
                const childs = this.getSymChilds();
                if (this.__childs && childs && childs.length > 0) {
                    this.__childs.forEach((c) => c.resetLayout);
                    layoutChilds(this.__childs, this.frame, childs[0].parent!.frame);
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

class TextShapeHdl extends ShapeHdl {

    __text?: Text;

    getText(target: object, propertyKey: PropertyKey, receiver?: any) {

        const val = _getOnVar(
            receiver as Shape,
            this,
            propertyKey,
            OverrideType.Text,
            SHAPE_VAR_SLOT.text,
            VariableType.Text);
        if (val) return val;
        return Reflect.get(target, propertyKey, receiver);
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {

        if (propertyKey === 'text') {
            if (this.__text) return this.__text;
            this.__text = this.getText(target, propertyKey, receiver); // 编辑过variable后要更新
            if (typeof this.__text === 'string') this.__text = createTextByString(this.__text as string, this.__origin as TextShapeLike);
            const frame = (target as TextShape).frame;
            if (this.__text) this.__text.updateSize(frame.width, frame.height);
            return this.__text;
        }

        return super.get(target, propertyKey, receiver);
    }
}

function createHandler(origin: Shape, parent: Shape, id: string) {
    if (origin instanceof GroupShape) {
        return new GroupShapeHdl(origin, parent, id);
    }
    if (origin instanceof TextShape) {
        return new TextShapeHdl(origin, parent, id);
    }

    if (origin instanceof SymbolRefShape) {
        return new SymbolRefShapeHdl(origin, parent, id);
    }

    return new ShapeHdl(origin, parent, id);
}

// 适配左侧导航栏
// 需要cache
export function proxyShape(origin: Shape, parent: Shape, id: string): Shape {
    const hdl = createHandler(origin, parent, id);
    checkNotProxyed(origin);
    const ret = new Proxy<Shape>(origin, hdl);
    return ret;
}