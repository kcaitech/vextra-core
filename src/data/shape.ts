/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Basic, BasicArray, BasicMap, ResourceMgr } from "./basic";
import { ContactForm, Style } from "./style";
import { Text } from "./text/text";
import * as classes from "./baseclasses"
import {
    BoolOp,
    CornerRadius,
    CurveMode,
    CurvePoint,
    ExportOptions, Guide,
    PathSegment,
    ResizeType,
    ShapeFrame,
    ShapeType,
    ShapeSize,
    PrototypeInteraction,
    OverlayPosition,
    OverlayPositionType,
    OverlayBackgroundAppearance,
    OverlayBackgroundType,
    OverlayMargin,
    Color
} from "./baseclasses"
import { TextLayout } from "./text/textlayout";
import { parsePath } from "./pathparser";
import { PathType, RadiusType, RECT_POINTS } from "./consts";
import { Variable } from "./variable";
import { Transform } from "./transform";
import { Path } from "@kcdesign/path";
import { v4 } from "uuid";

export { Transform } from "./transform";
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D,
    CurvePoint, ShapeFrame, Ellipse, PathSegment, OverrideType, VariableType,
    FillRule, CornerRadius, ShapeSize, StackPositioning, Radius
} from "./baseclasses";
export { Variable } from "./variable";


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
        if (id0 === "prototypeInteractions" && !this.prototypeInteractions) {
            this.prototypeInteractions = new BasicArray<PrototypeInteraction>();
        }
        if (id0 === "overlayPosition" && !this.overlayPosition) {
            this.overlayPosition = new OverlayPosition(OverlayPositionType.CENTER, new OverlayMargin())
        }
        if (id0 === "overlayBackgroundAppearance" && !this.overlayBackgroundAppearance) {
            this.overlayBackgroundAppearance = new OverlayBackgroundAppearance(OverlayBackgroundType.SOLIDCOLOR, new Color(0.25, 0, 0, 0))
        }
        return super.getOpTarget(path);
    }

    typeId = 'shape'
    crdtidx: BasicArray<number>
    id: string
    type: ShapeType
    style: Style
    transform: Transform
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
    prototypeStartingPoint?: classes.PrototypeStartingPoint;
    prototypeInteractions?: BasicArray<PrototypeInteraction>;
    overlayPosition?: classes.OverlayPosition;
    overlayBackgroundInteraction?: classes.OverlayBackgroundInteraction;
    overlayBackgroundAppearance?: classes.OverlayBackgroundAppearance;
    scrollDirection?: classes.ScrollDirection;
    scrollBehavior?: classes.ScrollBehavior;
    mask?: boolean;
    stackPositioning?: classes.StackPositioning;
    radiusMask?: string;

    constructor(
        crdtidx: BasicArray<number>, id: string, name: string, type: ShapeType, transform: Transform, style: Style
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.name = name
        this.type = type
        this.transform = transform
        // this.size = size
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

    get rotation(): number {
        return (this.transform).decomposeRotate() * 180 / Math.PI;
    }

    get x(): number {
        return this.transform.m02
    }

    set x(v: number) {
        this.transform.m02 = v
    }

    get y(): number {
        return this.transform.m12
    }

    set y(v: number) {
        this.transform.m12 = v
    }

    get size(): ShapeSize {
        return new ShapeSize();
    }

    set size(size: ShapeSize) {

    }

    get frame(): ShapeFrame {
        const { width, height } = this.size;
        return new ShapeFrame(0, 0, width, height);
    }

    hasSize(): boolean {
        return false;
    }

    getPathOfSize(frame: ShapeSize): Path {
        return new Path();
    }

    getPath(): Path {
        return this.getPathOfSize(this.frame);
    }

    getPathStr(): string {
        return this.getPath().toString();
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

    // @deprecated
    frame2Root(): ShapeFrame {
        const frame = this.frame;
        const m = this.matrix2Root();
        const lt = m.computeCoord(frame.x, frame.y);
        const rb = m.computeCoord(frame.x + frame.width, frame.y + frame.height);
        return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    }

    /**
     * root: page 往上一级
     * @returns
     */
    matrix2Root() {
        let s: Shape | undefined = this;
        const m = new Transform();
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

    matrix2Parent(matrix?: Transform) {
        const m = this.transform;
        if (!matrix) return m.clone();
        matrix.multiAtLeft(m);
        return matrix;
    }

    boundingBox(): ShapeFrame {
        if (this.isNoTransform()) {
            const transform = this.transform;
            const size = this.frame;

            return new ShapeFrame(transform.translateX, transform.translateY, size.width, size.height);
        }

        const path = this.getPath();
        if (path.length > 0) {
            const m = this.transform;
            path.transform(m);
            const bounds = path.bbox();
            return new ShapeFrame(bounds.x, bounds.y, bounds.w, bounds.h);
        }

        const frame = this.frame;
        const m = this.transform;
        const corners = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height }
        ].map((p) => m.computeCoord(p));

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
        const frame = this.frame;
        const m = this.transform;
        const corners = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height }
        ].map((p) => m.computeCoord(p));
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
            const bounds = path.bbox();
            return new ShapeFrame(bounds.x, bounds.y, bounds.w, bounds.h);
        }
    }

    /**
     * @deprecated
     */
    getVisible(): boolean {
        throw new Error()
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

    get isContainer() { // 容器类元素: 页面、容器、组件、组件Union
        return false;
    }

    get pathType() {
        return PathType.Editable;
    }

    get isPathIcon() { // 根据路径绘制图标
        return true;
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
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
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

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return Path.fromSVGString(path.join(''));
    }

    // get isNoSupportDiamondScale() {
    //     return true;
    // }

    // get frameType() {
    //     return FrameType.Flex;
    // }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }

    get radiusType() {
        return RadiusType.Fixed;
    }

    // get isImageFill() {
    //     return false;
    // }

    get size(): ShapeSize {
        return this.frame;
    }

    set size(size: ShapeSize) {
    }

    get frame(): ShapeFrame {
        const childframes = this.childs.map((c) => c.boundingBox());
        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            if (i === 0) {
                p.minx = c.x;
                p.maxx = c.x + c.width;
                p.miny = c.y;
                p.maxy = c.y + c.height;
            } else {
                p.minx = Math.min(p.minx, c.x);
                p.maxx = Math.max(p.maxx, c.x + c.width);
                p.miny = Math.min(p.miny, c.y);
                p.maxy = Math.max(p.maxy, c.y + c.height);
            }
            return p;
        }
        const bounds = childframes.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        const { minx, miny, maxx, maxy } = bounds;
        return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
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
        style: Style,
        childs: BasicArray<(GroupShape | Shape)>
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.BoolShape,
            transform,
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

    // get isImageFill() {
    //     return this.style.getFills().some(fill => fill.fillType === classes.FillType.Pattern);
    // }
}

export function getPathOfRadius(frame: ShapeSize, cornerRadius?: CornerRadius, fixedRadius?: number): Path {
    const w = frame.width;
    const h = frame.height;

    const hasRadius = fixedRadius ||
        (cornerRadius &&
            (cornerRadius.lt > 0 ||
                cornerRadius.lb > 0 ||
                cornerRadius.rb > 0 ||
                cornerRadius.rt > 0))

    if (!hasRadius) {
        const path = [
            ["M", 0, 0],
            ["l", w, 0],
            ["l", 0, h],
            ["l", -w, 0],
            ["z"]
        ]
        return Path.fromSVGString(path.join(''));
    }

    let lt, lb, rt, rb;
    if (fixedRadius) {
        lt = lb = rt = rb = fixedRadius;
    } else {
        lt = cornerRadius!.lt;
        lb = cornerRadius!.lb;
        rt = cornerRadius!.rt;
        rb = cornerRadius!.rb;
    }

    const p1 = new CurvePoint([] as any, '', 0, 0, CurveMode.Straight);
    const p2 = new CurvePoint([] as any, '', 1, 0, CurveMode.Straight);
    const p3 = new CurvePoint([] as any, '', 1, 1, CurveMode.Straight);
    const p4 = new CurvePoint([] as any, '', 0, 1, CurveMode.Straight);

    if (lt > 0) p1.radius = lt;
    if (rt > 0) p2.radius = rt;
    if (rb > 0) p3.radius = rb;
    if (lb > 0) p4.radius = lb;

    return parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, w, h, fixedRadius);
}

export class SymbolShape extends GroupShape implements classes.SymbolShape {
    get frame(): classes.ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }

    hasSize(): boolean {
        return true;
    }

    static Default_State = "49751e86-9b2c-4d1b-81b0-36f19b5407d2"

    typeId = 'symbol-shape'
    // @ts-ignore
    size: ShapeSize;
    variables: BasicMap<string, Variable> // 怎么做关联
    symtags?: BasicMap<string, string>
    cornerRadius?: CornerRadius
    guides?: BasicArray<Guide>
    autoLayout?: classes.AutoLayout
    frameMaskDisabled?: boolean
    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        childs: BasicArray<Shape>,
        size: ShapeSize,
        variables: BasicMap<string, Variable>,
        guides?: BasicArray<Guide>,
        autoLayout?: classes.AutoLayout,
        frameMaskDisabled?: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            childs
        )
        this.size = size;
        this.variables = variables;
        this.guides = guides;
        this.autoLayout = autoLayout;
        this.frameMaskDisabled = frameMaskDisabled;
    }

    getOpTarget(path: string[]): any {
        const id0 = path[0];
        if (id0 === 'symtags' && !this.symtags) this.symtags = new BasicMap<string, string>();
        if (id0 === 'cornerRadius' && !this.cornerRadius) this.cornerRadius = new CornerRadius(v4(), 0, 0, 0, 0);
        if (id0 === "guides" && !this.guides) {
            this.guides = new BasicArray<Guide>();
        }
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

    getPathOfSize(frame: ShapeSize, fixedRadius?: number | undefined): Path {
        return getPathOfRadius(frame, this.cornerRadius, fixedRadius);
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
        style: Style,
        childs: BasicArray<Shape>,
        size: ShapeSize,
        variables: BasicMap<string, Variable>,
        autoLayout?: classes.AutoLayout
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            childs,
            size,
            variables,
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
    get frame(): classes.ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }

    hasSize(): boolean {
        return true;
    }

    typeId = 'path-shape'
    // @ts-ignore
    size: ShapeSize;
    pathsegs: BasicArray<PathSegment>
    fixedRadius?: number

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style
        );
        this.size = size;
        this.pathsegs = pathsegs;
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        const width = frame.width;
        const height = frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;

        const path: Path = new Path();
        this.pathsegs.forEach((seg) => {
            path.addPath(parsePath(seg.points, seg.isClosed, width, height, fixedRadius));
        });

        return path
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
    get frame(): classes.ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }

    hasSize(): boolean {
        return true;
    }

    typeId = 'path-shape2'
    // @ts-ignore
    size: ShapeSize;
    pathsegs: BasicArray<PathSegment>
    fixedRadius?: number

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style
        )
        this.size = size;
        this.pathsegs = pathsegs
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        const width = frame.width;
        const height = frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;

        const path: Path = new Path();
        this.pathsegs.forEach((seg) => {
            path.addPath(parsePath(seg.points, seg.isClosed, width, height, fixedRadius));
        });

        return path
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
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            size,
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
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>,
        imageRef: string,
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            size,
            pathsegs,
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

    get isPathIcon() {
        return false;
    }

    // get isImageFill() {
    //     return true;
    // }
}

export class OvalShape extends PathShape implements classes.OvalShape {
    typeId = 'oval-shape'
    ellipse: classes.Ellipse
    startingAngle?: number
    endingAngle?: number
    innerRadius?: number

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>,
        ellipse: classes.Ellipse
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            size,
            pathsegs
        )
        this.ellipse = ellipse;
    }

    get radiusType(): RadiusType {
        if (
            !this.startingAngle &&
            !this.innerRadius &&
            (this.endingAngle === undefined || this.endingAngle === Math.PI * 2)
        ) {
            return RadiusType.None;
        }
        return RadiusType.Fixed;
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
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            size,
            pathsegs
        );
    }

    get isStraight() {
        return !this.haveEdit; // 直线没有编辑过就肯定是直线
    }
}

export class TextShape extends Shape implements classes.TextShape {
    typeId = 'text-shape'
    // @ts-ignore
    size: ShapeSize
    text: Text
    fixedRadius?: number

    get frame(): classes.ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }

    hasSize(): boolean {
        return true;
    }

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        text: Text
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style
        )
        this.size = size;
        this.text = text
        // text.updateSize(frame.width, frame.height);
    }

    getOpTarget(path: string[]) {
        if (path.length === 0) return this;
        if (path[0] === 'text') return this.text.getOpTarget(path.slice(1));
        return super.getOpTarget(path);
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {

        const w = frame.width;
        const h = frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;
        if (fixedRadius) {
            return parsePath(RECT_POINTS, true, w, h, fixedRadius);
        }

        const x = 0;
        const y = 0;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return Path.fromSVGString(path.join(''));
    }

    getLayout(): TextLayout {
        return this.text.getLayout2(this.size);
    }

    // get isNoSupportDiamondScale() {
    //     return true;
    // }

    // get frameType() {
    //     return FrameType.Rect;
    // }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }

    // get isImageFill() {
    //     return false;
    // }
}

export class CutoutShape extends PathShape implements classes.CutoutShape {
    typeId = 'cutout-shape'
    exportOptions?: ExportOptions

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>,
        exportOptions?: ExportOptions
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            size,
            pathsegs
        )
        this.exportOptions = exportOptions;
    }

    // get isNoSupportDiamondScale() {
    //     return true;
    // }

    // get frameType() {
    //     return FrameType.Rect;
    // }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }

    get radiusType() {
        return RadiusType.None;
    }

    // get isImageFill() {
    //     return false;
    // }
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
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>,
        counts: number
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            size,
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
        style: Style,
        size: ShapeSize,
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
            style,
            size,
            pathsegs
        )
        this.counts = counts;
        this.innerAngle = innerAngle;
    }
}

export class Connection extends PathShape implements classes.Connection {
    isEdited: boolean;
    from?: ContactForm;
    to?: ContactForm;

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>,
        isEdited: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            size,
            pathsegs
        )
        this.isEdited = isEdited;
    }
}