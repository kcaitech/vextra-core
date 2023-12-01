import { Basic, BasicMap, ResourceMgr, Watchable } from "./basic";
import {Style, Border, ContextSettings, BlendMode} from "./style";
import { Text } from "./text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";

export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D,
    CurvePoint, ShapeFrame, Ellipse, PathSegment, OverrideType, VariableType,
} from "./baseclasses";
import {
    ShapeType,
    CurvePoint,
    ShapeFrame,
    BoolOp,
    ExportOptions,
    ResizeType,
    PathSegment,
    OverrideType,
    VariableType
} from "./baseclasses"
import { Path } from "./path";
import { Matrix } from "../basic/matrix";
import { TextLayout } from "./textlayout";
import { parsePath } from "./pathparser";
import { RECT_POINTS } from "./consts";
import { uuid } from "../basic/uuid";
import { Variable } from "./variable";
export { Variable } from "./variable";

// todo
// 存在变量的地方：ref, symbol
// 在ref里，由proxy处理（监听所有变量的容器（ref, symbol））
// 在symbol，这是个普通shape, 绘制由绘制处理？（怎么处理的？监听所有的变量容器）
//   试图层可以获取，但更新呢？监听所有的变量容器

export class Shape extends Watchable(Basic) implements classes.Shape {

    typeId = 'shape'
    id: string
    type: ShapeType
    frame: ShapeFrame
    style: Style
    boolOp?: BoolOp
    isFixedToViewport?: boolean
    isFlippedHorizontal?: boolean
    isFlippedVertical?: boolean
    isLocked?: boolean
    isVisible?: boolean
    exportOptions?: ExportOptions
    name: string
    nameIsFixed?: boolean
    resizingConstraint?: number
    resizingType?: ResizeType
    rotation?: number
    constrainerProportions?: boolean
    clippingMaskMode?: number
    hasClippingMask?: boolean
    shouldBreakMaskChain?: boolean
    varbinds?: BasicMap<string, string>

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style
    ) {
        super()
        this.id = id
        this.name = name
        this.type = type
        this.frame = frame
        this.style = style
    }

    /**
     * for command
     */
    get shapeId(): (string | { rowIdx: number, colIdx: number })[] {
        return [this.id];
    }

    /**
     * for command
     */
    getTarget(targetId: (string | { rowIdx: number, colIdx: number })[]): Shape | Variable | undefined {
        return this;
    }

    get naviChilds(): Shape[] | undefined {
        return undefined;
    }

    get isVirtualShape() {
        return false;
    }

    get isSymbolShape() {
        return false;
    }

    /**
     * 不包含自己（如symbolref, symbol）
     */
    get varsContainer(): SymbolShape[] {
        if (this.isVirtualShape) {
            // 不会走到这里
            throw new Error('');
        }
        // this 有可能是ref symbol呢
        const varsContainer = [];
        let p: Shape | undefined = this.parent;
        while (p) {
            if (p instanceof SymbolShape) {
                varsContainer.push(p);
                if (p.parent instanceof SymbolShape) {
                    varsContainer.push(p.parent);
                }
                break; // 不会再有的了
            }
            p = p.parent;
        }
        return varsContainer.reverse();
    }

    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
        return new Path();
    }

    getPath(fixedRadius?: number): Path {
        return this.getPathOfFrame(this.frame, fixedRadius);
    }

    getPage(): Shape | undefined {
        let p: Shape | undefined = this;
        while (p && p.type !== ShapeType.Page) p = p.parent;
        return p;
    }

    get parent(): Shape | undefined {
        let p = this.__parent;
        while (p && !(p instanceof Shape)) p = p.parent;
        return p;
    }

    /**
     * @deprecated 这个坐标是没有经过旋转变换的
     * @returns
     */
    realXY(): { x: number, y: number, width: number, height: number } {
        return this.frame2Root();
    }

    /**
     * root: page 往上一级
     * @returns
     */
    frame2Root(): ShapeFrame {
        const frame = this.frame;
        const m = this.matrix2Root();
        const lt = m.computeCoord(0, 0);
        const rb = m.computeCoord(frame.width, frame.height);
        return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    }

    frame2Parent(): ShapeFrame {
        if (this.isNoTransform()) return this.frame;
        const frame = this.frame;
        const m = this.matrix2Parent();
        const lt = m.computeCoord(0, 0);
        const rb = m.computeCoord(frame.width, frame.height);
        return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    }

    /**
     * root: page 往上一级
     * @returns
     */
    matrix2Root() {
        let s: Shape | undefined = this;
        const m = new Matrix();
        while (s) {
            s.matrix2Parent(m);
            s = s.parent;
        }
        return m;
    }

    isNoTransform() {
        return !(this.rotation || this.isFlippedHorizontal || this.isFlippedVertical)
    }

    matrix2Parent(matrix?: Matrix) {
        const m = matrix || new Matrix();
        const frame = this.frame;
        if (this.isNoTransform()) {
            m.trans(frame.x, frame.y);
            return m;
        }
        const cx = frame.width / 2;
        const cy = frame.height / 2;
        m.trans(-cx, -cy);
        if (this.rotation) m.rotate(this.rotation / 360 * 2 * Math.PI);
        if (this.isFlippedHorizontal) m.flipHoriz();
        if (this.isFlippedVertical) m.flipVert();
        m.trans(cx, cy);
        m.trans(frame.x, frame.y);
        return m;
    }

    // private __boundingBox?: ShapeFrame;
    boundingBox(): ShapeFrame {
        if (this.isNoTransform()) return this.frame;
        const path = this.getPath();
        if (path.length > 0) {
            const m = this.matrix2Parent();
            path.transform(m);
            const bounds = path.calcBounds();
            return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        }

        const frame = this.frame;
        const m = this.matrix2Parent();
        const corners = [{ x: 0, y: 0 }, { x: frame.width, y: 0 }, { x: frame.width, y: frame.height }, {
            x: 0,
            y: frame.height
        }]
            .map((p) => m.computeCoord(p));
        const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
        const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
        const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
        const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
        return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
    }

    flipHorizontal() {
        this.isFlippedHorizontal = !this.isFlippedHorizontal;
    }

    flipVertical() {
        this.isFlippedVertical = !this.isFlippedVertical;
    }

    rotate(deg: number) {
        deg = deg % 360;
        this.rotation = deg;
    }

    setResizingConstraint(value: number) {
        this.resizingConstraint = value;
    }
    setContextSettingsOpacity(value: number) {
        if (!this.style.contextSettings) {
            this.style.contextSettings = new ContextSettings(BlendMode.Normal, 1);
        }
        this.style.contextSettings.opacity = value;
    }
    getBorderIndex(border: Border): number {
        return this.style.borders.findIndex(i => i === border);
    }

    setName(name: string) {
        this.name = name;
    }

    toggleVisible() {
        this.isVisible = !this.isVisible;
    }

    toggleLock() {
        this.isLocked = !this.isLocked;
    }

    setShapesConstrainerProportions(val: boolean) {
        this.constrainerProportions = val;
    }

    setFrameSize(w: number, h: number) {
        this.frame.width = w;
        this.frame.height = h;
    }

    setVisible(isVisible: boolean | undefined) {
        this.isVisible = isVisible;
    }

    findVar(varId: string, ret: Variable[]) {
        this.parent?.findVar(varId, ret);
    }

    findOverride(refId: string, type: OverrideType): Variable[] | undefined {
        return this.parent?.findOverride(refId, type);
    }

    getVisible(): boolean {
        if (!this.varbinds) return !!this.isVisible;
        if (this.isVirtualShape) return !!this.isVisible; // 由proxy处理

        const visibleVar = this.varbinds.get(OverrideType.Visible);
        if (!visibleVar) return !!this.isVisible;

        const _vars: Variable[] = [];
        this.findVar(visibleVar, _vars);
        // watch vars
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Visible) {
            return !!_var.value;
        }
        return !!this.isVisible;
    }

    onRemoved() {
    }
}

export class GroupShape extends Shape implements classes.GroupShape {
    typeId = 'group-shape';
    childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | TextShape)>
    wideframe: ShapeFrame
    isBoolOpShape?: boolean
    fixedRadius?: number

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | TextShape)>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.childs = childs;
        this.wideframe = new ShapeFrame(frame.x, frame.y, frame.width, frame.height);
        (childs as any).typeId = "childs";
    }

    get naviChilds(): Shape[] | undefined {
        return this.childs;
    }

    removeChild(shape: Shape): boolean {
        const idx = this.indexOfChild(shape);
        if (idx >= 0) {
            this.childs.splice(idx, 1);
        }
        return idx >= 0;
    }

    removeChildAt(idx: number): Shape | undefined {
        if (idx >= 0) {
            const del = this.childs.splice(idx, 1);
            if (del.length > 0) return del[0];
        }
        return undefined;
    }

    addChild(child: Shape) {
        this.childs.push(child);
    }

    /**
     *
     * @param child 返回带proxy的对象
     * @param idx
     * @returns
     */
    addChildAt(child: Shape, idx?: number): Shape {
        if (idx && idx > this.childs.length) {
            throw new Error("add child at outside index: " + idx + " , childs length: " + this.childs.length)
        }
        const index = idx ?? this.childs.length;
        this.childs.splice(index, 0, child);
        return this.childs[index];
    }

    indexOfChild(shape: Shape): number {
        return this.childs.findIndex((val) => {
            return val.id == shape.id
        })
    }

    findChildById(id: string): Shape | undefined {
        return this.childs.find((val) => {
            if (val.id == id) return val;
        })
    }

    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        let path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }

    getBoolOp(): { op: BoolOp, isMulti?: boolean } {
        if (!this.isBoolOpShape || this.childs.length === 0) return { op: BoolOp.None }
        const childs = this.childs;
        const op: BoolOp = childs[0].boolOp ?? BoolOp.None;
        for (let i = 1, len = childs.length; i < len; i++) {
            const op1 = childs[i].boolOp ?? BoolOp.None;
            if (op1 !== op) {
                return { op, isMulti: true }
            }
        }
        return { op }
    }

    setWideFrameSize(w: number, h: number) {
        this.wideframe.width = w;
        this.wideframe.height = h;
    }
}

/**
 * @deprecated
 */
export class FlattenShape extends GroupShape implements classes.FlattenShape {
}

function genRefId(refId: string, type: OverrideType) {
    if (type === OverrideType.Variable) return refId;
    return refId + '/' + type;
}

export class SymbolShape extends GroupShape implements classes.SymbolShape {

    static Default_State = "49751e86-9b2c-4d1b-81b0-36f19b5407d2"

    typeId = 'symbol-shape'
    variables: BasicMap<string, Variable> // 怎么做关联
    symtags?: BasicMap<string, string>
    overrides?: BasicMap<string, string> // 同varbinds，只是作用域为引用的symbol对象

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<Shape>,
        variables: BasicMap<string, Variable>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            childs
        )
        this.variables = variables;
        (variables as any).typeId = "variable";
    }

    getTarget(targetId: (string | { rowIdx: number, colIdx: number })[]): Shape | Variable | undefined {
        const id0 = targetId[0];
        if (typeof id0 === 'string' && id0.startsWith('varid:')) {
            const varid = id0.substring('varid:'.length);
            return this.getVar(varid);
        }
        return super.getTarget(targetId);
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
            case OverrideType.Visible: {
                let override = this.getOverrid(refId, attr);
                if (!override) {
                    override = this.createOverrid(refId, attr, value);
                }
                // override.v.value = value;
                return override;
            }
            case OverrideType.Variable: {
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

    addVar(v: Variable): Variable {
        if (!this.variables) this.variables = new BasicMap<string, Variable>();
        this.variables.set(v.id, v);
        return this.variables.get(v.id)!;
    }

    removeVar(key: string) {
        if (!this.variables) return false;
        // TODO 解绑
        return this.variables.delete(key);
    }
    deleteVar(varId: string) {
        if (this.variables) {
            this.variables.delete(varId);
        }
    }

    getVar(varId: string) {
        return this.variables && this.variables.get(varId);
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

    findOverride(refId: string, type: OverrideType): Variable[] | undefined {
        const override = this.getOverrid(refId, type);
        if (override) {
            const ret = [override.v];
            super.findVar(override.v.id, ret);
            return ret;
        }
        // if (this.isVirtualShape) {
        //     refId = this.originId + '/' + refId;
        // } else {
        //     refId = this.id + '/' + refId;
        // }
        return super.findOverride(refId, type);
    }

    setTag(k: string, v: string) {
        if (!this.symtags) this.symtags = new BasicMap<string, string>();
        this.symtags.set(k, v);
    }

    get isSymbolUnionShape() {
        return false;
    }
    get isSymbolShape() {
        return true;
    }
}

export class SymbolUnionShape extends SymbolShape implements classes.SymbolUnionShape {
    typeId = 'symbol-union-shape'
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<Shape>,
        variables: BasicMap<string, Variable>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            childs,
            variables
        )
    }

    get isSymbolUnionShape() {
        return true;
    }
}

export class PathShape extends Shape implements classes.PathShape {
    typeId = 'path-shape'
    points: BasicArray<CurvePoint>
    isClosed: boolean
    fixedRadius?: number

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint>,
        isClosed: boolean
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.points = points;
        this.isClosed = isClosed;
    }
    setClosedState(state: boolean) {
        this.isClosed = state;
    }
    // path shape
    get pointsCount() {
        return this.points.length;
    }

    getPointByIndex(idx: number) {
        return this.points[idx];
    }

    mapPoints<T>(f: (value: CurvePoint, index: number, array: CurvePoint[]) => T): T[] {
        return this.points.map(f);
    }

    /**
     *
     * @param fixedRadius shape自身的fixedRadius优先
     * @returns
     */
    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
        const offsetX = 0;
        const offsetY = 0;
        const width = frame.width;
        const height = frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;
        const path = parsePath(this.points, !!this.isClosed, offsetX, offsetY, width, height, fixedRadius);
        return new Path(path);
    }

    setRadius(radius: number): void {
        this.points.forEach((p) => p.radius = radius);
    }

    getRadius(): number[] {
        return this.points.map((p) => p.radius || 0);
    }
}

export class PathShape2 extends Shape implements classes.PathShape2 {
    typeId = 'path-shape2'
    pathsegs: BasicArray<PathSegment>
    fixedRadius?: number

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.pathsegs = pathsegs
    }

    // path shape
    get pointsCount() {
        return this.pathsegs.reduce((count, seg) => (count + seg.points.length), 0);
    }

    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
        const offsetX = 0;
        const offsetY = 0;
        const width = frame.width;
        const height = frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;
        const path: any[] = [];
        this.pathsegs.forEach((seg) => {
            path.push(...parsePath(seg.points, !!seg.isClosed, offsetX, offsetY, width, height, fixedRadius));
        });
        return new Path(path);
    }

    setRadius(radius: number): void {
        this.pathsegs.forEach((seg) => seg.points.forEach((p) => (p.radius = radius)));
    }

    getRadius(): number[] {
        return this.pathsegs.reduce((radius: number[], seg) => seg.points.reduce((radius, p) => {
            radius.push(p.radius || 0);
            return radius;
        }, radius), []);
    }
}

export class RectShape extends PathShape implements classes.RectShape {
    typeId = 'rect-shape'

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint>,
        isClosed: boolean
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
        )
        this.isClosed = true;
    }

    setRectRadius(lt: number, rt: number, rb: number, lb: number): void {
        const ps = this.points;
        if (ps.length === 4) {
            ps[0].radius = lt;
            ps[1].radius = rt;
            ps[2].radius = rb;
            ps[3].radius = lb;
        }
    }

    getRectRadius(): { lt: number, rt: number, rb: number, lb: number } {
        const ret = { lt: 0, rt: 0, rb: 0, lb: 0 };
        const ps = this.points;
        if (ps.length === 4) {
            ret.lt = ps[0].radius || 0;
            ret.rt = ps[1].radius || 0;
            ret.rb = ps[2].radius || 0;
            ret.lb = ps[3].radius || 0;
        }
        return ret;
    }
}

export class ImageShape extends RectShape implements classes.ImageShape {
    typeId = 'image-shape'
    imageRef: string;

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __cacheData?: { buff: Uint8Array, base64: string };

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint>,
        isClosed: boolean,
        imageRef: string
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
        )
        this.imageRef = imageRef
        this.isClosed = true;
    }

    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }

    private __startLoad: boolean = false;

    peekImage(startLoad: boolean = false) {
        const ret = this.__cacheData?.base64;
        if (ret) return ret;
        if (!this.imageRef) return "";
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            this.__imageMgr && this.__imageMgr.get(this.imageRef).then((val) => {
                if (!this.__cacheData) {
                    this.__cacheData = val;
                    if (val) this.notify();
                }
            })
        }
        return ret;
    }

    // image shape
    async loadImage(): Promise<string> {
        if (this.__cacheData) return this.__cacheData.base64;
        this.__cacheData = this.__imageMgr && await this.__imageMgr.get(this.imageRef)
        if (this.__cacheData) this.notify();
        return this.__cacheData && this.__cacheData.base64 || "";
    }
}

export class OvalShape extends PathShape implements classes.OvalShape {
    typeId = 'oval-shape'
    ellipse: classes.Ellipse

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint>,
        isClosed: boolean,
        ellipse: classes.Ellipse
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
        )
        this.ellipse = ellipse;
        this.isClosed = true;
    }
}

export class LineShape extends PathShape implements classes.LineShape {
    typeId = 'line-shape'

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint>,
        isClosed: boolean
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
        )
    }
}

export class TextShape extends Shape implements classes.TextShape {
    typeId = 'text-shape'
    text: Text
    fixedRadius?: number

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        text: Text
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.text = text
        text.updateSize(frame.width, frame.height);
    }

    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {

        const w = frame.width;
        const h = frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;
        if (fixedRadius) {
            const path = parsePath(RECT_POINTS, true, 0, 0, w, h, fixedRadius);
            return new Path(path);
        }

        const x = 0;
        const y = 0;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }

    setFrameSize(w: number, h: number) {
        super.setFrameSize(w, h);
        this.text.updateSize(this.frame.width, this.frame.height)
    }

    getLayout(): TextLayout {
        return this.text.getLayout();
    }

    getLayout2(width: number, height: number): TextLayout {
        return this.text.getLayout2(width, height);
    }

    getText(): Text {
        if (this.isVirtualShape) return this.text; // 走proxy
        if (!this.varbinds) return this.text;

        const textVar = this.varbinds.get(OverrideType.Text);
        if (!textVar) return this.text;

        const _vars: Variable[] = [];
        this.findVar(textVar, _vars);
        // watch vars
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Text) {
            return _var.value as Text; // 这要是string?
        }
        return this.text;
    }
}
export class CutoutShape extends PathShape implements classes.CutoutShape {
    typeId = 'cutout-shape'
    scalingStroke: boolean;
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint>,
        isClosed: boolean,
        scalingStroke: boolean
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
        )
        this.scalingStroke = scalingStroke;
        this.isClosed = true;
    }
}