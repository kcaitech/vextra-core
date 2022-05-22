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
    Group,
    Artboard,
    Image,
    Page,
    Text,
    Oval,
    Triangle,
    Star,
    Polygon,
}

export enum BooleanOperation {
    op0, // todo
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

export class Shape {
    protected m_parent: Shape | undefined;
    protected m_lzData: LzData;
    private m_type: ShapeType;
    private m_exportOptions: ExportOptions;
    private m_frame: ShapeFrame;
    private m_childs: Shape[] = [];
    private m_style: Style;
    private m_booleanOperation: BooleanOperation;
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
        booleanOperation: BooleanOperation,
        exportOptions: ExportOptions,
        frame: ShapeFrame,
        style: Style) {

            this.m_parent = parent;
            this.m_lzData = lzData;
            this.m_type = type;
            this.m_name = name;
            this.m_booleanOperation = booleanOperation;
            this.m_exportOptions = exportOptions;
            this.m_frame = frame;
            this.m_style = style;
	}

    initChilds(childs: Shape[]) {
            this.m_childs = childs;
    }

	get booleanOperation(): BooleanOperation {
		return this.m_booleanOperation;
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
	get childsCount() {
		return this.m_childs.length;
	}
	getChildByIndex(idx: number) {
		return this.m_childs[idx];
	}
	get style() {
		return this.m_style;
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

export class RectShape extends Shape {
    private m_fixedRadius: number;

    constructor(parent: Shape | undefined, 
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BooleanOperation,
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
}

export class ImageShape extends Shape {
    private m_imageRef: string;
    private m_imageData: string | undefined;
    // private m_lzData: LzData;
    
	constructor(parent: Shape | undefined, 
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BooleanOperation,
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
        while (i--)
        {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        const data = binaryString.join('');

        const base64 = window.btoa(data);

        let image = '';
        const ext = this.imageExt;
        if(ext == "png") {
            image="data:image/png;base64," + base64;
        }
        else if(ext == "gif") {
            image="data:image/gif;base64," + base64;
        }
        else {
            console.log("imageExt", ext);
        }
        this.m_imageData = image;
        return image;
	}

	get imageExt() {
		const imageRef = this.m_imageRef;
		return imageRef.substring(imageRef.lastIndexOf('.')+1);
	}
}

export class PathShape extends Shape {
    private m_points: Point[];
    private m_isClosed: boolean | undefined;

	constructor(parent: Shape | undefined, 
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BooleanOperation,
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
}

export class TextShape extends Shape {
    private m_text: Text;
    
	constructor(parent: Shape | undefined, 
        lzData: LzData,
        type: ShapeType,
        name: string,
        booleanOperation: BooleanOperation,
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
}