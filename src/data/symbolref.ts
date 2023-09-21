import { ResourceMgr } from "./basic";
import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType
} from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType } from "./baseclasses"
import { uuid } from "../basic/uuid";
import { GroupShape, Shape } from "./shape";
import { OverrideShape, OverridesGetter } from "./overrideshape";
import { proxyShape } from "./symproxy";
import { Path } from "./path";
import { layoutChilds } from "./symbolreflayout";

export class SymbolRefShape extends Shape implements classes.SymbolRefShape, OverridesGetter {
    __data: GroupShape | undefined
    __symMgr?: ResourceMgr<GroupShape>

    typeId = 'symbol-ref-shape'
    refId: string
    overrides: BasicArray<OverrideShape>

    __overridesMap?: Map<string, OverrideShape>;
    __proxyIdMap: Map<string, string> = new Map();
    __childs?: Shape[];
    // TODO 不可以在这缓存
    // sym0->symRef0->sym1
    // symRef1->sym0
    // symRef2->sym0
    // 此时共用一个symRef0对象，缓存的childs是错误的

    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        refId: string,
        overrides: BasicArray<OverrideShape>
    ) {
        super(
            id,
            name,
            type,
            frame,
            style
        )
        this.refId = refId
        this.overrides = overrides
    }

    mapId(id: string) {
        let _id = this.__proxyIdMap.get(id);
        if (_id) return _id;
        _id = uuid();
        this.__proxyIdMap.set(id, _id);
        return _id;
    }

    getTarget(targetId: (string | { rowIdx: number, colIdx: number })[]): Shape {
        if (targetId.length > 0) {
            const shapeId = targetId[0] as string;
            let shape = this.getOverrid(shapeId);
            if (!shape) {
                // throw new Error("shape not find");
                shape = this.createOverrid(shapeId);
            }
            return shape.getTarget(targetId.slice(1));
        }
        return this;
    }

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

    getVirtualChilds(symRef: SymbolRefShape[] | undefined, parent: SymbolRefShape): Shape[] | undefined {
        if (!this.__data) return;

        const _symRef = symRef ? symRef.slice(0) : [];
        _symRef.push(this);

        const childs = this.__data.childs.map((v) => proxyShape(v, parent, _symRef));

        const thisframe = this.frame;
        const symframe = this.__data.frame;
        if (thisframe.width !== symframe.width || thisframe.height !== symframe.height) {
            layoutChilds(childs, thisframe, symframe);
        }

        return childs;
    }

    // for render
    get virtualChilds(): Shape[] | undefined {
        // return this._virtualChilds;
        if (this.__childs) return this.__childs;
        this.__childs = this.getVirtualChilds(this.overridesGetter, this);
        return this.__childs;
    }

    // for navigation column
    get naviChilds(): Shape[] | undefined {
        return this.virtualChilds;
    }

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }
    getImageMgr() {
        return this.__imageMgr;
    }

    // get childs() {// 作为引用的symbol的parent，需要提供个childs
    //     return [];
    //     // return this.overrides;
    // }

    setSymbolMgr(mgr: ResourceMgr<GroupShape>) {
        this.__symMgr = mgr;
    }
    private __startLoad: boolean = false;
    peekSymbol(startLoad: boolean = false): GroupShape | undefined {
        const ret = this.__data;
        if (ret) return ret;
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            this.__symMgr && this.__symMgr.get(this.refId).then((val) => {
                if (!this.__data) {
                    this.__data = val;
                    if (val) this.notify();
                }
            })
        }
        return ret;
    }

    async loadSymbol() {
        if (this.__data) return this.__data;
        this.__data = this.__symMgr && await this.__symMgr.get(this.refId);
        if (this.__data) this.notify();
        return this.__data;
    }

    private createOverrid(refId: string) {
        let override = new OverrideShape(uuid(), "",
            ShapeType.OverrideShape,
            new ShapeFrame(0, 0, 0, 0),
            new Style(new BasicArray(), new BasicArray()),
            refId);
        this.overrides.push(override);
        override = this.overrides[this.overrides.length - 1];

        if (this.__overridesMap) {
            this.__overridesMap.set(refId, override);
        }

        return override;
    }

    // overrideValues
    addOverrid(refId: string, attr: OverrideType, value: any) {
        switch (attr) {
            case OverrideType.Text:
                {
                    let override = this.getOverrid(refId);
                    if (!override) {
                        override = this.createOverrid(refId);
                    }
                    override.text = value;
                    override.__stringValue_text = undefined;
                    override.stringValue = undefined;
                    override.override_text = true;
                    return override;
                }
            case OverrideType.StringValue:
                {
                    let override = this.getOverrid(refId);
                    if (!override) {
                        override = this.createOverrid(refId);
                    }
                    override.stringValue = value;
                    override.override_text = true;
                    return override;
                }
            case OverrideType.Image:
                {
                    let override = this.getOverrid(refId);
                    if (!override) {
                        override = this.createOverrid(refId);
                    }
                    override.imageRef = value;
                    override.override_image = true;
                    return override;
                }
            case OverrideType.Borders:
                {
                    let override = this.getOverrid(refId);
                    if (!override) {
                        override = this.createOverrid(refId);
                    }
                    override.style.borders = value;
                    override.override_borders = true;
                    return override;
                }
            case OverrideType.Fills:
                {
                    let override = this.getOverrid(refId);
                    if (!override) {
                        override = this.createOverrid(refId);
                    }
                    override.style.fills = value;
                    override.override_fills = true;
                    return override;
                }
            default:
                console.error("unknow override: " + attr, value)
        }

    }
    getOverrid(id: string): OverrideShape | undefined {
        // for (let i = 0, len = this.overrides.length; i < len; ++i) {
        //     if (this.overrides[i].refId === id) return this.overrides[i];
        // }
        return this.overrideMap.get(id);
    }

    onRemoved(): void {
        // 构建symbol proxy shadow, 在这里需要unwatch

        this._reLayout();
        this.__data?.unwatch(this.watcher);
    }

    _reLayout() {
        if (this.__childs) {
            // todo compare
            this.__childs.forEach((c: any) => c.remove)
            this.__childs = undefined;
        }
    }

    private __hasNotify: any;
    reLayout() {
        this._reLayout();
        if (!this.__hasNotify) { // 这里有界面监听实时更新视图，导致反复实例proxy数据
            this.__hasNotify = setTimeout(() => {
                this.notify()
                this.__hasNotify = undefined;
            }, 0);
        }
    }

    setFrameSize(w: number, h: number): void {
        super.setFrameSize(w, h);
        this._reLayout(); // todo 太粗暴了！
    }

    getPath(): Path {
        const x = 0;
        const y = 0;
        const w = this.frame.width;
        const h = this.frame.height;
        const path = [
            ["M", x, y],
            ["l", w, 0],
            ["l", 0, h],
            ["l", -w, 0],
            ["z"]
        ]
        return new Path(path);
    }
}