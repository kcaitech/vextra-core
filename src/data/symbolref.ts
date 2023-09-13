import { ResourceMgr } from "./basic";
import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType, Variable, VariableType
} from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType } from "./baseclasses"
import { uuid } from "../basic/uuid";
import { GroupShape, Shape } from "./shape";
import { OverrideShape, OverridesGetter } from "./overrideshape";
import { proxyShape } from "./symproxy";

export class OverrideArray extends classes.OverrideArray {
    constructor(
        id: string,
        name: string,
        overrides: BasicArray<OverrideShape>
    ) {
        super(id, name, overrides)
    }
}

export class SymbolProps extends classes.SymbolProps {
}

export class SymbolRefShape extends Shape implements classes.SymbolRefShape, OverridesGetter {
    __data: GroupShape | undefined
    __symMgr?: ResourceMgr<GroupShape>

    typeId = 'symbol-ref-shape'
    refId: string
    overrides: BasicArray<OverrideShape>

    __overridesMap?: Map<string, OverrideShape>;
    __proxyIdMap: Map<string, string> = new Map();
    // __childs?: Shape[]; // TODO 不可以在这缓存
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
        this.watcher = this.watcher.bind(this);
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

    // symbolref需要watch symbol的修改？
    get naviChilds(): Shape[] | undefined {
        // 需要cache
        if (!this.__data) return;
        // if (this.__childs) return this.__childs;

        const symRef: SymbolRefShape[] = [];
        const preSymRef = this.overridesGetter;
        if (preSymRef) symRef.push(...preSymRef);
        symRef.push(this);
        // this.__childs = this.__data.childs.map((v) => proxyShape(v, this, symRef));
        // this.__data.watch(this.watcher);
        // return this.__childs;
        return this.__data.childs.map((v) => proxyShape(v, this, symRef));
    }

    private watcher(...args: any[]): void {
        super.watcher(args);
        // if (this.__childs) {
        //     // todo compare
        //     this.__childs.forEach((c: any) => c.remove)
        //     this.__childs = undefined;
        //     this.__data?.unwatch(this.watcher);
        // }
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
    peekSymbol(): GroupShape | undefined {
        return this.__data;
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
    addOverrid(id: string, attr: OverrideType, value: any) {
        let override = this.getOverrid(id);
        if (!override) {
            override = this.createOverrid(id);
        }

        switch (attr) {
            case OverrideType.Text:
                override.text = value;
                override.__stringValue_text = undefined;
                override.stringValue = undefined;
                override.override_text = true;
                break;
            case OverrideType.StringValue:
                override.stringValue = value;
                override.override_text = true;
                break;
            case OverrideType.Image:
                override.imageRef = value;
                override.override_image = true;
                break;
            case OverrideType.Borders:
                override.style.borders = value;
                override.override_borders = true;
                break;
            case OverrideType.Fills:
                override.style.fills = value;
                override.override_fills = true;
                break;
        }
        return override;
    }
    getOverrid(id: string): OverrideShape | undefined {
        // for (let i = 0, len = this.overrides.length; i < len; ++i) {
        //     if (this.overrides[i].refId === id) return this.overrides[i];
        // }
        return this.overrideMap.get(id);
    }

    onRemoved(): void {
        // 构建symbol proxy shadow, 在这里需要unwatch

        // if (this.__childs) {
        //     // todo compare
        //     this.__childs.forEach((c: any) => c.remove)
        //     this.__childs = undefined;
        //     this.__data?.unwatch(this.watcher);
        // }
    }
}