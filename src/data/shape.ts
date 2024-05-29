import { Basic, BasicArray, BasicMap, ResourceMgr } from "./basic";
import { BlendMode, Border, ContextSettings, Style } from "./style";
import { Text } from "./text";
import * as classes from "./baseclasses"
import {
    BoolOp,
    CornerRadius,
    CurveMode,
    CurvePoint,
    ExportOptions,
    OverrideType,
    PathSegment,
    ResizeType,
    ShapeFrame,
    ShapeType,
    Transform,
    VariableType,
    ShapeSize,
} from "./baseclasses"
import { Path } from "./path";
import { Matrix } from "../basic/matrix";
import { TextLayout } from "./textlayout";
import { parsePath } from "./pathparser";
import { FrameType, PathType, RadiusType, RECT_POINTS } from "./consts";
import { Variable } from "./variable";
import {getShapeTransform2} from "./shape_transform2_util";

export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D,
    CurvePoint, ShapeFrame, Ellipse, PathSegment, OverrideType, VariableType,
    FillRule, CornerRadius, Transform, ShapeSize
} from "./baseclasses";

export { Variable } from "./variable";

// todo
// 存在变量的地方：ref, symbol
// 在ref里，由proxy处理（监听所有变量的容器（ref, symbol））
// 在symbol，这是个普通shape, 绘制由绘制处理？（怎么处理的？监听所有的变量容器）
//   试图层可以获取，但更新呢？监听所有的变量容器

export class MyTransform extends Transform {
    get translateX() {
        return this.m02;
    }

    set translateX(x: number) {
        this.m02 = x;
    }

    get translateY() {
        return this.m12;
    }

    set translateY(y: number) {
        this.m12 = y;
    }
}

export class Shape extends Basic implements classes.Shape {

    // watchable, 使用Watchable会导致语法检查失效
    public __watcher: Set<((...args: any[]) => void)> = new Set();

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
        if (this.__watcher.size > 0) {
            // 在set的foreach内部修改set会导致无限循环
            Array.from(this.__watcher).forEach(w => {
                w(...args);
            });
        }
        this.parent?.bubblenotify(...args);
    }

    private __bubblewatcher: Set<((...args: any[]) => void)> = new Set();

    public bubblewatch(watcher: ((...args: any[]) => void)): (() => void) {
        this.__bubblewatcher.add(watcher);
        return () => {
            this.__bubblewatcher.delete(watcher);
        };
    }

    public bubbleunwatch(watcher: ((...args: any[]) => void)): boolean {
        return this.__bubblewatcher.delete(watcher);
    }

    public bubblenotify(...args: any[]) {
        if (this.__bubblewatcher.size > 0) {
            // 在set的foreach内部修改set会导致无限循环
            Array.from(this.__bubblewatcher).forEach(w => {
                w(...args);
            });
        }
        this.parent?.bubblenotify(...args);
    }

    getCrdtPath(): string[] {
        const page = this.getPage();
        if (page && page !== this) return [page.id, this.id];
        else return [this.id];
    }

    getOpTarget(path: string[]): any {
        const id0 = path[0];
        if (id0 === 'style') return this.style.getOpTarget(path.slice(1));
        if (id0 === 'varbinds' && !this.varbinds) this.varbinds = new BasicMap();
        if (id0 === "exportOptions" && !this.exportOptions) this.exportOptions = new ExportOptions(new BasicArray(), 0, false, false, false, false);
        return super.getOpTarget(path);
    }

    // shape
    typeId = 'shape'
    crdtidx: BasicArray<number>
    id: string
    type: ShapeType
    // frame: ShapeFrame
    style: Style
    transform: MyTransform
    size: ShapeSize
    boolOp?: BoolOp
    isFixedToViewport?: boolean
    isLocked?: boolean
    isVisible?: boolean
    exportOptions?: ExportOptions
    name: string
    nameIsFixed?: boolean
    resizingConstraint?: number
    resizingType?: ResizeType
    constrainerProportions?: boolean
    clippingMaskMode?: number
    hasClippingMask?: boolean
    shouldBreakMaskChain?: boolean
    varbinds?: BasicMap<string, string>

    haveEdit?: boolean | undefined

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.name = name
        this.type = type
        this.transform = new MyTransform(transform.m00, transform.m01, transform.m02, transform.m10, transform.m11, transform.m12)
        this.size = size
        this.style = style
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

    get frame(): ShapeFrame {
        const transform2 = getShapeTransform2(this.transform);
        const trans = transform2.decomposeTranslate();
        const scale = transform2.decomposeScale();
        const width = Math.abs(this.size.width * scale.x);
        const height = Math.abs(this.size.height * scale.y);
        const frame = new ShapeFrame(trans.x, trans.y, width, height);
        Object.freeze(frame);
        return frame;
    }

    get rotation(): number {
        return getShapeTransform2(this.transform).decomposeEuler().z * 180 / Math.PI;
    }

    get isFlippedHorizontal(): boolean {
        return getShapeTransform2(this.transform).isFlipH;
    }

    get isFlippedVertical(): boolean {
        return getShapeTransform2(this.transform).isFlipV
    }

    get skewX(): number {
        return getShapeTransform2(this.transform).decomposeSkew().x * 180 / Math.PI;
    }

    get skewY(): number {
        return getShapeTransform2(this.transform).decomposeSkew().y * 180 / Math.PI;
    }

    getPathOfFrame(frame: ShapeSize, fixedRadius?: number): Path {
        return new Path();
    }

    getPath(fixedRadius?: number): Path {
        return this.getPathOfFrame(this.size, fixedRadius);
    }

    getPathStr(fixedRadius?: number): string {
        return this.getPath(fixedRadius).toString();
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
        const frame = this.size;
        const m = this.matrix2Root();
        const lt = m.computeCoord(0, 0);
        const rb = m.computeCoord(frame.width, frame.height);
        return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    }

    frame2Parent(): ShapeFrame {
        if (this.isNoTransform()) {
            return new ShapeFrame(0, 0, this.size.width, this.size.height);
        }
        const frame = this.size;
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
        const t = this.transform;
        return t.m00 == 1 && t.m01 === 0 && t.m10 === 0 && t.m11 === 1;
    }

    matrix2Parent(matrix?: Matrix) {
        const t = this.transform;
        const m = new Matrix(t.m00, t.m10, t.m01, t.m11, t.m02, t.m12);
        if (!matrix) return m;
        matrix.multiAtLeft(m);
        return matrix;
    }

    // private __boundingBox?: ShapeFrame;
    boundingBox(): ShapeFrame {
        if (this.isNoTransform()) return new ShapeFrame(0, 0, this.size.width, this.size.height);
        const path = this.getPath();
        if (path.length > 0) {
            const m = this.matrix2Parent();
            path.transform(m);
            const bounds = path.calcBounds();
            return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        }

        const frame = this.size;
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

    /**
     * @description 无论是否transform都进行Bounds计算并返回
     */
    boundingBox2(): ShapeFrame {
        const path = this.getPath();
        if (path.length > 0) {
            const m = this.matrix2Parent();
            path.transform(m);
            const bounds = path.calcBounds();
            return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        }

        const frame = this.size;
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

    /**
     * @description 保留transform的前提下计算基于自身坐标的Bounds并返回
     */
    boundingBox3(): ShapeFrame | undefined {
        const path = this.getPath();
        if (path.length > 0) {
            const bounds = path.calcBounds();
            return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        }
    }

    getBorderIndex(border: Border): number {
        return this.style.borders.findIndex(i => i === border);
    }

    findVar(varId: string, ret: Variable[]) {
        this.parent?.findVar(varId, ret);
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

    onAdded() {
    }

    onRemoved() {
    }

    getFills() {
        return this.style.fills;
    }

    getBorders() {
        return this.style.borders;
    }

    getShadows() {
        return this.style.shadows;
    }

    get isNoSupportDiamondScale() {  // 默认都支持压扁缩放
        return false;
    }

    get frameType() {
        return FrameType.Path;
    }

    get isContainer() { // 容器类元素: 页面、容器、组件、组件Union
        return false;
    }

    get pathType() {
        return PathType.Editable;
    }

    get isPathIcon() { // 根据路径绘制图标
        return true;
    }

    get radius(): number[] {
        return [0];
    }

    get radiusType() {
        return RadiusType.None;
    }

    get isClosed() {
        return true;
    }

    get isStraight() {
        return false;
    }
}

export class GroupShape extends Shape implements classes.GroupShape {
    typeId = 'group-shape';
    childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>
    fixedRadius?: number

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style
        )
        this.childs = childs;
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

    getPathOfFrame(frame: ShapeSize, fixedRadius?: number): Path {
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

    get isNoSupportDiamondScale() {
        return true;
    }

    get frameType() {
        return FrameType.Flex;
    }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }

    get radiusType() {
        return RadiusType.Fixed;
    }
}

export class BoolShape extends GroupShape implements classes.BoolShape {
    typeId = 'bool-shape'

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        childs: BasicArray<(GroupShape | Shape)>
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.BoolShape,
            transform,
            size,
            style,
            childs
        )
    }

    getBoolOp(): { op: BoolOp, isMulti?: boolean } {
        if (this.childs.length === 0) return { op: BoolOp.None }
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

    get isPathIcon() {
        return true;
    }
}

// export function genRefId(refId: string, type: OverrideType) {
//     if (type === OverrideType.Variable) return refId;
//     return refId + '/' + type;
// }

export function getPathOfRadius(frame: ShapeSize, cornerRadius?: CornerRadius, fixedRadius?: number): Path {
    const w = frame.width;
    const h = frame.height;

    const haRadius = fixedRadius ||
        (cornerRadius &&
            (cornerRadius.lt > 0 ||
                cornerRadius.lb > 0 ||
                cornerRadius.rb > 0 ||
                cornerRadius.rt > 0))

    if (!haRadius) {
        const path = [
            ["M", 0, 0],
            ["l", w, 0],
            ["l", 0, h],
            ["l", -w, 0],
            ["z"]
        ]
        return new Path(path);
    }

    const maxRadius = Math.min(w / 2, h / 2);
    let lt, lb, rt, rb;
    if (fixedRadius) {
        fixedRadius = Math.min(fixedRadius, maxRadius);
        fixedRadius = Math.max(0, fixedRadius);
        lt = lb = rt = rb = fixedRadius;
    } else {
        lt = cornerRadius!.lt;
        lb = cornerRadius!.lb;
        rt = cornerRadius!.rt;
        rb = cornerRadius!.rb;
        lt = Math.max(0, Math.min(lt, maxRadius));
        lb = Math.max(0, Math.min(lb, maxRadius));
        rt = Math.max(0, Math.min(rt, maxRadius));
        rb = Math.max(0, Math.min(rb, maxRadius));
    }

    // const path = [];
    // path.push(["M", lt, 0]);
    // path.push(["l", w - lt - rt, 0]);
    // if (rt > 0) {
    //     path.push(["c", rt, 0, 0, 0, 0, rt]);
    // }
    // path.push(["l", 0, h - rt - rb]);
    // if (rb > 0) {
    //     path.push(["c", 0, rb, 0, 0, -rb, 0]);
    // }
    // path.push(["l", -w + lb + rb, 0]);
    // if (lb > 0) {
    //     path.push(["c", -lb, 0, 0, 0, 0, -lb]);
    // }
    //
    // if (lt > 0) {
    //     path.push(["l", 0, -h + lt + lb]);
    //     path.push(["c", 0, -lt, 0, 0, lt, 0]);
    // }
    //
    // path.push(["z"]);

    const p1 = new CurvePoint([] as any, '', 0, 0, CurveMode.Straight);
    const p2 = new CurvePoint([] as any, '', 1, 0, CurveMode.Straight);
    const p3 = new CurvePoint([] as any, '', 1, 1, CurveMode.Straight);
    const p4 = new CurvePoint([] as any, '', 0, 1, CurveMode.Straight);

    if (lt > 0) {
        p1.radius = lt;
    }
    if (rt > 0) {
        p2.radius = rt;
    }
    if (rb > 0) {
        p3.radius = rb;
    }
    if (lb > 0) {
        p4.radius = lb;
    }

    return new Path(parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, w, h, fixedRadius));
}

export class SymbolShape extends GroupShape implements classes.SymbolShape {

    static Default_State = "49751e86-9b2c-4d1b-81b0-36f19b5407d2"

    typeId = 'symbol-shape'
    variables: BasicMap<string, Variable> // 怎么做关联
    symtags?: BasicMap<string, string>
    cornerRadius?: CornerRadius

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        childs: BasicArray<Shape>,
        variables: BasicMap<string, Variable>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style,
            childs
        )
        this.variables = variables;
    }

    getOpTarget(path: string[]): any {
        if (path[0] === 'symtags' && !this.symtags) this.symtags = new BasicMap<string, string>();
        if (path[0] === 'cornerRadius' && !this.cornerRadius) this.cornerRadius = new CornerRadius(0, 0, 0, 0);
        return super.getOpTarget(path);
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

    get isContainer() {
        return true;
    }

    getPathOfFrame(frame: ShapeSize, fixedRadius?: number | undefined): Path {
        return getPathOfRadius(frame, this.cornerRadius, fixedRadius);
    }

    get radius(): number[] {
        return [
            this.cornerRadius?.lt || 0,
            this.cornerRadius?.rt || 0,
            this.cornerRadius?.rb || 0,
            this.cornerRadius?.lb || 0,
        ];
    }

    get radiusType() {
        return RadiusType.Rect;
    }
}

export class SymbolUnionShape extends SymbolShape implements classes.SymbolUnionShape {
    typeId = 'symbol-union-shape'

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        childs: BasicArray<Shape>,
        variables: BasicMap<string, Variable>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style,
            childs,
            variables
        )
    }

    get isSymbolUnionShape() {
        return true;
    }

    get isContainer() {
        return true;
    }
}

export class PathShape extends Shape implements classes.PathShape {
    typeId = 'path-shape'
    pathsegs: BasicArray<PathSegment>
    fixedRadius?: number

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        pathsegs: BasicArray<PathSegment>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style
        );

        this.pathsegs = pathsegs;
    }

    getPathOfFrame(frame: ShapeSize, fixedRadius?: number): Path {
        // const offsetX = 0;
        // const offsetY = 0;
        const width = frame.width;
        const height = frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;

        const path: any[] = [];
        this.pathsegs.forEach((seg) => {
            path.push(...parsePath(seg.points, seg.isClosed, width, height, fixedRadius));
        });

        return new Path(path);
    }

    // setRadius(radius: number): void {
    //     this.points.forEach((p) => p.radius = radius);
    // }

    // get radius(): number[] {
    //     return this.points.map((p) => p.radius || 0);
    // }

    get radius(): number[] {
        return this.pathsegs.reduce((radius: number[], seg) => seg.points.reduce((radius, p) => {
            radius.push(p.radius || 0);
            return radius;
        }, radius), []);
    }

    get radiusType(): RadiusType {
        return RadiusType.Fixed;
    }

    get isStraight(): boolean {
        if (this.pathsegs.length !== 1) return false;
        const points = this.pathsegs[0].points;
        if (points.length !== 2) return false;
        const start = points[0];
        const end = points[1];

        return !start.hasFrom && !end.hasTo;
    }
}

export class PathShape2 extends Shape implements classes.PathShape2 {
    typeId = 'path-shape2'
    pathsegs: BasicArray<PathSegment>
    fixedRadius?: number

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        pathsegs: BasicArray<PathSegment>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style
        )
        this.pathsegs = pathsegs
    }

    getPathOfFrame(frame: ShapeSize, fixedRadius?: number): Path {
        // const offsetX = 0;
        // const offsetY = 0;
        const width = frame.width;
        const height = frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;

        const path: any[] = [];
        this.pathsegs.forEach((seg) => {
            path.push(...parsePath(seg.points, seg.isClosed, width, height, fixedRadius));
        });

        return new Path(path);
    }

    get radius(): number[] {
        return this.pathsegs.reduce((radius: number[], seg) => seg.points.reduce((radius, p) => {
            radius.push(p.radius || 0);
            return radius;
        }, radius), []);
    }

    get pathType() {
        return PathType.Editable;
    }

    get radiusType() {
        return (this.pathsegs.length === 1 && this.pathsegs[0].points.length === 4 && this.pathsegs[0].isClosed)
            ? RadiusType.Rect
            : RadiusType.Fixed;
    }
}

export class RectShape extends PathShape implements classes.RectShape {
    typeId = 'rect-shape'

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        pathsegs: BasicArray<PathSegment>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style,
            pathsegs
        )
    }

    get radiusType() {
        return this.haveEdit ? RadiusType.Fixed : RadiusType.Rect;
    }
}

export class ImageShape extends RectShape implements classes.ImageShape {
    typeId = 'image-shape'
    imageRef: string;

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __cacheData?: { buff: Uint8Array, base64: string };

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        pathsegs: BasicArray<PathSegment>,
        imageRef: string
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style,
            pathsegs
        )

        this.imageRef = imageRef
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

    get isNoSupportDiamondScale() {
        return true;
    }

    get frameType() {
        return FrameType.Rect;
    }

    get isPathIcon() {
        return false;
    }
}

export class OvalShape extends PathShape implements classes.OvalShape {
    typeId = 'oval-shape'
    ellipse: classes.Ellipse

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        pathsegs: BasicArray<PathSegment>,
        ellipse: classes.Ellipse
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style,
            pathsegs
        )
        this.ellipse = ellipse;
    }
}

export class LineShape extends PathShape implements classes.LineShape {
    typeId = 'line-shape'

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        pathsegs: BasicArray<PathSegment>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style,
            pathsegs
        );
    }

    get isStraight() {
        return !this.haveEdit; // 直线没有编辑过就肯定是直线
    }
}

export class TextShape extends Shape implements classes.TextShape {
    typeId = 'text-shape'
    text: Text
    fixedRadius?: number

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        text: Text
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style
        )
        this.text = text
        // text.updateSize(frame.width, frame.height);
    }

    getOpTarget(path: string[]) {
        if (path.length === 0) return this;
        if (path[0] === 'text') return this.text.getOpTarget(path.slice(1));
        return super.getOpTarget(path);
    }

    getPathOfFrame(frame: ShapeSize, fixedRadius?: number): Path {

        const w = frame.width;
        const h = frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;
        if (fixedRadius) {
            const path = parsePath(RECT_POINTS, true, w, h, fixedRadius);
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

    getLayout(): TextLayout {
        return this.text.getLayout2(this.size);
    }

    get isNoSupportDiamondScale() {
        return true;
    }

    get frameType() {
        return FrameType.Rect;
    }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }
}

export class CutoutShape extends PathShape implements classes.CutoutShape {
    typeId = 'cutout-shape'
    scalingStroke: boolean;

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        pathsegs: BasicArray<PathSegment>,
        scalingStroke: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style,
            pathsegs
        )
        this.scalingStroke = scalingStroke;
    }

    get isNoSupportDiamondScale() {
        return true;
    }

    get frameType() {
        return FrameType.Rect;
    }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }

    get radius(): number[] {
        return [0];
    }
}

export class PolygonShape extends PathShape implements classes.PolygonShape {
    typeId = 'polygon-shape'
    counts: number

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        pathsegs: BasicArray<PathSegment>,
        counts: number
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style,
            pathsegs
        )
        this.counts = counts
    }
}

export class StarShape extends PathShape implements classes.StarShape {
    typeId = 'star-shape'
    counts: number
    innerAngle: number;

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        size: ShapeSize,
        style: Style,
        pathsegs: BasicArray<PathSegment>,
        counts: number,
        innerAngle: number
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            size,
            style,
            pathsegs
        )
        this.counts = counts;
        this.innerAngle = innerAngle;
    }
}