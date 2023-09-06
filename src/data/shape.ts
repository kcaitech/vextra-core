import { Basic, ResourceMgr, Watchable } from "./basic";
import { Style, Border } from "./style";
import { Text } from "./text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export { CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint, ShapeFrame, OverrideItem, Ellipse, PathSegment } from "./baseclasses"
import { ShapeType, CurvePoint, OverrideItem, ShapeFrame, BoolOp, ExportOptions, ResizeType, PathSegment, Point2D } from "./baseclasses"
import { Path } from "./path";
import { Matrix } from "../basic/matrix";
import { TextLayout } from "./textlayout";
import { parsePath } from "./pathparser";
import { ContactForm, ContactType, CurveMode } from "./typesdefine";
import { v4 } from "uuid";

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

    get childsVisible(): boolean {
        return false;
    }

    getPath(fixedRadius?: number): Path {
        return new Path();
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
        const corners = [{ x: 0, y: 0 }, { x: frame.width, y: 0 }, { x: frame.width, y: frame.height }, { x: 0, y: frame.height }]
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
}

export class GroupShape extends Shape implements classes.GroupShape {
    typeId = 'group-shape';
    childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
    isBoolOpShape?: boolean
    fixedRadius?: number
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.childs = childs;
        (childs as any).typeId = "childs";
    }

    get childsVisible(): boolean {
        return true;
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

    getPath(): Path {
        const x = 0;
        const y = 0;
        const w = this.frame.width;
        const h = this.frame.height;
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
}

/**
 * @deprecated
 */
export class FlattenShape extends GroupShape implements classes.FlattenShape {
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

    getPath(fixedRadius?: number): Path {
        const offsetX = 0;
        const offsetY = 0;
        const width = this.frame.width;
        const height = this.frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;
        const path = parsePath(this.points, !!this.isClosed, offsetX, offsetY, width, height, fixedRadius);
        return new Path(path);
    }
    setRadius(radius: number): void {
        this.points.forEach((p) => p.cornerRadius = radius);
    }
    getRadius(): number[] {
        return this.points.map((p) => p.cornerRadius);
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

    getPath(fixedRadius?: number): Path {
        const offsetX = 0;
        const offsetY = 0;
        const width = this.frame.width;
        const height = this.frame.height;

        fixedRadius = this.fixedRadius ?? fixedRadius;
        const path: any[] = [];
        this.pathsegs.forEach((seg) => {
            path.push(...parsePath(seg.points, !!seg.isClosed, offsetX, offsetY, width, height, fixedRadius));
        });
        return new Path(path);
    }
    setRadius(radius: number): void {
        this.pathsegs.forEach((seg) => seg.points.forEach((p) => (p.cornerRadius = radius)));
    }
    getRadius(): number[] {
        return this.pathsegs.reduce((radius: number[], seg) => seg.points.reduce((radius, p) => { radius.push(p.cornerRadius); return radius; }, radius), []);
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
            ps[0].cornerRadius = lt;
            ps[1].cornerRadius = rt;
            ps[2].cornerRadius = rb;
            ps[3].cornerRadius = lb;
        }
    }
    getRectRadius(): { lt: number, rt: number, rb: number, lb: number } {
        const ret = { lt: 0, rt: 0, rb: 0, lb: 0 };
        const ps = this.points;
        if (ps.length === 4) {
            ret.lt = ps[0].cornerRadius;
            ret.rt = ps[1].cornerRadius;
            ret.rb = ps[2].cornerRadius;
            ret.lb = ps[3].cornerRadius;
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
    peekImage() {
        return this.__cacheData?.base64;
    }
    // image shape
    async loadImage(): Promise<string> {
        if (this.__cacheData) return this.__cacheData.base64;
        this.__cacheData = this.__imageMgr && await this.__imageMgr.get(this.imageRef)
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

    getPath(): Path {
        const x = 0;
        const y = 0;
        const w = this.frame.width;
        const h = this.frame.height;

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
}

export class SymbolShape extends GroupShape implements classes.SymbolShape {
    typeId = 'symbol-shape'
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(SymbolShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            childs
        )
    }
}

export class SymbolRefShape extends Shape implements classes.SymbolRefShape {
    typeId = 'symbol-ref-shape'
    refId: string
    overrides?: BasicArray<OverrideItem>
    __data: SymbolShape | undefined
    __symMgr?: ResourceMgr<SymbolShape>
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        refId: string
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.refId = refId
    }
    setSymbolMgr(mgr: ResourceMgr<SymbolShape>) {
        this.__symMgr = mgr;
    }
    peekSymbol(): SymbolShape | undefined {
        return this.__data;
    }
    async loadSymbol() {
        if (this.__data) return this.__data;
        this.__data = this.__symMgr && await this.__symMgr.get(this.refId);
        this.notify();
        return this.__data;
    }
    // overrideValues
    addOverrid(id: string, attr: string, value: any) {
        if (!this.overrides) this.overrides = new BasicArray();
        const item = new OverrideItem(id, attr, value);
        this.overrides.push(item);
    }
    getOverrid(id: string, attr: string): OverrideItem | undefined {
        if (!this.overrides) return;
        this.overrides.forEach((item) => {
            if (item.id === id && item.attr === attr) return item;
        })
    }
}
export class ContactShape extends PathShape implements classes.ContactShape {
    typeId = 'contact-shape'
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
    private get_pagexy(shape: Shape, type: ContactType, m2r: Matrix) {
        const f = shape.frame;
        switch (type) {
            case ContactType.Top: return m2r.computeCoord2(f.width / 2, 0);
            case ContactType.Right: return m2r.computeCoord2(f.width, f.height / 2);
            case ContactType.Bottom: return m2r.computeCoord2(f.width / 2, f.height);
            case ContactType.Left: return m2r.computeCoord2(0, f.height / 2);
            default: return false
        }
    }
    getPath(fixedRadius?: number): Path {
        const offsetX = 0;
        const offsetY = 0;
        const width = this.frame.width;
        const height = this.frame.height;
        fixedRadius = this.fixedRadius ?? fixedRadius;
        const points = this.points.slice(0);
        let page: any;
        if (this.from) {
            if (!page) page = this.getPage();
            if (page) {
                const fromShape = page.getShape((this.from as ContactForm).shapeId);
                if (fromShape) {
                    const f = this.frame;
                    let m1 = this.matrix2Root();
                    m1.preScale(f.width, f.height);
                    m1 = new Matrix(m1.inverse);
                    let p = this.get_pagexy(fromShape, (this.from as ContactForm).contactType, fromShape.matrix2Root());
                    if (p) {
                        p = m1.computeCoord3(p);
                        const fp = new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.None, new Point2D(p.x, p.y));
                        points[0] = fp;
                    }
                }
            }
        }
        if (this.to) {
            if (!page) page = this.getPage();
            if (page) {
                const toShape = page.getShape((this.to as ContactForm).shapeId);
                if (toShape) {
                    const f = this.frame;
                    let m1 = this.matrix2Root();
                    m1.preScale(f.width, f.height);
                    m1 = new Matrix(m1.inverse);
                    let p = this.get_pagexy(toShape, (this.to as ContactForm).contactType, toShape.matrix2Root());
                    if (p) {
                        p = m1.computeCoord3(p);
                        const lp = new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.None, new Point2D(p.x, p.y));
                        points[points.length - 1] = lp;
                    }
                }
            }
        }
        const path = parsePath(points, !!this.isClosed, offsetX, offsetY, width, height, fixedRadius);
        return new Path(path);
    }
    getPoints() {
        const points = this.points.slice(0);
        let page: any;
        if (this.from) {
            if (!page) page = this.getPage();
            if (page) {
                const fromShape = page.getShape((this.from as ContactForm).shapeId);
                if (fromShape) {
                    const f = this.frame;
                    let m1 = this.matrix2Root();
                    m1.preScale(f.width, f.height);
                    m1 = new Matrix(m1.inverse);
                    let p = this.get_pagexy(fromShape, (this.from as ContactForm).contactType, fromShape.matrix2Root());
                    if (p) {
                        p = m1.computeCoord3(p);
                        const fp = new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.None, new Point2D(p.x, p.y));
                        points[0] = fp;
                    }
                }
            }
        }
        if (this.to) {
            if (!page) page = this.getPage();
            if (page) {
                const toShape = page.getShape((this.to as ContactForm).shapeId);
                if (toShape) {
                    const f = this.frame;
                    let m1 = this.matrix2Root();
                    m1.preScale(f.width, f.height);
                    m1 = new Matrix(m1.inverse);
                    let p = this.get_pagexy(toShape, (this.to as ContactForm).contactType, toShape.matrix2Root());
                    if (p) {
                        p = m1.computeCoord3(p);
                        const lp = new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.None, new Point2D(p.x, p.y));
                        points[points.length - 1] = lp;
                    }
                }
            }
        }
        return points;
    }
}