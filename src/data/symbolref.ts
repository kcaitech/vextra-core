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
        return this.__data?.childs.map((v) => proxyShape(v, this, this.overridesGetter ?? this));
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

    getOverridValue(shapeId: string, type: classes.OverrideType): OverrideShape | undefined {
        throw new Error("Method not implemented.");
    }

    onRemoved(): void {
        // 构建symbol proxy shadow, 在这里需要unwatch
    }
}