import { Border, Fill, Style } from "./style";
import { Para, ParaAttr, Span, Text } from "./text";
import { BasicArray } from "./basic";
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType, VariableType
} from "./baseclasses"
import { ShapeFrame, OverrideType, CurvePoint, TextBehaviour, Override, Point2D } from "./baseclasses"
import { GroupShape, ImageShape, Shape, TextShape, Variable } from "./shape";
import { importBorder, importCurvePoint, importFill, importText } from "./baseimport";
import { SymbolRefShape } from "./symbolref";
import { VariableType } from "./typesdefine";
import { mergeParaAttr, mergeSpanAttr, mergeTextAttr } from "./textutils";
import { uuid } from "../basic/uuid";
import { OverrideShape } from "./overrideshape";
import { copyShape } from "./utils";
import { TableShape } from "./table";

export class ForbiddenError extends Error { }

class FreezHdl {
    __target: Object;
    constructor(target: Object) {
        this.__target = target;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        if (propertyKey.toString().startsWith("__")) {
            const ret = Reflect.set(target, propertyKey, value, receiver);
            return ret;
        }
        throw new ForbiddenError("forbid set: " + propertyKey.toString());
    }
    deleteProperty(target: object, propertyKey: PropertyKey): boolean {
        if (propertyKey.toString().startsWith("__")) {
            const ret = Reflect.deleteProperty(target, propertyKey);
            return ret;
        }
        throw new ForbiddenError("forbid delete: " + propertyKey.toString());
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any): any {
        const val = Reflect.get(target, propertyKey, receiver);
        if (typeof val === 'object' && !propertyKey.toString().startsWith('__')) {
            if (!target.hasOwnProperty(propertyKey)) return val;
            return new Proxy<Object>(val, new FreezHdl(val));
        }
        return val;
    }
    has(target: object, propertyKey: PropertyKey): boolean {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        return Reflect.has(target, propertyKey);
    }
}

function genRefId(symRef: SymbolRefShape[], shapeId: string, i: number = 1) {
    let refId = "";
    for (let len = symRef.length; i < len; ++i) {
        if (refId.length > 0) refId += "/";
        refId += i === 0 ? symRef[i].id : symRef[i].originId;// 除第一个，其它都应该是proxy过的
    }
    if (refId.length > 0) refId += "/";
    refId += shapeId;
    return refId;
}

export function findOverride(symRef: SymbolRefShape[], id: string, type: OverrideType): { over: Override, v: Variable, i: number } | undefined {
    for (let i = 0, len = symRef.length; i < len; ++i) {
        const getter = symRef[i];
        const refId = genRefId(symRef, id, i + 1);
        const override = getter.getOverrid(refId, type);
        if (!override) continue;
        return { over: override.over, v: override.v, i };
    }
}

class StyleHdl extends FreezHdl {
    __symRef: SymbolRefShape[];
    __parent: Shape; // proxyed shape
    __parentHdl: ShapeHdl;
    __shape: Shape;

    __fills?: Fill[];
    __borders?: Border[];

    constructor(symRef: SymbolRefShape[], shape: Shape, target: Style, parent: Shape, parentHdl: ShapeHdl) {
        super(target)
        this.__symRef = symRef;
        this.__shape = shape;
        this.__parent = parent;
        this.__parentHdl = parentHdl;
    }

    private get style(): Style {
        return this.__target as Style;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'parent' || propStr === '__parent') return this.__parent;

        if (propStr === 'fills') {
            if (this.__fills) return this.__fills;
            const o = findOverride(this.__symRef, this.__shape.id, OverrideType.Fills);
            let fills: Fill[] = this.style.fills;
            if (o) {
                this.__shape._watch_vars("style/fills", [o.v]);
                if (o.i === 0) {
                    this.__fills = o.v.value as BasicArray<Fill>;
                    return this.__fills;
                }
                fills = o.v.value as BasicArray<Fill>;
            }
            this.__fills = fills.map<Fill>((v) => new Proxy<Fill>(v, new FreezHdl(v)));
            return this.__fills;
        }
        if (propStr === 'borders') {
            if (this.__borders) return this.__borders;
            const o = findOverride(this.__symRef, this.__shape.id, OverrideType.Borders);
            let borders: Border[] = this.style.borders;
            if (o) {
                this.__shape._watch_vars("style/borders", [o.v]);
                if (o.i === 0) {
                    this.__borders = o.v.value as BasicArray<Border>;
                    return this.__borders;
                }
                borders = o.v.value as BasicArray<Border>;
            }
            this.__borders = borders.map((v) => new Proxy<Border>(v, new FreezHdl(v)));
            return this.__borders;
        }
        return super.get(target, propertyKey, receiver);
    }
}

function isDiffPoint(p0: Point2D, p1: Point2D) {
    return p0.x !== p1.x || p0.y !== p1.y;
}

class ShapeHdl extends FreezHdl {
    __thisProxy?: Shape; // 由外面赋值。proxy对象依赖于handler，需要实例化proxy后才能赋值
    __symRef: SymbolRefShape[];
    __target: Shape;
    __parent: Shape;
    __origin: Shape;
    __style?: Style;
    __styleHdl?: StyleHdl;

    // 布局相关属性
    __save_frame: ShapeFrame;
    __save_rotation: number;
    __save_isFlippedHorizontal: boolean;
    __save_isFlippedVertical: boolean;
    __save_points: CurvePoint[] | undefined;

    // cache
    private __visible: { value: boolean } | undefined
    private __id: string;
    protected __refId: string;

    origin_watcher(...args: any[]) {

        // 清除cache
        if (this.__styleHdl) {
            this.__styleHdl.__borders = undefined;
            this.__styleHdl.__fills = undefined;
        }

        // todo 布局属性更改后要重新布局
        // todo 需要优化！
        if (this.checkRelayout()) this.__symRef[0].reLayout(); // 重排&重绘
        else this.__target.notify(...args);
    }

    symref_watcher(...args: any[]) {
        if (this.__styleHdl) {
            this.__styleHdl.__borders = undefined;
            this.__styleHdl.__fills = undefined;
        }
        // todo 优化？
        this.__target.notify(...args); // 重绘
    }

    /**
     * 
     * @param symRef 
     * @param target 
     * @param parent copy的数据没有走guard，无法访问parent
     * @param origin 原始对象
     */
    constructor(symRef: SymbolRefShape[], target: Shape /* copy */, parent: Shape, origin: Shape) {
        super(target);
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
        this.__origin = origin;
        this.origin_watcher = this.origin_watcher.bind(this);
        this.symref_watcher = this.symref_watcher.bind(this);
        this.override = this.override.bind(this);

        origin.watch(this.origin_watcher);
        symRef.forEach((s) => s.watch(this.symref_watcher));

        const frame = target.frame;

        this.__save_frame = new ShapeFrame(frame.x, frame.y, frame.width, frame.height);
        this.__save_rotation = target.rotation ?? 0;
        this.__save_isFlippedHorizontal = target.isFlippedHorizontal ?? false;
        this.__save_isFlippedVertical = target.isFlippedVertical ?? false;
        this.__save_points = (target as any).points ? (target as any).points.map((p: CurvePoint) => importCurvePoint(p)) : undefined;

        this.__refId = genRefId(symRef, target.id);
        this.__id = this.__symRef[0].mapId(this.__refId);
    }

    checkRelayout() {
        const origin = this.__origin;
        const frame = origin.frame;
        let needRelayout: boolean = false;
        for (; ;) {
            if (this.__save_frame.x !== frame.x ||
                this.__save_frame.y !== frame.y ||
                this.__save_frame.width !== frame.width ||
                this.__save_frame.height !== frame.height) {
                needRelayout = true;
                break;
            }
            if (this.__save_rotation !== origin.rotation) {
                needRelayout = true;
                break;
            }
            if (this.__save_isFlippedHorizontal !== origin.isFlippedHorizontal) {
                needRelayout = true;
                break;
            }
            if (this.__save_isFlippedVertical !== origin.isFlippedVertical) {
                needRelayout = true;
                break;
            }
            if (this.__save_points === undefined) {
                if ((origin as any).points !== undefined) {
                    needRelayout = true;
                    break;
                }
            }
            else if ((origin as any).points === undefined) {
                needRelayout = true;
                break;
            }
            else if (this.__save_points.length !== (origin as any).points.length) {
                needRelayout = true;
                break;
            }
            else {
                const points = (origin as any).points;
                const save_points = this.__save_points;
                for (let i = 0, len = save_points.length; i < len; ++i) {
                    const p0 = points[i] as CurvePoint;
                    const p1 = save_points[i];
                    if (isDiffPoint(p0.point, p1.point) ||
                        isDiffPoint(p0.curveFrom, p1.curveFrom) ||
                        isDiffPoint(p0.curveTo, p1.curveTo) ||
                        p0.hasCurveFrom !== p1.hasCurveFrom ||
                        p0.hasCurveTo !== p1.hasCurveTo ||
                        p0.cornerRadius !== p1.cornerRadius ||
                        p0.curveMode !== p1.curveMode) {
                        needRelayout = true;
                        break;
                    }
                }
                if (needRelayout) break;
            }
            break;
        }
        this.__save_frame = new ShapeFrame(frame.x, frame.y, frame.width, frame.height);
        this.__save_rotation = origin.rotation ?? 0;
        this.__save_isFlippedHorizontal = origin.isFlippedHorizontal ?? false;
        this.__save_isFlippedVertical = origin.isFlippedVertical ?? false;
        this.__save_points = (origin as any).points ? (origin as any).points.map((p: CurvePoint) => importCurvePoint(p)) : undefined;
        return needRelayout;
    }

    onRemoved() {
        this.__origin.unwatch(this.origin_watcher);
        this.__symRef.forEach((s) => s.unwatch(this.symref_watcher));
        this.__target.onRemoved();
    }

    override(type: OverrideType): { container: Shape, over: Override, v: Variable } | undefined {
        switch (type) {
            case OverrideType.Borders:
                {
                    const o = findOverride(this.__symRef, this.__target.id, OverrideType.Borders);
                    if (o && o.i === 0) return;
                    let curborders: Border[] = this.__target.style.borders;
                    if (o) curborders = o.v.value as BasicArray<Border>;
                    const borders = new BasicArray<Border>();
                    curborders.forEach((v) => {
                        const border = importBorder(v);
                        borders.push(border);
                    })
                    const override = this.__symRef[0].addOverrid(this.__refId, OverrideType.Borders, borders)!;
                    // 清除cache
                    if (this.__styleHdl) this.__styleHdl.__borders = undefined;
                    return { container: this.__symRef[0], over: override.over, v: override.v };
                }
            case OverrideType.Fills:
                {
                    const o = findOverride(this.__symRef, this.__target.id, OverrideType.Fills);
                    if (o && o.i === 0) return;
                    let curfills: Fill[] = this.__target.style.fills;
                    if (o) curfills = o.v.value as BasicArray<Fill>;
                    const imgMgr = this.__symRef[0].getImageMgr();
                    const fills = new BasicArray<Fill>();
                    curfills.forEach((v) => {
                        const fill = importFill(v);
                        if (imgMgr) fill.setImageMgr(imgMgr);
                        fills.push(fill);
                    })
                    const override = this.__symRef[0].addOverrid(this.__refId, OverrideType.Fills, fills)!;

                    // 清除cache
                    if (this.__styleHdl) this.__styleHdl.__fills = undefined;
                    return { container: this.__symRef[0], over: override.over, v: override.v };
                }
            case OverrideType.Visible:
                {
                    const o = findOverride(this.__symRef, this.__target.id, OverrideType.Visible);
                    if (o && o.i === 0) return;
                    let visible = this.__target.isVisible;
                    if (o) visible = o.v.value as boolean;
                    this.__visible = undefined;
                    const override = this.__symRef[0].addOverrid(this.__refId, OverrideType.Visible, visible)!;
                    return { container: this.__symRef[0], over: override.over, v: override.v };
                }
        }
    }

    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        const propStr = propertyKey.toString();
        if (propStr === 'isVisible') {
            const o = findOverride(this.__symRef, this.__target.id, OverrideType.Visible);
            if (o && o.i === 0) {
                o.v.value = value;
                this.__visible = { value } // todo notify?
                return true;
            }
            throw new ForbiddenError("forbid set: " + propertyKey.toString());
        }
        if (propStr === 'rotation') {
            return Reflect.set(target, propertyKey, value, receiver);
        }
        if (propStr === 'isFlippedHorizontal') {
            return Reflect.set(target, propertyKey, value, receiver);
        }
        if (propStr === 'isFlippedVertical') {
            return Reflect.set(target, propertyKey, value, receiver);
        }
        return super.set(target, propertyKey, value, receiver);
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'isVirtualShape') return true;
        if (propStr === 'originId') return this.__origin.id;
        if (propStr === 'id') return this.__id;
        if (propStr === 'shapeId') return [this.__symRef[0].id, this.__refId];
        if (propStr === 'parent' || propStr === '__parent') return this.__parent;
        if (propStr === 'frame') { // 外面编辑需要修改，但又不可以修改target的
            return Reflect.get(target, propertyKey, receiver);
        }
        if (propStr === 'points') { // 外面编辑需要修改，但又不可以修改target的
            return Reflect.get(target, propertyKey, receiver);
        }
        if (propStr === 'style') {
            if (this.__style) return this.__style;
            this.__styleHdl = new StyleHdl(this.__symRef, this.__target, this.__target.style, this.__thisProxy!, this);
            this.__style = new Proxy<Style>(this.__target.style, this.__styleHdl);
            return this.__style;
        }
        if (propStr === 'symRefs') {
            return this.__symRef;
        }
        if (propStr === "isVisible") {
            if (this.__visible) return this.__visible.value;
            const o = findOverride(this.__symRef, this.__target.id, OverrideType.Visible);
            let visible = this.__target.isVisible;
            if (o) {
                visible = o.v.value as boolean;
                this.__target._watch_vars("visible", [o.v]);
            }
            this.__visible = { value: !!visible }
            return this.__visible.value;
        }
        if (propStr === "remove") {
            // 清除watch
            this.onRemoved();
            return;
        }
        if (propStr === 'override') {
            return this.override;
        }
        return super.get(target, propertyKey, receiver);
    }
}

class GroupShapeHdl extends ShapeHdl {
    // __thisProxy?: GroupShape; // 由外面赋值。proxy对象依赖于handler，需要实例化proxy后才能赋值
    __childs?: Shape[];

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'childs') {
            // 拷贝完即刻做proxy
            return Reflect.get(target, propertyKey, receiver);
        }
        return super.get(target, propertyKey, receiver);
    }

    origin_watcher(...args: any[]): void {
        super.origin_watcher(args);
        const childs = (this.__origin as GroupShape).childs;
        const _childs = (this.__target as GroupShape).childs;;
        if (_childs.length > childs.length) {
            // 回收多余的
            for (let i = childs.length, len = _childs.length; i < len; ++i) {
                (_childs[i] as any).remove;
            }
        }
        _childs.length = childs.length;
        for (let i = 0, len = childs.length; i < len; ++i) {
            const c = _childs[i]; // 可能undefined
            const origin = childs[i];
            if (c && (c as any).originId === origin.id) {
                continue;
            }
            if (c) (c as any).remove;
            _childs[i] = proxyShape2(copyShape(origin), this.__thisProxy!, origin, this.__symRef);
        }
    }

    onRemoved(): void {
        super.onRemoved();
        if (this.__childs) {
            this.__childs.forEach((c: any) => c.remove)
            this.__childs = undefined;
        }
    }
}

class SymbolRefHdl extends ShapeHdl {
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'virtualChilds' || propStr === 'naviChilds') {
            return Reflect.get(target, propertyKey, receiver);
        }
        return super.get(target, propertyKey, receiver);
    }

    checkRelayout(): boolean {
        if (super.checkRelayout()) return true;
        const childs = (this.__target as SymbolRefShape).__data?.childs ?? [];
        const _childs = (this.__target as SymbolRefShape).virtualChilds;
        let needRelayout: boolean = false;
        if (_childs) for (; ;) {
            if (_childs.length !== childs.length) {
                // 回收多余的
                needRelayout = true;
                break;
            }
            for (let i = 0, len = childs.length; i < len; ++i) {
                const c = _childs[i]; // 可能undefined
                const origin = childs[i];
                if (c && (c as any).originId === origin.id) {
                    continue;
                }
                needRelayout = true;
                break;
            }
            break;
        }
        return needRelayout;
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

const DefaultFontSize = Text.DefaultFontSize;
export function fixTextShapeFrameByLayout(text: Text, frame: ShapeFrame) {
    const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    switch (textBehaviour) {
        case TextBehaviour.FixWidthAndHeight: break;
        case TextBehaviour.Fixed:
            {
                const layout = text.getLayout();
                const fontsize = text.attr?.fontSize ?? DefaultFontSize;
                frame.height = Math.max(fontsize, layout.contentHeight);
                break;
            }
        case TextBehaviour.Flexible:
            {
                const layout = text.getLayout();
                const fontsize = text.attr?.fontSize ?? DefaultFontSize;
                frame.width = Math.max(fontsize, layout.contentWidth);
                frame.height = Math.max(fontsize, layout.contentHeight);
                break;
            }
    }
}

type TextShapeLike = Shape & { text: Text }

class TextShapeHdl extends ShapeHdl {

    private __text?: Text;

    override(type: OverrideType): { container: Shape, over: Override, v: Variable } | undefined {
        if (type === OverrideType.Text) {
            // todo stringvalue
            const o = findOverride(this.__symRef, this.__target.id, OverrideType.Text);
            if (o && o.i === 0) {
                // 如是stringValue需要处理
                if (o.v.value instanceof Text) return;
                // 需要个modify cmd
                // override value
                const text = createTextByString(o.v.value as string, this.__target as TextShapeLike);
                const _val = new Variable(uuid(), VariableType.Text, "");
                _val.value = text;
                const override = this.__symRef[0].addOverrid(o.v.id, OverrideType.Variable, _val)!;
                this.__text = undefined;
                return { container: this.__symRef[0], over: override.over, v: override.v };
            }
            let curText = (this.__target as TextShapeLike).text;
            const _ov = o?.v.value;
            if (_ov) curText = (typeof _ov) === 'string' ? createTextByString(_ov as string, this.__target as TextShapeLike) : _ov as Text;
            const text = importText(curText); // clone
            const override = this.__symRef[0].addOverrid(this.__refId, OverrideType.Text, text)!;
            this.__text = undefined;
            return { container: this.__symRef[0], over: override.over, v: override.v };
        }
        return super.override(type);
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();

        if (propStr === 'text') {
            if (this.__text) return this.__text;
            const o = findOverride(this.__symRef, this.__target.id, OverrideType.Text);
            if (o && o.i === 0) {
                const _ov = o.v.value;
                this.__target._watch_vars("text", [o.v]);
                if (_ov instanceof Text) {
                    _ov.updateSize(this.__target.frame.width, this.__target.frame.height);
                    this.__text = _ov;
                    return _ov;
                }
                const _text = createTextByString(_ov as string, this.__target as TextShapeLike);
                _text.updateSize(this.__target.frame.width, this.__target.frame.height);
                this.__text = new Proxy<Text>(_text, new FreezHdl(_text));
                return this.__text;
            }
            let curText = (this.__target as TextShapeLike).text;
            const _ov = o?.v.value;

            if (_ov) {
                curText = (typeof _ov) === 'string' ?
                    createTextByString(_ov as string, this.__target as TextShapeLike) :
                    _ov as Text;
                this.__target._watch_vars("text", [o.v]);
            }

            curText.updateSize(this.__target.frame.width, this.__target.frame.height);
            this.__text = new Proxy<Text>(curText, new FreezHdl(curText));
            return this.__text;
        }
        if (propStr === "frame") {
            // update frame size
            if (this.__text) {
                fixTextShapeFrameByLayout(this.__text, this.__target.frame);
            }
            return this.__target.frame;
        }

        return super.get(target, propertyKey, receiver);
    }
}

function createHandler(copy: Shape, parent: Shape, origin: Shape, symRefs: SymbolRefShape[]) {
    if (copy instanceof GroupShape) {
        return new GroupShapeHdl(symRefs, copy, parent, origin);
    }
    if (copy instanceof TextShape || copy instanceof OverrideShape) {
        return new TextShapeHdl(symRefs, copy as TextShapeLike, parent, origin);
    }
    if (copy instanceof SymbolRefShape) {
        copy.setSymbolMgr(symRefs[0].getSymbolMgr()!);
        copy.setImageMgr(symRefs[0].getImageMgr()!);
        return new SymbolRefHdl(symRefs, copy, parent, origin);
    }
    if (copy instanceof ImageShape || copy instanceof TableShape) {
        copy.setImageMgr(symRefs[0].getImageMgr()!);
    }
    return new ShapeHdl(symRefs, copy, parent, origin);
}

// function genCacheId(symRef: SymbolRefShape[]) {
//     let refId = "";
//     for (let i = 0, len = symRef.length; i < len; ++i) {
//         if (refId.length > 0) refId += "/";
//         refId += symRef[i].id;
//     }
//     return "__hdl@" + refId;
// }

// 适配左侧导航栏
// 需要cache
export function proxyShape2(shape: Shape, parent: Shape, origin: Shape, symRefs: SymbolRefShape[]): Shape {
    // const cacheId = genCacheId(symRefs); // 缓存proxy handler
    // let hdl = shape[cacheId];
    // if (!hdl) {
    //     hdl = createHandler(shape, parent, symRefs);
    //     shape[cacheId] = hdl;
    // }

    const hdl = createHandler(shape, parent, origin, symRefs);
    const ret = new Proxy<Shape>(shape, hdl);
    hdl.__thisProxy = ret;

    if (shape instanceof GroupShape) {
        const childs = shape.childs;
        const origin_childs = (origin as GroupShape).childs;
        for (let i = 0, len = childs.length; i < len; ++i) {
            childs[i] = proxyShape2(childs[i], ret, origin_childs[i], symRefs)
        }
    }
    // 缓存还有些问题，如ref对象删除时的回收、relayout无效


    return ret;
}