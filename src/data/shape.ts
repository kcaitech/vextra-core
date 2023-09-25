import { Basic, ResourceMgr, Watchable } from "./basic";
import { Style, Border, Fill, Color } from "./style";
import { Text } from "./text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export { CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint, ShapeFrame, Ellipse, PathSegment, OverrideType, VariableType } from "./baseclasses";
import { ShapeType, CurvePoint, ShapeFrame, BoolOp, ExportOptions, ResizeType, PathSegment, Override, OverrideType, VariableType, Gradient } from "./baseclasses"
import { Path } from "./path";
import { Matrix } from "../basic/matrix";
import { TextLayout } from "./textlayout";
import { parsePath } from "./pathparser";
import { RECT_POINTS } from "./consts";
import { uuid } from "../basic/uuid";
import { Variable } from "./variable";
export { Variable } from "./variable";

export class Shape extends Watchable(Basic) implements classes.Shape {

    typeId = 'shape'
    id: string
    type: ShapeType
    frame: ShapeFrame
    style: Style
    styleVar?: string
    boolOp?: BoolOp
    isFixedToViewport?: boolean
    isFlippedHorizontal?: boolean
    isFlippedVertical?: boolean
    isLocked?: boolean
    isVisible?: boolean
    visibleVar?: string
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

    // private __var_rules: Map<string, string[]> = new Map(); // <"shapeid;fills" -> varid[]>
    // private __var_watch_rule: Map<string, string[]> = new Map(); // <varid -> ruleid (含shapeid)[]>
    private __var_onwatch: Map<string, Variable[]> = new Map(); // 设置了watcher的变量
    private __has_var_notify: any;
    private _var_watcher(...args: any[]) {
        if (!this.__has_var_notify) {
            this.__has_var_notify = setTimeout(() => {
                if (this.__has_var_notify) this.notify()
                this.__has_var_notify = undefined;
            }, 0);
        }
    }

    protected _watch_vars(slot: string, vars: Variable[]) {
        const old = this.__var_onwatch.get(slot);
        if (!old) {
            vars.forEach((v) => v.watch(this._var_watcher));
            this.__var_onwatch.set(slot, vars);
            return;
        }
        if (old.length > vars.length) {
            for (let i = vars.length, len = old.length; i < len; ++i) {
                const v = old[i];
                v.unwatch(this._var_watcher);
            }
        }
        old.length = vars.length;
        for (let i = 0, len = old.length; i < len; ++i) {
            const o = old[i];
            const v = vars[i];
            if (o && o.id === v.id) continue;
            if (o) o.unwatch(this._var_watcher);
            v.watch(this._var_watcher);
            old[i] = v;
        }
    }

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
        this._var_watcher = this._var_watcher.bind(this);
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
    getTarget(targetId: (string | { rowIdx: number, colIdx: number })[]): Shape {
        return this;
    }

    get naviChilds(): Shape[] | undefined {
        return undefined;
    }

    get isVirtualShape() {
        return false;
    }

    override(type: classes.OverrideType): { container: Shape, over: Override, v: Variable } | undefined {
        return;
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

    setVisible(isVisible: boolean | undefined) {
        this.isVisible = isVisible;
    }

    onRemoved() {
        this.__var_onwatch.forEach((v) => {
            v.forEach((v) => v.unwatch(this._var_watcher));
        })
        this.__var_onwatch.clear();
        this.__has_var_notify = undefined;
    }

    findVar(varId: string, ret: Variable[]) {
        this.parent?.findVar(varId, ret);
    }

    getVisible(): boolean {
        if (!this.visibleVar) return !!this.isVisible;
        const _vars: Variable[] = [];
        this.findVar(this.visibleVar, _vars);
        // watch vars
        this._watch_vars("visible", _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Visible) {
            return !!_var.value;
        }
        return !!this.isVisible;
    }
}

export class GroupShape extends Shape implements classes.GroupShape {
    typeId = 'group-shape';
    childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | TextShape)>

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

function genRefId(refId: string, type: OverrideType) {
    if (type === OverrideType.Variable) return refId;
    return refId + '/' + type;
}

export class SymbolShape extends GroupShape implements classes.SymbolShape {
    typeId = 'symbol-shape'
    isUnionSymbolShape?: boolean // 子对象都为SymbolShape
    unionSymbolRef?: string // Variable:xxxxxx
    overrides: BasicArray<Override>
    variables: BasicArray<Variable> // 怎么做关联

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<Shape>,
        overrides: BasicArray<Override>,
        variables: BasicArray<Variable>
    ) {
        super(
            id,
            name,
            ShapeType.Symbol,
            frame,
            style,
            childs
        )
        this.overrides = overrides;
        this.variables = variables;
    }

    private __varMap?: Map<string, Variable>;
    private __overridesMap?: Map<string, Override>;
    private get overrideMap() {
        if (!this.__overridesMap) {
            const map = new Map();
            this.overrides.forEach((o) => {
                map.set(o.refId, o);
            })
            this.__overridesMap = map;
        }
        return this.__overridesMap;
    }

    private get varMap() { // 不可以构造时就初始化，这时的var没有proxy
        if (!this.__varMap) this.__varMap = new Map(this.variables.map((v) => [v.id, v]));
        return this.__varMap;
    }

    private _createVar4Override(type: OverrideType, value: any) {
        switch (type) {
            case OverrideType.Borders:
                return new Variable(uuid(), classes.VariableType.Borders, "");
            case OverrideType.Fills:
                return new Variable(uuid(), classes.VariableType.Fills, "");
            case OverrideType.Image:
                return new Variable(uuid(), classes.VariableType.ImageRef, "");
            // case OverrideType.StringValue:
            //     return new Variable(uuid(), classes.VariableType.StringValue, "");
            case OverrideType.Text:
                return new Variable(uuid(), classes.VariableType.Text, "");
            case OverrideType.Visible:
                return new Variable(uuid(), classes.VariableType.Visible, "");
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
        let over = new Override(refId, type, v.id);

        this.overrides.push(over);
        over = this.overrides[this.overrides.length - 1];

        if (this.__overridesMap) {
            this.__overridesMap.set(refId, over);
        }

        return { over, v };
    }

    // overrideValues
    addOverrid(refId: string, attr: OverrideType, value: any) {
        switch (attr) {
            case OverrideType.Text:
            // case OverrideType.StringValue:
            case OverrideType.Image:
            case OverrideType.Borders:
            case OverrideType.Fills:
            case OverrideType.Visible:
                {
                    let override = this.getOverrid(refId, attr);
                    if (!override) {
                        override = this.createOverrid(refId, attr, value);
                    }
                    override.v.value = value;
                    return override;
                }
            case OverrideType.Variable:
                {
                    let override = this.getOverrid(refId, attr);
                    if (!override) {
                        override = this.createOverrid(refId, attr, value);
                    }
                    else {
                        const _val = value as Variable;
                        override.over.varId = _val.id; // 映射到新变量
                        override.v = this.addVar(_val);
                    }
                    return override;
                }
            default:
                console.error("unknow override: " + attr, value)
        }
    }

    getOverrid(refId: string, type: OverrideType): { over: Override, v: Variable } | undefined {
        refId = genRefId(refId, type); // id+type->var
        const over = this.overrideMap.get(refId);
        if (over) {
            const v = this.varMap.get(over.varId);
            if (v) return { over, v }
        }
    }

    addVar(v: Variable) {
        this.variables.push(v);
        if (this.__varMap) this.__varMap.set(v.id, this.variables[this.variables.length - 1]);
        return this.variables[this.variables.length - 1];
    }
    deleteVar(varId: string) {
        const v = this.varMap.get(varId);
        if (v) {
            const i = this.variables.findIndex((v) => v.id === varId)
            this.variables.splice(i, 1);
            this.varMap.delete(varId);
        }
        return v;
    }
    getVar(varId: string) {
        return this.varMap.get(varId);
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

    addOverrideAt(over: Override, index: number) {
        this.overrides.splice(index, 0, over);
        if (this.__overridesMap) {
            this.__overridesMap.set(over.refId, over);
        }
    }
    deleteOverrideAt(idx: number) {
        const ret = this.overrides.splice(idx, 1)[0];
        if (ret && this.__overridesMap) {
            this.__overridesMap.delete(ret.refId);
        }
        return ret;
    }
    deleteOverride(overrideId: string) {
        const v = this.overrideMap.get(overrideId);
        if (v) {
            const i = this.overrides.findIndex((v) => v.refId === overrideId)
            this.overrides.splice(i, 1);
            this.overrideMap.delete(overrideId);
        }
        return v;
    }

    addVariableAt(_var: Variable, index: number) {
        this.variables.splice(index, 0, _var);
        if (this.__varMap) {
            this.__varMap.set(_var.id, this.variables[index]);
        }
    }
    deleteVariableAt(idx: number) {
        const ret = this.variables.splice(idx, 1)[0];
        if (ret && this.__varMap) {
            this.__varMap.delete(ret.id);
        }
    }
    modifyVariableAt(idx: number, value: any) {
        this.variables[idx].value = value;
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
    textVar?: string
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

    getPath(fixedRadius?: number): Path {
        const w = this.frame.width;
        const h = this.frame.height;

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

    getText(): Text {
        if (!this.textVar) return this.text;
        const _vars: Variable[] = [];
        this.findVar(this.textVar, _vars);
        // watch vars
        this._watch_vars("text", _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Text) {
            return _var.value as Text; // 这要是string?
        }
        return this.text;
    }
}
