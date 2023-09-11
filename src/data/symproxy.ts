import { Border, Fill, Style } from "./style";
import { Text } from "./text";
import { BasicArray } from "./basic";
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType, Variable, VariableType
} from "./baseclasses"
import { ShapeFrame, OverrideType } from "./baseclasses"
import { GroupShape, Shape, TextShape } from "./shape";
import { importBorder, importFill, importText } from "./baseimport";
import { OverrideShape } from "./overrideshape";
import { SymbolRefShape } from "./symbolref";

export class ForbiddenError extends Error { }

class FreezHdl {
    __target: Object;
    constructor(target: Object) {
        this.__target = target;
    }
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        throw new ForbiddenError("forbidden");
    }
    deleteProperty(target: object, propertyKey: PropertyKey): boolean {
        throw new ForbiddenError("forbidden");
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

class StyleHdl extends FreezHdl {
    __symRef: SymbolRefShape;
    __shape: Shape;
    __override?: OverrideShape;
    constructor(symRef: SymbolRefShape, shape: Shape, target: Style) {
        super(target)
        this.__symRef = symRef;
        this.__shape = shape;
        this.__override = symRef.getOverrid(shape.id);
    }
    private get _style(): Style {
        return this.__target as Style;
    }

    overrideFills(curFills: Fill[]): Fill[] { // 需要生成command
        const imgMgr = this.__symRef.getImageMgr();
        const fills = new BasicArray<Fill>();
        curFills.forEach((v) => {
            const fill = importFill(v);
            if (imgMgr) fill.setImageMgr(imgMgr);
            fills.push(fill);
        })
        this.__override = this.__symRef.addOverrid(this.__shape.id, OverrideType.Fills, fills);
        return this.__override.style.fills;
    }

    overrideBorders(curBorders: Border[]): Border[] { // 需要生成command
        const borders = new BasicArray<Border>();
        curBorders.forEach((v) => {
            const border = importBorder(v);
            borders.push(border);
        })
        this.__override = this.__symRef.addOverrid(this.__shape.id, OverrideType.Borders, borders);
        return this.__override.style.borders;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();

        if (propStr === 'overrideFills') {
            if (!this.__override) {
                this.__override = this.__symRef.getOverrid(this.__shape.id);
            }
            if (this.__override && this.__override.override_fills) return;
            return this.overrideFills((this.__target as Style).fills);
        }

        if (propStr === 'overrideBorders') {
            if (!this.__override) {
                this.__override = this.__symRef.getOverrid(this.__shape.id);
            }
            if (this.__override && this.__override.override_borders) return;
            return this.overrideBorders((this.__target as Style).borders);
        }

        if (propStr === 'fills') {
            if (this.__override && this.__override.override_fills) return this.__override.style.fills;
            return this._style.fills.map((v) => new Proxy(v, new FreezHdl(v)));
        }
        if (propStr === 'borders') {
            if (this.__override && this.__override.override_borders) return this.__override.style.borders;
            return this._style.borders.map((v) => new Proxy(v, new FreezHdl(v)));
        }
        return super.get(target, propertyKey, receiver);
    }
}

class ShapeHdl extends FreezHdl {
    __symRef: SymbolRefShape;
    __target: Shape;
    __parent: Shape;
    __tmpframe?: ShapeFrame;

    constructor(symRef: SymbolRefShape, target: Shape, parent: Shape) {
        super(target);
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
    }

    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        const propStr = propertyKey.toString();
        if (propStr === "isVisible") {
            let override = this.__symRef.getOverrid(this.__target.id);
            if (!override) {
                this.__symRef.addOverrid(this.__target.id, OverrideType.Visible, value);
            }
            else {
                override.override_visible = true;
                override.isVisible = value;
            }
            return true;
        }
        throw new ForbiddenError("forbidden");
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'shapeId') return [this.__symRef.id, this.__target.id];
        if (propStr === 'parent') return this.__parent;
        if (propStr === 'frame') {
            const frame = this.__target.frame;
            if (!this.__tmpframe) this.__tmpframe = new ShapeFrame(0, 0, 0, 0);
            this.__tmpframe.x = frame.x;
            this.__tmpframe.y = frame.y;
            this.__tmpframe.width = frame.width;
            this.__tmpframe.height = frame.height;
            return this.__tmpframe;
        }
        if (propStr === 'style') {
            return new Proxy(this.__target.style, new StyleHdl(this.__symRef, this.__target, this.__target.style));
        }
        if (propStr === 'overridesGetter') {
            return this.__symRef;
        }
        if (propStr === "isVisible") {
            const override = this.__symRef.getOverrid(this.__target.id);
            if (override && override.override_visible) return override.isVisible;
            return this.__target.isVisible;
        }
        return super.get(target, propertyKey, receiver);
    }
}

class GroupShapeHdl extends ShapeHdl {
    __this?: GroupShape;

    constructor(symRef: SymbolRefShape, target: GroupShape, parent: Shape) {
        super(symRef, target, parent);
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'childs') return (this.__target as GroupShape).childs.map((child) => proxyShape(child, this.__this!, this.__symRef));
        return super.get(target, propertyKey, receiver);
    }
}

class TextShapeHdl extends ShapeHdl {

    __override: OverrideShape | undefined;
    __text: Text;
    __stringValueText?: Text;

    constructor(symRef: SymbolRefShape, target: TextShape, parent: Shape, override: OverrideShape | undefined) {
        super(symRef, target, parent);
        this.__symRef = symRef;
        this.__target = target;
        this.__parent = parent;
        this.__override = override;
        this.__text = new Proxy<Text>(target.text, new FreezHdl(target.text));
    }

    overrideText(curText: Text): Text { // 需要生成command
        const text = importText(curText); // clone
        this.__override = this.__symRef.addOverrid(this.__target.id, OverrideType.Text, text);
        return this.__override.text!;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();

        if (propStr === 'text') {
            if (this.__override && this.__override.text) return this.__override.text;

            const text = this.__override?.getText(this.__target);
            if (text) {
                if (!this.__stringValueText) {
                    this.__stringValueText = new Proxy<Text>(text, new FreezHdl(text));
                }
                return this.__stringValueText;
            }

            return this.__text;
        }

        if (propStr === 'overrideText') {
            if (this.__override && this.__override.text) return;
            let curText = (this.__target as TextShape).text;
            if (this.__override) {
                const text = this.__override.getText(this.__target);
                curText = text ?? (this.__target as TextShape).text;
            }
            return this.overrideText(curText);
        }

        return super.get(target, propertyKey, receiver);
    }
}

// 适配左侧导航栏
export function proxyShape(shape: Shape, parent: Shape, root: SymbolRefShape): Shape {

    if (shape instanceof GroupShape) {
        const hdl = new GroupShapeHdl(root, shape, parent);
        const ret = new Proxy<GroupShape>(shape, hdl);
        // hdl.__childs = shape.childs.map((child) => proxyShape(child, ret, root));
        hdl.__this = ret;
        return ret;
    }

    if (shape instanceof TextShape) {
        const override = root.getOverrid(shape.id);
        const ret = new Proxy<TextShape>(shape, new TextShapeHdl(root, shape, parent, override))
        return ret;
    }

    const ret = new Proxy<Shape>(shape, new ShapeHdl(root, shape, parent))
    return ret;
}