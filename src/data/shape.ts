import { Watchable } from "./basic";
import { LzData } from "./lzdata";
import { Pair, Style, XY } from "./style";
import { Text } from "./text";

export enum PointType {
    Type0, // todo
}

export enum CurveMode {
    Mode0, // todo 1,2,3,4
    Mode1,
    Mode2,
    Mode3,
    Mode4,
}

export class Point {
    private m_type: PointType;
    private m_cornerRadius: number;
    private m_curveFrom: XY<number, number>;
    private m_curveMode: CurveMode;
    private m_curveTo: XY<number, number>;
    private m_hasCurveFrom: boolean;
    private m_hasCurveTo: boolean;
    private m_point: XY<number, number>;

    constructor(type: PointType,
        cornerRadius: number,
        curveFrom: XY<number, number>,
        curveMode: CurveMode,
        curveTo: XY<number, number>,
        hasCurveFrom: boolean,
        hasCurveTo: boolean,
        point: XY<number, number>) {
        this.m_type = type;
        this.m_cornerRadius = cornerRadius;
        this.m_curveFrom = curveFrom;
        this.m_curveMode = curveMode;
        this.m_curveTo = curveTo;
        this.m_hasCurveFrom = hasCurveFrom;
        this.m_hasCurveTo = hasCurveTo;
        this.m_point = point;
    }

    get type(): PointType {
        return this.m_type;
    }
    get cornerRadius(): number {
        return this.m_cornerRadius;
    }
    get curveFrom(): XY<number, number> {
        return this.m_curveFrom;
    }
    get curveMode(): CurveMode {
        return this.m_curveMode;
    }
    get curveTo(): XY<number, number> {
        return this.m_curveTo;
    }
    get hasCurveFrom(): boolean {
        return this.m_hasCurveFrom;
    }
    get hasCurveTo(): boolean {
        return this.m_hasCurveTo;
    }
    get point(): XY<number, number> {
        return this.m_point;
    }
}

export class ExportOptions {
    // todo
    // "exportOptions": {
    //     "_class": "exportOptions",
    //     "includedLayerIds": [],
    //     "layerOptions": 0,
    //     "shouldTrim": false,
    //     "exportFormats": []
    // },
    // "frame": {
    //     "_class": "rect",
    //     "constrainProportions": false,
    //     "height": 68,
    //     "width": 73,
    //     "x": 0,
    //     "y": 0
    // },
}

export class ShapeFrame {
    // todo
    // "_class": "rect",
    // "constrainProportions": false,
    // "height": 106,
    // "width": 117,
    // "x": 100,
    // "y": 395
    private m_x: number;
    private m_y: number;
    private m_height: number;
    private m_width: number;
    constructor(x: number, y: number, width: number, height: number) {
        this.m_x = x;
        this.m_y = y;
        this.m_width = width;
        this.m_height = height;
    }
    get x(): number {
        return this.m_x;
    }
    get y(): number {
        return this.m_y;
    }
    get width(): number {
        return this.m_width;
    }
    get height(): number {
        return this.m_height;
    }
}

export enum ShapeType {
    Rectangle,
    Path,
    ShapeGroup, // 这个类型里的对象要以一个对象的形式画，特别是path
    Group,
    Artboard,
    Image,
    Page,
    Text,
    Oval,
    Triangle,
    Star,
    Polygon,
    Boolean,
    Symbol,
    SymbolRef,
}

export enum BoolOp {
    None,
    Union,
    SimpleUnion,
    Sbutract,
    Intersect,
    Difference,
}

export enum LayerListExpandedType {
    Type0, // todo
}

export enum ResizingType {
    Type0,
    // todo
}

export enum ClippingMaskMode {
    // todo
}

export interface IShape {

}

export class Shape extends Watchable implements IShape {
    protected m_parent: Shape | undefined;
    protected m_lzData: LzData;
    private m_type: ShapeType;
    private m_exportOptions: ExportOptions;
    private m_frame: ShapeFrame;

    private m_style: Style;
    private m_boolOp: BoolOp;
    private m_isFixedToViewport: boolean = false;
    private m_isFlippedHorizontal: boolean = false;
    private m_isFlippedVertical: boolean = false;
    private m_isLocked: boolean = false;
    private m_isVisible: boolean = true;
    private m_layerListExpandedType: LayerListExpandedType = LayerListExpandedType.Type0;
    private m_maintainScrollPosition: boolean = false;
    private m_name: string;
    private m_nameIsFixed: boolean = false;
    private m_resizingConstraint: number = 0;
    private m_resizingType: ResizingType = ResizingType.Type0;
    private m_rotation: number = 0;
    private m_shouldBreakMaskChain: boolean = false;
    private m_clippingMaskMode: ClippingMaskMode | undefined;
    private m_hasClippingMask: boolean = false;
    private m_changeListener: Function | undefined;

    constructor(parent: Shape | undefined,
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BoolOp,
        exportOptions: ExportOptions,
        frame: ShapeFrame,
        style: Style) {
        super();
        this.m_parent = parent;
        this.m_lzData = lzData;
        this.m_type = type;
        this.m_name = name;
        this.m_boolOp = booleanOperation;
        this.m_exportOptions = exportOptions;
        this.m_frame = frame;
        this.m_style = style;
    }

    get boolOp(): BoolOp {
        return this.m_boolOp;
    }
    get isFixedToViewport(): boolean {
        return this.m_isFixedToViewport;
    }
    get isFlippedHorizontal(): boolean {
        return this.m_isFlippedHorizontal;
    }
    get isFlippedVertical(): boolean {
        return this.m_isFlippedVertical;
    }
    get isLocked() {
        return this.m_isLocked;
    }
    get isVisible() {
        return this.m_isVisible;
    }
    get layerListExpandedType() {
        return this.m_layerListExpandedType;
    }
    get maintainScrollPosition() {
        return this.m_maintainScrollPosition;
    }
    get name() {
        return this.m_name;
    }
    get nameIsFixed() {
        return this.m_nameIsFixed;
    }
    get resizingConstraint() {
        return this.m_resizingConstraint;
    }
    get resizingType(): ResizingType {
        return this.m_resizingType;
    }
    get rotation() {
        return this.m_rotation;
    }
    get shouldBreakMaskChain() {
        return this.m_shouldBreakMaskChain;
    }
    get type() {
        return this.m_type;
    }
    get exportOptions() {
        return this.m_exportOptions;
    }
    get frame() {
        return this.m_frame;
    }
    get clippingMaskMode() {
        return this.m_clippingMaskMode;
    }
    get hasClippingMask() {
        return this.m_hasClippingMask;
    }

    get style() {
        return this.m_style;
    }

    getPath(offsetX: number, offsetY: number): string;
    getPath(origin?: boolean): string;
    getPath(arg1?: boolean | number, arg2?: number): string {
        return "";
    }

    onChange(cb: Function) {
        this.m_changeListener = cb;
    }
    fireChanged() {
        if (this.m_changeListener) this.m_changeListener();
    }
    // bubbleEvent(event: string, args: any, forceAsync: boolean = false): any {
    // 	return this.m_parent && this.m_parent.bubbleEvent(event, args, forceAsync);
    // }
}

export class GroupShape extends Shape {
    private m_childs: Shape[] = [];
    constructor(parent: Shape | undefined,
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BoolOp,
        exportOptions: ExportOptions,
        frame: ShapeFrame,
        style: Style) {
            super(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
        }

    appendChilds(childs: Shape[]) {
        this.m_childs.push(...childs)
    }

    get childsCount() {
        return this.m_childs.length;
    }
    getChildByIndex(idx: number) {
        return this.m_childs[idx];
    }
}

export class RectShape extends Shape {
    private m_fixedRadius: number;

    constructor(parent: Shape | undefined,
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BoolOp,
        exportOptions: ExportOptions,
        frame: ShapeFrame,
        style: Style,
        fixedRadius?: number) {
        super(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
        this.m_fixedRadius = fixedRadius || 0;
    }
    get fixedRadius() {
        return this.m_fixedRadius;
    }

    getPath(offsetX: number, offsetY: number): string;
    getPath(origin?: boolean): string;
    getPath(arg1?: boolean | number, arg2?: number): string {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const w = this.frame.width;
        const h = this.frame.height;
        const r = 0; // todo
        if (r && r != 0) {
            return [["M", x + r, y],
            ["l", w - r * 2, 0],
            ["a", r, r, 0, 0, 1, r, r],
            ["l", 0, h - r * 2],
            ["a", r, r, 0, 0, 1, -r, r],
            ["l", r * 2 - w, 0],
            ["a", r, r, 0, 0, 1, -r, -r],
            ["l", 0, r * 2 - h],
            ["a", r, r, 0, 0, 1, r, -r],
            ["z"]].map((v) => v.join(" ")).join(" ");
        }
        return [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]].map((v) => v.join(" ")).join(" ");
    }
}

export class ImageShape extends Shape {
    private m_imageRef: string;
    private m_imageData: string | undefined;
    // private m_lzData: LzData;

    constructor(parent: Shape | undefined,
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BoolOp,
        exportOptions: ExportOptions,
        frame: ShapeFrame,
        imageRef: string,
        style: Style) {
        super(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
        this.m_imageRef = imageRef;
    }

    // image shape
    async loadImage(): Promise<string> {
        if (this.m_imageData) {
            return this.m_imageData;
        }
        const imageRef = this.m_imageRef;
        const buffer = await this.m_lzData.load(imageRef);

        const uInt8Array = new Uint8Array(buffer)
        let i = uInt8Array.length;
        const binaryString = new Array(i);
        while (i--) {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        const data = binaryString.join('');

        const base64 = window.btoa(data);

        let image = '';
        const ext = this.imageExt;
        if (ext == "png") {
            image = "data:image/png;base64," + base64;
        }
        else if (ext == "gif") {
            image = "data:image/gif;base64," + base64;
        }
        else {
            console.log("imageExt", ext);
        }
        this.m_imageData = image;
        return image;
    }

    get imageExt() {
        const imageRef = this.m_imageRef;
        return imageRef.substring(imageRef.lastIndexOf('.') + 1);
    }

    getPath(offsetX: number, offsetY: number): string;
    getPath(origin?: boolean): string;
    getPath(arg1?: boolean | number, arg2?: number): string {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const w = this.frame.width;
        const h = this.frame.height;
        return [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]].map((v) => v.join(" ")).join(" ");
    }
}

export class PathShape extends Shape {
    private m_points: Point[];
    private m_isClosed: boolean | undefined;

    constructor(parent: Shape | undefined,
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BoolOp,
        exportOptions: ExportOptions,
        frame: ShapeFrame,
        points: Point[],
        style: Style,
        isClosed?: boolean) {
        super(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
        this.m_points = points;
        this.m_isClosed = isClosed;
    }

    // path shape
    get pointsCount() {
        return this.m_points.length;
    }
    getPointByIndex(idx: number) {
        return this.m_points[idx];
    }
    mapPoints<T>(f: (value: Point, index: number, array: Point[]) => T): T[] {
        return this.m_points.map(f);
    }
    get isClosed(): boolean {
        return !!this.m_isClosed;
    }

    getPath(offsetX: number, offsetY: number): string;
    getPath(origin?: boolean): string;
    getPath(arg1?: boolean | number, arg2?: number): string {
        const offsetX = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const offsetY = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const width = this.frame.width;
        const height = this.frame.height;

        let path = "";

        const bezierCurveTo = (x1: number, y1: number, x2: number, y2: number, tx: number, ty: number) => {
            path = path + " C" + x1 + " " + y1 + " " + x2 + " " + y2 + " " + tx + " " + ty;
        }
        const moveTo = (x: number, y: number) => {
            path = path + " M" + x + " " + y;
        }
        const lineTo = (x: number, y: number) => {
            path = path + " L" + x + " " + y;
        }
        const closePath = () => {
            path = path + " Z";
        }
        const pc = this.pointsCount;
        if (pc > 0) {
            const p = this.getPointByIndex(0);
            const pt = p.point;
            moveTo(offsetX + pt.x * width, offsetY + pt.y * height);
        }
        const curv2Point = (p: Point, nextP: Point, isClose?: boolean) => {
            if (p.hasCurveFrom && nextP.hasCurveTo) {
                const adjFrom = p.curveFrom;
                const adjTo = nextP.curveTo;
                const pt = nextP.point;
                bezierCurveTo(offsetX + adjFrom.x * width,
                    offsetY + adjFrom.y * height,
                    offsetX + adjTo.x * width,
                    offsetY + adjTo.y * height,
                    offsetX + pt.x * width,
                    offsetY + pt.y * height);
            }
            else if (p.hasCurveFrom && !nextP.hasCurveTo) {
                const adjFrom = p.curveFrom;
                const adjTo = nextP.point;
                const pt = nextP.point;
                bezierCurveTo(offsetX + adjFrom.x * width,
                    offsetY + adjFrom.y * height,
                    offsetX + adjTo.x * width,
                    offsetY + adjTo.y * height,
                    offsetX + pt.x * width,
                    offsetY + pt.y * height);
            }
            else if (!p.hasCurveFrom && nextP.hasCurveTo) {
                const adjFrom = p.point;
                const adjTo = nextP.curveTo;
                const pt = nextP.point;
                bezierCurveTo(offsetX + adjFrom.x * width,
                    offsetY + adjFrom.y * height,
                    offsetX + adjTo.x * width,
                    offsetY + adjTo.y * height,
                    offsetX + pt.x * width,
                    offsetY + pt.y * height);
            }
            else if (!isClose) {
                const pt = nextP.point;
                lineTo(offsetX + pt.x * width, offsetY + pt.y * height);
            }
            else {
                closePath();
            }
        }
        for (let i = 0; i < pc - 1; i++) {
            const p = this.getPointByIndex(i);
            const nextP = this.getPointByIndex(i + 1);
            curv2Point(p, nextP);
        }
        if (this.isClosed) {
            if (pc > 1) {
                const firstP = this.getPointByIndex(0);
                const lastP = this.getPointByIndex(pc - 1);
                curv2Point(lastP, firstP, true);
            } else {
                closePath();
            }
        }

        return path;
    }
}

export class TextShape extends Shape {
    private m_text: Text;

    constructor(parent: Shape | undefined,
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BoolOp,
        exportOptions: ExportOptions,
        frame: ShapeFrame,
        style: Style,
        text: Text) {
        super(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
        this.m_text = text;
    }

    get text() {
        return this.m_text;
    }

    getPath(offsetX: number, offsetY: number): string;
    getPath(origin?: boolean): string;
    getPath(arg1?: boolean | number, arg2?: number): string {
        const x = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.x) : (arg1 as number);
        const y = typeof arg1 == "boolean" ? (arg1 ? 0 : this.frame.y) : (arg2 as number);
        const w = this.frame.width;
        const h = this.frame.height;
        return [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]].map((v) => v.join(" ")).join(" ");
    }
}

// todo
// group shape

// oval shape

// Symbol:
// SymbolRef 
// SymbolMaster

export interface ISymbolManager {
    addSymbol(id: string, data: Symbol): void;
    deleteSymbol(id: string): void;
    getSymbol(id: string): Promise<Symbol>;
}

export class Symbol extends GroupShape {
    private m_id: string;
    private m_symMgr: ISymbolManager;

    constructor(parent: Shape | undefined,
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BoolOp,
        exportOptions: ExportOptions,
        frame: ShapeFrame,
        style: Style,
        id: string,
        mgr:ISymbolManager) {
        super(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
        this.m_symMgr = mgr;
        this.m_id = id;
        mgr.addSymbol(id, this);
    }
    get id() {
        return this.m_id;
    }
    deleted() {
        this.m_symMgr.deleteSymbol(this.m_id);
    }
}

export class SymbolRef extends Shape {
    private m_symMgr: ISymbolManager;
    private m_id: string;
    private m_data?: Symbol;
    constructor(
        parent: Shape | undefined,
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BoolOp,
        exportOptions: ExportOptions,
        frame: ShapeFrame,
        style: Style,
        mgr:ISymbolManager, 
        id: string, 
        data?: Symbol) {
        super(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
        this.m_symMgr = mgr;
        this.m_id = id;
        this.m_data = data;
    }
    get id() {
        return this.m_id;
    }
    async getSymbol(): Promise<Symbol> {
        if (this.m_data) return this.m_data;
        return this.m_symMgr.getSymbol(this.m_id).then((s) => {
            this.m_data = s;
            return s;
        })
    }
}

