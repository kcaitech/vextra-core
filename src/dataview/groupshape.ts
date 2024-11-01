import { GroupShape, Shape, ShapeFrame, ShapeSize, ShapeType, SymbolRefShape, SymbolShape } from "../data";
import { ShapeView, updateFrame } from "./shape";
import { getShapeViewId } from "./basic";
import { EL } from "./el";
import { DataView, RootView } from "./view";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";

export class GroupShapeView extends ShapeView {

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
        if (args.includes('fills') || args.includes('borders')) this.notify(...args);
    }

    maskMap: Map<string, Shape> = new Map;

    updateMaskMap() {
        const map = this.maskMap;
        map.clear();

        const children = this.getDataChilds();
        let mask: Shape | undefined = undefined;
        const maskShape: Shape[] = [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.mask && child.isVisible) {
                mask = child;
                maskShape.push(child);
            } else {
                mask && map.set(child.id, mask);
            }
        }
        this.childs.forEach(c => {
            if (c.mask) return;
            c.m_ctx.setDirty(c);
        });
        maskShape.forEach(m => m.notify('rerender-mask'));
        this.notify('mask-env-change');
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
        shape: Shape,
        parentFrame: ShapeSize | undefined,
        varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
        scale: { x: number, y: number } | undefined,
        uniformScale: number | undefined
    ): void {
        super._layout(shape, parentFrame, varsContainer, scale, uniformScale);
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
        child: Shape, idx: number,
        scale: { x: number, y: number } | undefined,
        varsContainer: VarsContainer | undefined,
        resue: Map<string, DataView>,
        rView: RootView | undefined
    ) {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, scale, varsContainer, isVirtual: this.m_isVirtual };
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

    // super_updateFrames(): boolean {
    //     return super.updateFrames();
    // }

    updateFrames(): boolean {
        let children = this.m_children;
        if (this.maskMap.size && (this.type === ShapeType.Group || this.type === ShapeType.BoolShape)) {
            children = this.m_children.filter(i => !this.maskMap.has(i.id));
        }

        const childcontentbounds = children.map(c => (c as ShapeView)._p_frame);

        const childvisiblebounds = children.map(c => (c as ShapeView)._p_visibleFrame);

        const childouterbounds = children.map(c => (c as ShapeView)._p_outerFrame);

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

        const contentbounds = childcontentbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        const visiblebounds = childvisiblebounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        const outerbounds = childouterbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });

        // todo
        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;
        if (updateFrame(this.m_frame, contentbounds.minx, contentbounds.miny, contentbounds.maxx - contentbounds.minx, contentbounds.maxy - contentbounds.miny)) {
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
            changed = true;
        }
        {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }
        // update visible
        if (updateFrame(this.m_visibleFrame, visiblebounds.minx, visiblebounds.miny, visiblebounds.maxx - visiblebounds.minx, visiblebounds.maxy - visiblebounds.miny)) changed = true;
        // update outer
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.transform;
            if (this.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;

        if (changed) {
            this.m_ctx.addNotifyLayout(this);
        }
        return changed;
    }
}