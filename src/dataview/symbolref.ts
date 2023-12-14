import { OverrideType, Shape, ShapeFrame, SymbolRefShape, SymbolShape, SymbolUnionShape, VariableType } from "../data/classes";
import { ShapeView, matrix2parent } from "./shape";
import { ShapeType } from "../data/classes";
import { DataView } from "./view";
import { isNoTransform } from "./shape";
import { RenderTransform } from "../render";
import { Matrix } from "../basic/matrix";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { EL } from "./el";

export class SymbolRefView extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        const data = this.m_data as SymbolRefShape
        const symMgr = data.getSymbolMgr();
        const refId = this.getRefId();
        this.m_refId = refId;
        symMgr?.get(refId).then((sym) => {
            if (this.m_refId === refId) {
                this.m_sym = sym;
                // need update
                // todo
                // this.update({ data: this.m_data, transx: this.m_transx, varsContainer: this.m_varsContainer }, true);

                this.updateChildren();
                this.m_ctx.setDirty(this);
            }
        }).catch((err) => {
            console.error(err);
        })
    }

    getDataChilds(): Shape[] {
        return this.m_sym ? this.m_sym.childs : [];
    }

    getRefId(): string {
        const v = this._findOV(OverrideType.SymbolID, VariableType.SymbolRef);
        return v ? v.value : this.m_data.refId;
    }

    private m_refId: string | undefined;
    private m_sym: SymbolShape | undefined;

    // 需要自己加载symbol
    // private __data: SymbolShape | undefined;
    // private __union: SymbolShape | undefined;
    // private __startLoad: string = "";
    // updater() {
    //     const symMgr = (this.m_data as SymbolRefShape).getSymbolMgr();
    //     if (!symMgr) return;
    //     const refId = this.getRefId();
    //     if (this.__startLoad === refId) {
    //         return;
    //     }
    //     this.__startLoad = refId;
    //     symMgr.get(refId).then((val) => {
    //         if (this.__startLoad !== refId) return;
    //         if (this.__data) this.__data.unwatch(watcher);
    //         this.__data = val;
    //         if (this.__data) this.__data.watch(watcher);

    //         // union
    //         const union = this.__data?.parent instanceof SymbolUnionShape ? this.__data.parent : undefined;
    //         if (this.__union?.id !== union?.id) {
    //             if (this.__union) this.__union.unwatch(watcher);
    //             this.__union = union;
    //             if (this.__union) this.__union.watch(watcher);
    //         }
    //     })
    // }

    protected renderContents(): EL[] {
        const childs = this.m_children;
        childs.forEach((c) => c.render())
        return childs;
    }

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        this.updateChildren();
    }

    updateChildren(): void {

        if (!this.m_sym) {
            this.removeChilds(0, this.m_children.length);
            return;
        }

        // update children

        const varsContainer = this.m_varsContainer?.slice(0) || [];
        if (this.m_sym.parent instanceof SymbolUnionShape) {
            varsContainer.push(this.m_sym.parent);
        }
        varsContainer.push(this.m_sym);

        let transx: RenderTransform | undefined;
        const refframe = this.frame;
        const symframe = this.m_sym.frame;
        const noTrans = isNoTransform(this.m_transx);
        if (noTrans && refframe.width === symframe.width && refframe.height === symframe.height) {
            //
        }
        else if (noTrans) { // 第一个
            const scaleX = refframe.width / symframe.width;
            const scaleY = refframe.height / symframe.height;
            transx = {
                dx: 0,
                dy: 0,
                scaleX,
                scaleY,
                parentFrame: refframe,
                vflip: false,
                hflip: false,
                rotate: 0
            }
        }
        else {
            transx = this.m_transx;
        }

        const reuse = new Map<string, DataView>();
        this.m_children.forEach((c) => {
            reuse.set(c.m_data.id, c);
        });
        const comsMap = this.m_ctx.comsMap;
        const childs = this.getDataChilds();
        for (let i = 0; i < childs.length; i++) {
            const c = childs[i];
            const cdom = reuse.get(c.id);
            if (cdom) {
                reuse.delete(c.id);
                this.moveChild(cdom, i);
                const props = { data: c, transx, varsContainer };
                cdom.layout(props);
            } else {
                const Com = comsMap.get(c.type) || comsMap.get(ShapeType.Rectangle)!;
                const props = { data: c, transx, varsContainer, isVirtual: true };
                const ins = new Com(this.m_ctx, props) as DataView;
                this.addChild(ins, i);
            }
        }

        if (this.m_children.length > childs.length) {
            const count = this.m_children.length - childs.length;
            this.removeChilds(childs.length, count);
        }
    }


    // todo
    // private updateChild(child: Shape, idx: number, transx: RenderTransform, varsContainer: VarsContainer, resue: Map<string, DataView>) {
    //     let cdom: DataView | undefined = resue.get(child.id);
    //     const props = { data: child, transx, varsContainer, isVirtual: true };
    //     if (!cdom) {
    //         const comsMap = this.m_ctx.comsMap;
    //         const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
    //         cdom = new Com(this.m_ctx, props) as DataView;
    //         this.addChild(cdom, idx);
    //         return;
    //     }
    //     this.moveChild(cdom, idx);
    //     cdom.update(props);
    // }

    // updateRectangle(scaleX: number, scaleY: number): void {
    //     if (!this.m_sym) throw new Error("no symbol");
    //     const varsContainer = this.m_varsContainer?.slice(0) || [];
    //     if (this.m_sym.parent instanceof SymbolUnionShape) {
    //         varsContainer.push(this.m_sym.parent);
    //     }
    //     varsContainer.push(this.m_sym);

    //     const childs = this.getDataChilds();
    //     const resue: Map<string, DataView> = new Map();
    //     this.m_children.forEach((c) => resue.set(c.data.id, c));
    //     for (let i = 0, len = childs.length; i < len; i++) {
    //         const cc = childs[i]
    //         const transform = {
    //             dx: 0,
    //             dy: 0,
    //             scaleX,
    //             scaleY,
    //             parentFrame: this.frame,
    //             vflip: false,
    //             hflip: false,
    //             rotate: 0
    //         }
    //         // update childs
    //         this.updateChild(cc, i, transform, varsContainer, resue);
    //     }
    //     // 删除多余的
    //     this.removeChilds(childs.length, Number.MAX_VALUE).forEach((c => c.destory()));
    // }

    // updateDiamond(scaleX: number, scaleY: number, rotate: number, vflip: boolean, hflip: boolean, bbox: ShapeFrame, m: Matrix): void {
    //     if (!this.m_sym) throw new Error("no symbol");
    //     const varsContainer = this.m_varsContainer?.slice(0) || [];
    //     if (this.m_sym.parent instanceof SymbolUnionShape) {
    //         varsContainer.push(this.m_sym.parent);
    //     }
    //     varsContainer.push(this.m_sym);

    //     const childs = this.getDataChilds();
    //     const resue: Map<string, DataView> = new Map();
    //     this.m_children.forEach((c) => resue.set(c.data.id, c));
    //     for (let i = 0, len = childs.length; i < len; i++) { //摆正： 将旋转、翻转放入到子对象
    //         const cc = childs[i]
    //         const m1 = cc.matrix2Parent();
    //         m1.multiAtLeft(m);
    //         const target = m1.computeCoord(0, 0);
    //         const c_rotate = rotate + (cc.rotation || 0);
    //         const c_hflip = hflip ? !cc.isFlippedHorizontal : !!cc.isFlippedHorizontal;
    //         const c_vflip = vflip ? !cc.isFlippedVertical : !!cc.isFlippedVertical;
    //         const c_frame = cc.frame;
    //         // cc matrix2Parent
    //         const m2 = matrix2parent(c_frame.x, c_frame.y, c_frame.width, c_frame.height, c_rotate, c_hflip, c_vflip);
    //         m2.trans(bbox.x, bbox.y); // todo 使用parentFrame.x y会与rect对不齐，待研究
    //         const cur = m2.computeCoord(0, 0);
    //         const dx = target.x - cur.x;
    //         const dy = target.y - cur.y;
    //         const transform = {
    //             dx,
    //             dy,
    //             scaleX,
    //             scaleY,
    //             parentFrame: this.frame,
    //             vflip,
    //             hflip,
    //             rotate
    //         }
    //         // update childs
    //         this.updateChild(cc, i, transform, varsContainer, resue);
    //     }
    //     // 删除多余的
    //     this.removeChilds(childs.length, Number.MAX_VALUE).forEach((c => c.destory()));
    // }
}