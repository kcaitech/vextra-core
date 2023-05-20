import { ResourceMgr, Watchable } from "./basic";
import { Style, Border } from "./style";
import { Text } from "./text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export { CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint, ShapeFrame, OverrideItem, Ellipse, RectRadius } from "./baseclasses"
import { ShapeType, BoolOp, CurvePoint, OverrideItem, ShapeFrame, RectRadius } from "./baseclasses"
import { Path } from "./path";
import { Matrix } from "../basic/matrix";
export class Shape extends Watchable(classes.Shape) {

    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        return new Path();
    }

    get parent(): Shape | undefined {
        let p = this.__parent;
        while (p && !(p instanceof Shape)) p = p.parent
        return p;
    }

    /**
     * @deprecated 这个坐标是没有经过旋转变换的
     * @returns 
     */
    realXY(): { x: number, y: number, width: number, height: number } {
        return this.frame2Page();
    }

    frame2Page(): ShapeFrame {
        const frame = this.frame;
        const m = this.matrix2Page();
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

    matrix2Page() {
        let s: Shape | undefined = this;
        let m = new Matrix();
        while (s) {
            const frame = s.frame;
            if (s.rotation || s.isFlippedHorizontal || s.isFlippedVertical) {
                const cx = frame.width / 2;
                const cy = frame.height / 2;
                m.trans(-cx, -cy);
                if (s.rotation) m.rotate(s.rotation / 360 * 2 * Math.PI);
                if (s.isFlippedHorizontal) m.flipHoriz();
                if (s.isFlippedVertical) m.flipVert();
                m.trans(cx, cy);
            }
            m.trans(frame.x, frame.y);
            s = s.parent;
        }
        return m;
    }

    isNoTransform() {
        return !(this.rotation || this.isFlippedHorizontal || this.isFlippedVertical)
    }

    matrix2Parent() {
        let m = new Matrix();
        const frame = this.frame;
        if (this.rotation || this.isFlippedHorizontal || this.isFlippedVertical) {
            const cx = frame.width / 2;
            const cy = frame.height / 2;
            m.trans(-cx, -cy);
            if (this.rotation) m.rotate(this.rotation / 360 * 2 * Math.PI);
            if (this.isFlippedHorizontal) m.flipHoriz();
            if (this.isFlippedVertical) m.flipVert();
            m.trans(cx, cy);
        }
        m.trans(frame.x, frame.y);
        return m;
    }

    // private __boundingBox?: ShapeFrame;
    boundingBox(): ShapeFrame {
        if (this.isNoTransform()) return this.frame;
        // if (this.__boundingBox) return this.__boundingBox;
        const path = this.getPath(true);
        if (path.length === 0) {
            const frame = this.frame;
            const m = this.matrix2Parent();
            const lt = m.computeCoord(0, 0);
            const rt = m.computeCoord(frame.width, 0);
            const rb = m.computeCoord(frame.width, frame.height);
            const lb = m.computeCoord(0, frame.height);
            const minx = Math.min(Math.min(lt.x, rt.x), Math.min(rb.x, lb.x));
            const maxx = Math.max(Math.max(lt.x, rt.x), Math.max(rb.x, lb.x));
            const miny = Math.min(Math.min(lt.y, rt.y), Math.min(rb.y, lb.y));
            const maxy = Math.max(Math.max(lt.y, rt.y), Math.max(rb.y, lb.y));
            return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
        }
        const m = this.matrix2Parent();
        path.transform(m);
        const bounds = path.bounds;
        return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        // return this.__boundingBox;
    }

    public notify(...args: any[]): void {
        // this.__boundingBox = undefined;
        super.notify(...args);
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
    setVisible() {
        this.isVisible = !this.isVisible;
        if ([ShapeType.Group, ShapeType.Artboard].includes(this.type)) {
            const childs: Shape[] = this.childs
            setChild(childs);
        }
        function setChild(childs: Shape[]) {
            for (let i = 0; i < childs.length; i++) {
                const item = childs[i];
                item.isVisible = !item.isVisible;
                if ([ShapeType.Group, ShapeType.Artboard].includes(item.type)) {
                    const c: Shape[] = (item as GroupShape).childs;
                    setChild(c);
                }
            }
        }
    }

    setLock() {
        this.isLocked = !this.isLocked;
        if ([ShapeType.Group, ShapeType.Artboard].includes(this.type)) {
            const childs: Shape[] = this.childs
            setChild(childs);
        }
        function setChild(childs: Shape[]) {
            for (let i = 0; i < childs.length; i++) {
                const item = childs[i];
                item.isLocked = !item.isLocked;
                if ([ShapeType.Group, ShapeType.Artboard].includes(item.type)) {
                    const c: Shape[] = (item as GroupShape).childs;
                    setChild(c);
                }
            }
        }
    }
}

export class GroupShape extends Shape implements classes.GroupShape {
    typeId = 'group-shape';
    childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
        )
        this.childs = childs;
        (childs as any).typeId = "childs";
    }
    // for io init
    // appendChilds(childs: Shape[]) {
    //     this.childs.push(...childs)
    // }
    removeChild(shape: Shape) {
        const idx = this.indexOfChild(shape);
        if (idx >= 0) {
            this.childs.splice(idx, 1);
        }
    }
    removeChildAt(idx: number) {
        if (idx >= 0) {
            this.childs.splice(idx, 1);
        }
    }
    addChild(child: Shape) {
        this.childs.push(child);
    }
    addChildAt(child: Shape, idx?: number) {
        let index = idx;
        if (!index) index = this.childs.length;
        this.childs.splice(index, 0, child);
    }
    indexOfChild(shape: Shape): number {
        return this.childs.findIndex((val) => {
            return val.id == shape.id
        })
    }
    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const w = this.frame.width;
        const h = this.frame.height;
        let path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }
}

export class FlattenShape extends GroupShape implements classes.FlattenShape {
    typeId = 'flatten-shape';
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            childs
        )
    }
}

export class ImageShape extends Shape implements classes.ImageShape {
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
        boolOp: BoolOp,
        imageRef: string
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
        )
        this.imageRef = imageRef
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
    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const w = this.frame.width;
        const h = this.frame.height;
        const cx = x + w / 2;
        const cy = y + h / 2;

        let path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }
}

export class PathShape extends Shape implements classes.PathShape {
    typeId = 'path-shape'
    points: BasicArray<CurvePoint>
    isClosed?: boolean
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        points: BasicArray<CurvePoint>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
        )
        this.points = points
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
    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        const offsetX = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const offsetY = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const width = this.frame.width;
        const height = this.frame.height;

        let path: any[] = []
        // 还不确定哪个好点
        // const path = parsePath(this, this.isClosed, offsetX, offsetY, width, height);
        // return path;

        const bezierCurveTo = (x1: number, y1: number, x2: number, y2: number, tx: number, ty: number) => {
            path.push(["C", offsetX + x1, offsetY + y1, offsetX + x2, offsetY + y2, offsetX + tx, offsetY + ty]);
        }
        const moveTo = (x: number, y: number) => {
            path.push(["M", offsetX + x, offsetY + y]);
        }
        const lineTo = (x: number, y: number) => {
            path.push(["L", offsetX + x, offsetY + y])
        }
        const closePath = () => {
            path.push(["Z"]);
        }
        const pc = this.points.length;
        if (pc > 0) {
            const p = this.points[0];
            const pt = p.point;
            moveTo(pt.x * width, pt.y * height);
        }
        const curv2Point = (p: CurvePoint, nextP: CurvePoint, isClose?: boolean) => {
            if (p.hasCurveFrom && nextP.hasCurveTo) {
                const adjFrom = p.curveFrom;
                const adjTo = nextP.curveTo;
                const pt = nextP.point;
                bezierCurveTo(adjFrom.x * width,
                    adjFrom.y * height,
                    adjTo.x * width,
                    adjTo.y * height,
                    pt.x * width,
                    pt.y * height);
            }
            else if (p.hasCurveFrom && !nextP.hasCurveTo) {
                const adjFrom = p.curveFrom;
                const adjTo = nextP.point;
                const pt = nextP.point;
                bezierCurveTo(adjFrom.x * width,
                    adjFrom.y * height,
                    adjTo.x * width,
                    adjTo.y * height,
                    pt.x * width,
                    pt.y * height);
            }
            else if (!p.hasCurveFrom && nextP.hasCurveTo) {
                const adjFrom = p.point;
                const adjTo = nextP.curveTo;
                const pt = nextP.point;
                bezierCurveTo(adjFrom.x * width,
                    adjFrom.y * height,
                    adjTo.x * width,
                    adjTo.y * height,
                    pt.x * width,
                    pt.y * height);
            }
            else if (!isClose) {
                const pt = nextP.point;
                lineTo(pt.x * width, pt.y * height);
            }
            else {
                closePath();
            }
        }
        for (let i = 0; i < pc - 1; i++) {
            const p = this.points[i];
            const nextP = this.points[i + 1];
            curv2Point(p, nextP);
        }
        if (this.isClosed) {
            if (pc > 1) {
                const firstP = this.points[0];
                const lastP = this.points[pc - 1];
                curv2Point(lastP, firstP, true);
            } else {
                closePath();
            }
        }

        return new Path(path);
    }
}

export class RectShape extends PathShape implements classes.RectShape {
    typeId = 'rect-shape'
    fixedRadius: RectRadius
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        points: BasicArray<CurvePoint>,
        fixedRadius: RectRadius
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            points
        )
        this.fixedRadius = fixedRadius
    }
    setRadius(radius: RectRadius) {
        this.fixedRadius = radius;
    }
    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const w = this.frame.width;
        const h = this.frame.height;
        const cx = x + w / 2;
        const cy = y + h / 2;
        let { rrb, rrt, rlb, rlt } = this.fixedRadius;
        let path;
        if (rrb || rrt || rlb || rlt) {
            // fit round
            const maxround = Math.min(w, h) / 2;
            if (rrb > maxround) rrb = maxround;
            if (rrt > maxround) rrt = maxround;
            if (rlb > maxround) rlb = maxround;
            if (rlt > maxround) rlt = maxround;
            path = [
                ["M", x + rlt, y],
                ["l", w - rlt - rrt, 0],
                ["a", rrt, rrt, 0, 0, 1, rrt, rrt],
                ["l", 0, h - rrt - rrb],
                ["a", rrb, rrb, 0, 0, 1, -rrb, rrb],
                ["l", rrb + rlb - w, 0],
                ["a", rlb, rlb, 0, 0, 1, -rlb, -rlb],
                ["l", 0, rlb + rlt - h],
                ["a", rlt, rlt, 0, 0, 1, rlt, -rlt],
                ["z"]
            ]
        } else {
            path = [
                ["M", x, y],
                ["l", w, 0],
                ["l", 0, h],
                ["l", -w, 0],
                ["z"]
            ]
        }

        return new Path(path);
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
        boolOp: BoolOp,
        points: BasicArray<CurvePoint>,
        ellipse: classes.Ellipse
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            points,
        )
        this.ellipse = ellipse;
    }
    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const w = this.frame.width;
        const h = this.frame.height;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const rx = this.frame.width / 2
        const ry = this.frame.height / 2

        let path = [
            ["M", x, x + ry],
            ["a", rx, ry, 0, 1, 0, rx * 2, 0],
            ["a", rx, ry, 0, 1, 0, -rx * 2, 0],
        ];
        return new Path(path);
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
        boolOp: BoolOp,
        points: BasicArray<CurvePoint>,
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            points
        )
    }

    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const w = this.frame.width;
        const h = this.frame.height;
        const cx = x + w / 2;
        const cy = y + h / 2;
        let path: any[] = []
        // if (this.points.length) {
        //     const ps = this.points;
        //     for (let i = 0; i < ps.length; i++) {
        //         const { x, y } = ps[i].point;
        //         if (i = 0) {
        //             path.push(['M', x * w, y * h]);
        //         } else {
        //             path.push(['L', x * w, y * h]);
        //         }
        //     }
        // } else {
        //     path = [
        //         ["M", x, y],
        //         ["l", x + w, y + h]
        //     ]
        // }
        path = [
            ["M", x, y],
            ["l", x + w, y + h]
        ]
        return new Path(path);
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
        boolOp: BoolOp,
        text: Text
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
        )
        this.text = text
    }

    getPath(offsetX: number, offsetY: number): Path;
    getPath(origin?: boolean): Path;
    getPath(arg1?: boolean | number, arg2?: number): Path {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const w = this.frame.width;
        const h = this.frame.height;
        const cx = x + w / 2;
        const cy = y + h / 2;

        let path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return new Path(path);
    }

    private __layout: any;
    getLayout<L>(layouter: (shape: TextShape) => L): L {
        if (this.__layout) return this.__layout as L;
        this.__layout = layouter(this);
        return this.__layout as L;
    }

    public notify(...args: any[]): void {
        super.notify(...args);
        this.__layout = undefined;
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
        boolOp: BoolOp,
        childs: BasicArray<(SymbolShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape)>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
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
        boolOp: BoolOp,
        refId: string
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
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
        // let attrs = this.orrides.get(id);
        // if (!attrs) {
        //     attrs = new Map<string, any>();
        //     this.orrides.set(id, attrs);
        // }
        // attrs.set(attr, value);
    }
}