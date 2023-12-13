import { GroupShape, Shape, ShapeFrame, ShapeType } from "../data/classes";
import { ShapeView } from "./shape";
import { matrix2parent } from "./shape";
import { RenderTransform } from "../render";
import { Matrix } from "../basic/matrix";
import { EL } from "./el";
import { DataView } from "./view";
import { VarsContainer } from "./viewctx";

export class GroupShapeView extends ShapeView {

    getDataChilds(): Shape[] {
        return (this.m_data as GroupShape).childs;
    }

    onCreate(): void {
        super.onCreate();
        // build childs
        const childs = this.getDataChilds();
        const childsView: DataView[] = childs.map((c) => {
            const comsMap = this.m_ctx.comsMap;
            const Com = comsMap.get(c.type) || comsMap.get(ShapeType.Rectangle)!;
            const props = { data: c };
            const ins = new Com(this.m_ctx, props) as DataView;
            ins.update(props, true);
            return ins;
        })
        if (childsView.length > 0) this.addChilds(childsView);
    }

    onDataChange(...args: any[]): void {
        if (args.includes('childs')) {

            // update children
            const reuse = new Map<string, DataView>();
            this.m_children.forEach((c) => {
                reuse.set(c.m_data.id, c);
            });

            const childs = this.getDataChilds();
            for (let i = 0; i < childs.length; i++) {
                const c = childs[i];
                const cdom = reuse.get(c.id);
                if (cdom) {
                    reuse.delete(c.id);
                    this.moveChild(cdom, i);
                } else {
                    const comsMap = this.m_ctx.comsMap;
                    const Com = comsMap.get(c.type) || comsMap.get(ShapeType.Rectangle)!;
                    const props = { data: c };
                    const ins = new Com(this.m_ctx, props) as DataView;
                    ins.update(props, true);

                    this.addChild(ins, i);
                }
            }

            if (this.m_children.length > childs.length) {
                const count = this.m_children.length - childs.length;
                this.removeChilds(childs.length, count);
            }
        }
    }

    protected renderFills(): EL[] {
        return []; // group无fill
    }

    // childs
    renderContents(): EL[] {
        const childs = this.m_children;
        childs.forEach((c) => c.render())
        return childs;
    }

    private updateChild(child: Shape, idx: number, transx: RenderTransform, varsContainer: VarsContainer, resue: Map<string, DataView>) {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, transx, varsContainer };
        if (!cdom) {
            const comsMap = this.m_ctx.comsMap;
            const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
            cdom = new Com(this.m_ctx, props) as DataView;
            cdom.update(props, true);
            this.addChild(cdom, idx);
            return;
        }
        this.moveChild(cdom, idx);
        cdom.update(props);
    }

    updateRectangle(scaleX: number, scaleY: number): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data().id, c));
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i]
            const transform = {
                dx: 0,
                dy: 0,
                scaleX,
                scaleY,
                parentFrame: this.getFrame(),
                vflip: false,
                hflip: false,
                rotate: 0
            }
            // update childs
            this.updateChild(cc, i, transform, this.m_varsContainer!, resue);
        }
        // 删除多余的
        this.removeChilds(childs.length, Number.MAX_VALUE).forEach((c => c.destory()));
    }

    updateDiamond(scaleX: number, scaleY: number, rotate: number, vflip: boolean, hflip: boolean, bbox: ShapeFrame, m: Matrix): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data().id, c));
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
                parentFrame: this.getFrame(),
                vflip,
                hflip,
                rotate
            }
            // update childs
            this.updateChild(cc, i, transform, this.m_varsContainer!, resue);
        }
        // 删除多余的
        this.removeChilds(childs.length, Number.MAX_VALUE).forEach((c => c.destory()));
    }

}