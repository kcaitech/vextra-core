import { Border, Fill, Style } from "./style";
import { Text } from "./text";
import { BasicArray, Watchable } from "./basic";
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType, Variable, VariableType
} from "./baseclasses"
import { ShapeFrame, OverrideType, CurvePoint, TextBehaviour } from "./baseclasses"
import { GroupShape, Shape, TextShape } from "./shape";
import { importBorder, importCurvePoint, importFill, importText } from "./baseimport";
import { OverrideShape } from "./overrideshape";
import { SymbolRefShape } from "./symbolref";

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
        refId += symRef[i].id;
    }
    if (refId.length > 0) refId += "/";
    refId += shapeId;
    return refId;
}

export function findOverride(symRef: SymbolRefShape[], id: string, type: OverrideType) {

    for (let i = 0, len = symRef.length; i < len; ++i) {
        const getter = symRef[i];
        const refId = genRefId(symRef, id, i + 1);
        const override = getter.getOverrid(refId);
        if (!override) continue;
        switch (type) {
            case OverrideType.Borders:
                if (override.override_borders) return { override, i };
                break;
            case OverrideType.Fills:
                if (override.override_fills) return { override, i };
                break;
            case OverrideType.Image:
                if (override.override_image) return { override, i };
                break;
            case OverrideType.StringValue:
            case OverrideType.Text:
                if (override.override_text) return { override, i };
                break;
            case OverrideType.Visible:
                if (override.override_visible) return { override, i };
                break;
        }
    }
}

class StyleHdl extends FreezHdl {
    __symRef: SymbolRefShape[];
    __parent: Shape; // proxyed shape
    __parentHdl: ShapeHdl;
    __shape: Shape;
    __override?: OverrideShape; // 当前shape的override对象

    __fills?: Fill[];
    __borders?: Border[];

    constructor(symRef: SymbolRefShape[], shape: Shape, target: Style, parent: Shape, parentHdl: ShapeHdl) {
        super(target)
        this.__symRef = symRef;
        this.__shape = shape;
        this.__parent = parent;
        this.__parentHdl = parentHdl;
        // this.__override = symRef.getOverrid(shape.id);
    }
    private get _style(): Style {
        return this.__target as Style;
    }

    overrideFills(curFills: Fill[]): Fill[] { // 需要生成command
        const imgMgr = this.__symRef[0].getImageMgr();
        const fills = new BasicArray<Fill>();
        curFills.forEach((v) => {
            const fill = importFill(v);
            if (imgMgr) fill.setImageMgr(imgMgr);
            fills.push(fill);
        })
        this.__override = this.__symRef[0].addOverrid(genRefId(this.__symRef, this.__shape.id), OverrideType.Fills, fills)!;
        this.__parentHdl.updateOverrides(this.__override, OverrideType.Fills);
        this.__fills = undefined;
        return this.__override.style.fills;
    }

    overrideBorders(curBorders: Border[]): Border[] { // 需要生成command
        const borders = new BasicArray<Border>();
        curBorders.forEach((v) => {
            const border = importBorder(v);
            borders.push(border);
        })
        this.__override = this.__symRef[0].addOverrid(genRefId(this.__symRef, this.__shape.id), OverrideType.Borders, borders)!;
        this.__parentHdl.updateOverrides(this.__override, OverrideType.Borders);
        this.__borders = undefined;
        return this.__override.style.borders;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'parent' || propStr === '__parent') return this.__parent;
        if (propStr === 'overrideFills') {
            if (!this.__override) {
                this.__override = this.__symRef[0].getOverrid(this.__shape.id);
            }
            if (this.__override && this.__override.override_fills) {
                this.__parentHdl.updateOverrides(this.__override, OverrideType.Fills);
                return;
            }
            const o = findOverride(this.__symRef, this.__shape.id, OverrideType.Fills);
            let fills = (this.__target as Style).fills;
            if (o) fills = o.override.style.fills;
            return this.overrideFills(fills);
        }

        if (propStr === 'overrideBorders') {
            if (!this.__override) {
                this.__override = this.__symRef[0].getOverrid(this.__shape.id);
            }
            if (this.__override && this.__override.override_borders) {
                this.__parentHdl.updateOverrides(this.__override, OverrideType.Borders);
                return;
            }
            const o = findOverride(this.__symRef, this.__shape.id, OverrideType.Borders);
            let borders = (this.__target as Style).borders;
            if (o) borders = o.override.style.borders;
            return this.overrideBorders(borders);
        }

        if (propStr === 'fills') {
            if (this.__override && this.__override.override_fills) return this.__override.style.fills;
            if (this.__fills) return this.__fills;
            const o = findOverride(this.__symRef, this.__shape.id, OverrideType.Fills);
            let fills = (this.__target as Style).fills;
            if (o) {
                fills = o.override.style.fills;
                if (o.i === 0 && !this.__override) this.__override = o.override;
                this.__parentHdl.updateOverrides(o.override, OverrideType.Fills);
            }
            this.__fills = fills.map<Fill>((v) => new Proxy<Fill>(v, new FreezHdl(v)));
            return this.__fills;
        }
        if (propStr === 'borders') {
            if (this.__override && this.__override.override_borders) return this.__override.style.borders;
            if (this.__borders) return this.__borders;
            const o = findOverride(this.__symRef, this.__shape.id, OverrideType.Borders);
            let borders = (this.__target as Style).borders;
            if (o) {
                borders = o.override.style.borders;
                if (o.i === 0 && !this.__override) this.__override = o.override;
                this.__parentHdl.updateOverrides(o.override, OverrideType.Borders);
            }
            this.__borders = borders.map((v) => new Proxy<Border>(v, new FreezHdl(v)));
            return this.__borders;
        }
        return super.get(target, propertyKey, receiver);
    }
}

class ShapeHdl extends Watchable(FreezHdl) {
    __thisProxy?: Shape; // 由外面赋值。proxy对象依赖于handler，需要实例化proxy后才能赋值
    __symRef: SymbolRefShape[];
    __target: Shape;
    __parent: Shape;
    __style?: Style;

    // 布局相关属性
    __frame: ShapeFrame;
    __rotation: number;
    __isFlippedHorizontal: boolean;
    __isFlippedVertical: boolean;
    __points: CurvePoint[] | undefined;

    // overrides
    __overrides: { [key: string]: OverrideShape } = {}
    updateOverrides(override: OverrideShape, type: OverrideType) {
        const old = this.__overrides[type];
        if (old) {
            if (old.id === override.id) return;
            old.unwatch(this.override_watcher);
        }
        this.__overrides[type] = override;
        override.watch(this.override_watcher);
    }

    origin_watcher(...args: any[]) {

        // todo 布局属性更改后要重新布局
        // 
        super.notify(...args);
    }
    override_watcher(...args: any[]) {
        // todo
        super.notify(...args);
    }
    symref_watcher(...args: any[]) {
        super.notify(...args);
    }

    constructor(symRef: SymbolRefShape[], target: Shape, parent: Shape) {
        super(target);
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
        this.origin_watcher = this.origin_watcher.bind(this);
        this.override_watcher = this.override_watcher.bind(this);
        this.symref_watcher = this.symref_watcher.bind(this);

        // watch unwatch
        this.watch = this.watch.bind(this);
        this.unwatch = this.unwatch.bind(this);

        target.watch(this.origin_watcher);
        symRef.forEach((s) => s.watch(this.symref_watcher));

        const frame = target.frame;
        this.__frame = new ShapeFrame(frame.x, frame.y, frame.width, frame.height);

        this.__rotation = target.rotation ?? 0;
        this.__isFlippedHorizontal = target.isFlippedHorizontal ?? false;
        this.__isFlippedVertical = target.isFlippedVertical ?? false;

        this.__points = (target as any).points ? (target as any).points.map((p: CurvePoint) => importCurvePoint(p)) : undefined;
    }

    onRemoved() {
        this.__target.unwatch(this.origin_watcher);
        this.__symRef.forEach((s) => s.unwatch(this.symref_watcher));
        this.__overrides.keys.forEach((key: string) => this.__overrides[key].unwatch(this.override_watcher));
    }

    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        const propStr = propertyKey.toString();
        if (propStr === "isVisible") {
            let override = this.__symRef[0].getOverrid(this.__target.id);
            if (!override) {
                override = this.__symRef[0].addOverrid(genRefId(this.__symRef, this.__target.id), OverrideType.Visible, value)!;
            } else {
                override.override_visible = true;
                override.isVisible = value;
            }
            this.updateOverrides(override, OverrideType.Visible);
            return true;
        }
        if (propStr === 'rotation') {
            this.__rotation = value;
            return true;
        }
        if (propStr === 'isFlippedHorizontal') {
            this.__isFlippedHorizontal = value;
            return true;
        }
        if (propStr === 'isFlippedVertical') {
            this.__isFlippedVertical = value;
            return true;
        }
        return super.set(target, propertyKey, value, receiver);
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'id') return this.__symRef[0].mapId(this.__target.id);
        if (propStr === 'shapeId') return [this.__symRef[0].id, this.__target.id];
        if (propStr === 'parent' || propStr === '__parent') return this.__parent;
        if (propStr === 'frame') { // 外面编辑需要修改，但又不可以修改target的
            return this.__frame;
        }
        if (propStr === 'style') {
            if (this.__style) return this.__style;
            this.__style = new Proxy<Style>(this.__target.style, new StyleHdl(this.__symRef, this.__target, this.__target.style, this.__thisProxy!, this));
            return this.__style;
        }
        if (propStr === 'overridesGetter') {
            return this.__symRef;
        }
        if (propStr === "isVisible") {
            const o = findOverride(this.__symRef, this.__target.id, OverrideType.Visible);
            const override = o?.override;
            if (override && override.override_visible) {
                this.updateOverrides(override, OverrideType.Visible);
                return override.isVisible;
            }
            return this.__target.isVisible;
        }
        if (propStr === 'rotation') {
            return this.__rotation;
        }
        if (propStr === 'isFlippedHorizontal') {
            return this.__isFlippedHorizontal;
        }
        if (propStr === 'isFlippedVertical') {
            return this.__isFlippedVertical;
        }
        if (propStr === 'points') {
            return this.__points;
        }
        if (propStr === "remove") {
            // 清除watch
            this.onRemoved();
            return;
        }
        if (propStr === "watch") {
            return this.watch;
        }
        if (propStr === "unwatch") {
            return this.unwatch;
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
            if (this.__childs) return this.__childs;
            this.__childs = (this.__target as GroupShape).childs.map((child) => proxyShape(child, this.__thisProxy!, this.__symRef));
            return this.__childs;
        }
        return super.get(target, propertyKey, receiver);
    }

    origin_watcher(...args: any[]): void {
        super.origin_watcher(args);
        if (this.__childs) {
            // todo compare

            this.__childs.forEach((c: any) => c.remove)
            this.__childs = undefined;
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
    // __thisProxy?: SymbolRefShape; // 由外面赋值。proxy对象依赖于handler，需要实例化proxy后才能赋值
    __childs?: Shape[];

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'virtualChilds') {
            if (this.__childs) return this.__childs;
            this.__childs = (this.__target as SymbolRefShape).getVirtualChilds(this.__symRef, this.__thisProxy as SymbolRefShape);
            return this.__childs;
        }
        return super.get(target, propertyKey, receiver);
    }

    origin_watcher(...args: any[]): void {
        super.origin_watcher(args);
        if (this.__childs) {
            // todo compare

            this.__childs.forEach((c: any) => c.remove)
            this.__childs = undefined;
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

class TextShapeHdl extends ShapeHdl {

    __override: OverrideShape | undefined;
    __text: Text;
    __freezText?: Text;

    constructor(symRef: SymbolRefShape[], target: TextShape, parent: Shape) {
        super(symRef, target, parent);
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
        this.__text = new Proxy<Text>(target.text, new FreezHdl(target.text));
    }

    overrideText(curText: Text): Text { // 需要生成command
        const text = importText(curText); // clone
        this.__override = this.__symRef[0].addOverrid(genRefId(this.__symRef, this.__target.id), OverrideType.Text, text)!;
        return this.__override.text!;
    }

    getText() {
        if (this.__override &&
            this.__override.override_text &&
            this.__override.text) return this.__override.text;

        const o = findOverride(this.__symRef, this.__target.id, OverrideType.Text);
        if (!o) return this.__text;

        this.updateOverrides(o.override, OverrideType.Text);

        if (!this.__override && o.i === 0) {
            // first 
            this.__override = o.override;
            if (this.__override.override_text &&
                this.__override.text) return this.__override.text;
        }

        // get override text
        const text = o.override.getText(this.__target);
        if (text) {
            if (!this.__freezText) {
                this.__freezText = new Proxy<Text>(text, new FreezHdl(text));
            }
            return this.__freezText;
        }
        return this.__text;
    }

    // todo frame不对

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();

        if (propStr === 'text') {
            const text = this.getText();
            text.updateSize(this.__frame.width, this.__frame.height);
            // todo 更新frame大小
            const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
            if (textBehaviour === TextBehaviour.Flexible) {
                // update width & height
                const layout = text.getLayout();
                this.__frame.width = layout.contentWidth;
                this.__frame.height = layout.contentHeight;
            }
            else if (textBehaviour === TextBehaviour.Fixed) {
                // update height
                const layout = text.getLayout();
                this.__frame.height = layout.contentHeight;
            }
            return text;
        }

        if (propStr === 'overrideText') {
            if (this.__override && this.__override.override_text && this.__override.text) return;
            let curText = (this.__target as TextShape).text;

            const o = findOverride(this.__symRef, this.__target.id, OverrideType.Text);
            if (o) {
                if (!this.__override && o.i === 0) {
                    // first 
                    this.__override = o.override;
                    if (this.__override.override_text &&
                        this.__override.text) return;
                }
                const text = o.override.getText(this.__target);
                if (text) curText = text;
            }

            return this.overrideText(curText);
        }

        return super.get(target, propertyKey, receiver);
    }
}

// 适配左侧导航栏
// 需要cache
export function proxyShape(shape: Shape, parent: Shape, symRefs: SymbolRefShape[]): Shape {

    if (shape instanceof GroupShape) {
        const hdl = new GroupShapeHdl(symRefs, shape, parent);
        const ret = new Proxy<GroupShape>(shape, hdl);
        hdl.__thisProxy = ret;
        return ret;
    }

    if (shape instanceof TextShape) {
        const hdl = new TextShapeHdl(symRefs, shape, parent);
        const ret = new Proxy<TextShape>(shape, hdl)
        hdl.__thisProxy = ret;
        return ret;
    }

    if (shape instanceof SymbolRefShape) {
        const hdl = new SymbolRefHdl(symRefs, shape, parent);
        const ret = new Proxy<SymbolRefShape>(shape, hdl);
        hdl.__thisProxy = ret;
        return ret;
    }

    const hdl = new ShapeHdl(symRefs, shape, parent);
    const ret = new Proxy<Shape>(shape, hdl)
    hdl.__thisProxy = ret;
    return ret;
}