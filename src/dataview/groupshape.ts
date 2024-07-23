import { GroupShape, Shape, ShapeSize, ShapeType, SymbolRefShape, SymbolShape } from "../data";
import { ShapeView } from "./shape";
import { getShapeViewId } from "./basic";
import { EL } from "./el";
import { DataView, RootView } from "./view";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { objectId } from "../basic/objectid";

export class GroupShapeView extends ShapeView {
    maskMap: Map<string, string> = new Map();

    get data(): GroupShape {
        return this.m_data as GroupShape;
    }

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);

        this._bubblewatcher = this._bubblewatcher.bind(this);
        this.m_data.bubblewatch(this._bubblewatcher);
        this.updateMaskMap();
    }

    protected _bubblewatcher(...args: any[]) {
        this.onChildChange(...args);
    }

    protected onChildChange(...args: any[]) {
        if (args.includes('fills') || args.includes('borders')) {
            this.notify(...args); // 通知界面更新
        }
        if (args.includes('childs') || args.includes('mask')) {
            this.updateMaskMap();
        }
    }

    updateMaskMap() {
        const map = this.maskMap;
        map.clear();
        const children = this.getDataChilds();
        let currentMask = '';
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.mask) currentMask = `mask_${objectId(child)}`;
            map.set(child.id, currentMask);
        }
        this.childs.forEach(c => c.notify('mask-env-changed'));
        // console.log('__update_mask_map__', this.maskMap);
    }

    onDestory(): void {
        super.onDestory();
        this.m_data.bubbleunwatch(this._bubblewatcher);
    }

    getDataChilds(): Shape[] {
        return (this.m_data as GroupShape).childs;
    }

    m_need_updatechilds: boolean = false;

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        if (args.includes('childs')) {
            this.updateMaskMap();
            this.m_need_updatechilds = true;
        }
    }

    protected _layout(
        size: ShapeSize,
        shape: Shape,
        parentFrame: ShapeSize | undefined,
        varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
        scale: { x: number, y: number } | undefined
    ): void {
        super._layout(size, shape, parentFrame, varsContainer, scale);
        if (this.m_need_updatechilds) {
            this.notify("childs"); // notify childs change
            this.m_need_updatechilds = false;
        }
    }

    // fills
    protected renderFills(): EL[] {
        return []; // group无fill
    }

    // borders
    protected renderBorders(): EL[] {
        return []; // group无border
    }

    // childs
    protected renderContents(): EL[] {
        const childs = this.m_children;
        childs.forEach((c) => c.render());
        return childs;
    }
    protected layoutChild(
        child: Shape,
        idx: number,
        transx: { x: number, y: number } | undefined,
        varsContainer: VarsContainer | undefined,
        resue: Map<string, DataView>,
        rView: RootView | undefined
    ) {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, transx, varsContainer, isVirtual: this.m_isVirtual };
        if (cdom) {
            this.moveChild(cdom, idx);
            return cdom.layout(props);
        }
        cdom = rView && rView.getView(getShapeViewId(child.id, varsContainer));
        if (cdom) {
            // 将cdom移除再add到当前group
            const p = cdom.parent;
            if (p) p.removeChild(cdom);
            this.addChild(cdom, idx);
            return cdom.layout(props);
        }
        const comsMap = this.m_ctx.comsMap;
        const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
        cdom = new Com(this.m_ctx, props) as DataView;
        this.addChild(cdom, idx);
    }

    protected layoutChilds(
        varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
        parentFrame: ShapeSize,
        scale?: { x: number, y: number }): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        for (let i = 0, len = childs.length; i < len; i++) {
            this.layoutChild(childs[i], i, scale, varsContainer, resue, rootView);
        }
        // 删除多余的
        const removes = this.removeChilds(childs.length, Number.MAX_VALUE);
        if (rootView) rootView.addDelayDestory(removes);
        else removes.forEach((c => c.destory()));
    }
}