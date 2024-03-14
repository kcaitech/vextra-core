import { GroupShape, Shape, ShapeFrame, ShapeType, SymbolRefShape, SymbolShape } from "../data/classes";
import { ShapeView } from "./shape";
import { matrix2parent } from "./shape";
import { RenderTransform, getShapeViewId } from "./basic";
import { Matrix } from "../basic/matrix";
import { EL } from "./el";
import { DataView, RootView } from "./view";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";

export class GroupShapeView extends ShapeView {

    get data(): GroupShape {
        return this.m_data as GroupShape;
    }

    constructor(ctx: DViewCtx, props: PropsType, isTopClass: boolean = true) {
        super(ctx, props, false);

        this._bubblewatcher = this._bubblewatcher.bind(this);
        this.m_data.bubblewatch(this._bubblewatcher);

        if (isTopClass) this.afterInit();
    }

    protected _bubblewatcher(...args: any[]) {
        this.onChildChange(...args);
    }

    protected onChildChange(...args: any[]) {
        if (args.includes('fills') || args.includes('borders')) {
            this.notify(...args); // 通知界面更新
        }
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
            // this.updateChildren();
            this.m_need_updatechilds = true;
        }
    }

    protected _layout(shape: Shape, transform: RenderTransform | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {
        super._layout(shape, transform, varsContainer);
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
        childs.forEach((c) => c.render())
        return childs;
    }

    protected layoutChild(child: Shape, idx: number, transx: RenderTransform | undefined, varsContainer: VarsContainer | undefined, resue: Map<string, DataView>, rView: RootView | undefined) {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, transx, varsContainer, isVirtual: this.m_isVirtual };
        if (cdom) {
            this.moveChild(cdom, idx);
            cdom.layout(props);
            return;
        }

        cdom = rView && rView.getView(getShapeViewId(child.id, varsContainer));
        if (cdom) {
            // 将cdom移除再add到当前group
            const p = cdom.parent;
            if (p) p.removeChild(cdom);
            this.addChild(cdom, idx);
            cdom.layout(props);
            return;
        }

        const comsMap = this.m_ctx.comsMap;
        const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
        cdom = new Com(this.m_ctx, props) as DataView;
        this.addChild(cdom, idx);
    }

    updateLayoutArgs(frame: ShapeFrame, hflip: boolean | undefined, vflip: boolean | undefined, rotate: number | undefined, radius?: number | undefined): void {
        super.updateLayoutArgs(frame, hflip, vflip, rotate, radius);
        // todo
        // if (this.m_need_updatechilds) {
        //     // this.updateChildren();
        //     this.m_need_updatechilds = false;
        // }
    }

    protected layoutOnNormal(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i]
            // update childs
            this.layoutChild(cc, i, undefined, varsContainer, resue, rootView);
        }
        // 删除多余的
        const removes = this.removeChilds(childs.length, Number.MAX_VALUE);
        if (rootView) rootView.addDelayDestory(removes);
        else removes.forEach((c => c.destory()));
    }

    layoutOnRectShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, parentFrame: ShapeFrame, scaleX: number, scaleY: number): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i]
            const transform = {
                dx: 0,
                dy: 0,
                scaleX,
                scaleY,
                parentFrame: this.frame,
                vflip: false,
                hflip: false,
                rotate: 0
            }
            // update childs
            this.layoutChild(cc, i, transform, varsContainer!, resue, rootView);
        }
        // 删除多余的
        const removes = this.removeChilds(childs.length, Number.MAX_VALUE);
        if (rootView) rootView.addDelayDestory(removes);
        else removes.forEach((c => c.destory()));
    }

    layoutOnDiamondShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scaleX: number, scaleY: number, rotate: number, vflip: boolean, hflip: boolean, bbox: ShapeFrame, m: Matrix): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        for (let i = 0, len = childs.length; i < len; i++) { //摆正： 将旋转、翻转放入到子对象
            const cc = childs[i]
            const m1 = cc.matrix2Parent();
            m1.multiAtLeft(m);
            const target = m1.computeCoord(0, 0);
            const c_rotate = rotate + (cc.rotation || 0);
            const c_hflip = hflip ? !cc.isFlippedHorizontal : !!cc.isFlippedHorizontal;
            const c_vflip = vflip ? !cc.isFlippedVertical : !!cc.isFlippedVertical;
            const c_frame = cc.frame;
            // cc matrix2Parent
            const m2 = matrix2parent(c_frame.x, c_frame.y, c_frame.width, c_frame.height, c_rotate, c_hflip, c_vflip);
            m2.trans(bbox.x, bbox.y); // todo 使用parentFrame.x y会与rect对不齐，待研究
            const cur = m2.computeCoord(0, 0);
            const dx = target.x - cur.x;
            const dy = target.y - cur.y;
            const transform = {
                dx,
                dy,
                scaleX,
                scaleY,
                parentFrame: this.frame,
                vflip,
                hflip,
                rotate
            }
            // update childs
            this.layoutChild(cc, i, transform, varsContainer!, resue, rootView);
        }
        // 删除多余的
        const removes = this.removeChilds(childs.length, Number.MAX_VALUE);
        if (rootView) rootView.addDelayDestory(removes);
        else removes.forEach((c => c.destory()));
    }

    get isBoolOpShape() {
        return this.data.isBoolOpShape;
    }
}