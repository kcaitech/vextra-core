import { OverrideType, Shape, ShapeFrame, SymbolRefShape, SymbolShape, SymbolUnionShape, VariableType } from "../data/classes";
import { ShapeView, matrix2parent } from "./shape";
import { ShapeType } from "../data/classes";
import { DataView } from "./view";
import { fixFrameByConstrain, isDiffRenderTransform, isDiffVarsContainer, isNoTransform } from "./shape";
import { RenderTransform } from "../render";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { EL } from "./el";
import { ResizingConstraints } from "../data/consts";
import { Matrix } from "../basic/matrix";

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
                this.m_ctx.setReLayout(this);
            }
        }).catch((err) => {
            console.error(err);
        })
    }

    protected isNoSupportDiamondScale(): boolean {
        return true;
    }

    getDataChilds(): Shape[] {
        return this.m_sym ? this.m_sym.childs : [];
    }

    getRefId(): string {
        const v = this._findOV(OverrideType.SymbolID, VariableType.SymbolRef);
        return v ? v.value : (this.m_data as SymbolRefShape).refId;
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

    private layoutChild(child: Shape, idx: number, transx: RenderTransform | undefined, varsContainer: VarsContainer | undefined, resue: Map<string, DataView>) {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, transx, varsContainer, isVirtual: true };
        if (!cdom) {
            const comsMap = this.m_ctx.comsMap;
            const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
            cdom = new Com(this.m_ctx, props) as DataView;
            this.addChild(cdom, idx);
            return;
        }
        this.moveChild(cdom, idx);
        cdom.layout(props);
    }

    layout(props?: PropsType | undefined): void {
        const tid = this.id;
        const needLayout = this.m_ctx.removeReLayout(tid); // remove from changeset

        if (props) {
            // 
            if (props.data.id !== this.m_data.id) throw new Error('id not match');
            // check
            const diffTransform = isDiffRenderTransform(props.transx, this.m_transx);
            const diffVars = isDiffVarsContainer(props.varsContainer, this.m_varsContainer);
            if (!needLayout &&
                !diffTransform &&
                !diffVars) {
                return;
            }

            if (diffTransform) {
                // update transform
                this.m_transx = props.transx;
            }
            if (diffVars) {
                // update varscontainer
                this.m_varsContainer = props.varsContainer;
                const _id = this.id;
                if (_id !== tid) {
                    this.m_ctx.removeDirty(tid);
                    // tid = _id;
                }
            }
        }

        this.m_ctx.setDirty(this);

        if (!this.m_sym) {
            this.removeChilds(0, this.m_children.length).forEach((c) => c.destory());
            return;
        }
        const varsContainer = (this.m_varsContainer || []).concat(this.m_data as SymbolRefShape);
        if (this.m_sym.parent instanceof SymbolUnionShape) {
            varsContainer.push(this.m_sym.parent);
        }
        varsContainer.push(this.m_sym);

        // let transx: RenderTransform | undefined;
        const refframe = this.m_data.frame;
        const symframe = this.m_sym.frame;
        const noTrans = isNoTransform(this.m_transx);
        if (noTrans && refframe.width === symframe.width && refframe.height === symframe.height) {
            this._layout(this.m_data, undefined, varsContainer); // 普通更新
            this.notify("layout");
            return;
        }
        // 先更新自己, 再更新子对象
        if (!noTrans) {
            // todo: 临时hack
            const saveLayoutNormal = this.layoutOnNormal;
            const saveLayoutOnRectShape = this.layoutOnRectShape;
            this.layoutOnNormal = () => {};
            this.layoutOnRectShape = () => {};
            this._layout(this.m_data, this.m_transx, varsContainer);
            this.layoutOnNormal = saveLayoutNormal;
            this.layoutOnRectShape = saveLayoutOnRectShape;
        }
        else { // 第一个
            const shape = this.m_data;
            this.updateLayoutArgs(shape.frame, shape.isFlippedHorizontal, shape.isFlippedVertical, shape.rotation, (shape as any).fixedRadius);
        }
        // 
        // todo
        {

            const refframe = this.m_frame;
            const scaleX = refframe.width / symframe.width;
            const scaleY = refframe.height / symframe.height;

            // todo
            const shape = this.m_sym;
            const frame = shape.frame;
            let x = frame.x;
            let y = frame.y;
            let width = frame.width;
            let height = frame.height;

            const resizingConstraint = shape.resizingConstraint;
            const fixWidth = resizingConstraint && ResizingConstraints.hasWidth(resizingConstraint);
            const fixHeight = resizingConstraint && ResizingConstraints.hasHeight(resizingConstraint);

            const saveW = width;
            const saveH = height;

            if (fixWidth && fixHeight) {
                // 不需要缩放，但要调整位置
                x *= scaleX;
                y *= scaleY;
                // 居中
                x += (width * (scaleX - 1)) / 2;
                y += (height * (scaleY - 1)) / 2;
            } if (fixWidth || fixHeight) {
                const newscaleX = fixWidth ? 1 : scaleX;
                const newscaleY = fixHeight ? 1 : scaleY;
                x *= scaleX;
                y *= scaleY;
                if (fixWidth) x += (width * (scaleX - 1)) / 2;
                if (fixHeight) y += (height * (scaleY - 1)) / 2;
                width *= newscaleX;
                height *= newscaleY;
            }
            else {
                const frame = refframe;
                x = frame.x;
                y = frame.y;
                width = frame.width;
                height = frame.height;
            }
            const parentFrame = new ShapeFrame(x, y, width, height);

            fixFrameByConstrain(shape, refframe, parentFrame);

            const cscaleX = parentFrame.width / saveW;
            const cscaleY = parentFrame.height / saveH;
            this.layoutOnRectShape(varsContainer, parentFrame, cscaleX, cscaleY);
        }

        this.notify("layout");
    }

    protected layoutOnNormal(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i]
            // update childs
            this.layoutChild(cc, i, undefined, varsContainer, resue);
        }
        // 删除多余的
        this.removeChilds(childs.length, Number.MAX_VALUE).forEach((c => c.destory()));
    }

    layoutOnRectShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, parentFrame: ShapeFrame, scaleX: number, scaleY: number): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
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
            this.layoutChild(cc, i, transform, varsContainer!, resue);
        }
        // 删除多余的
        this.removeChilds(childs.length, Number.MAX_VALUE).forEach((c => c.destory()));
    }

    layoutOnDiamondShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scaleX: number, scaleY: number, rotate: number, vflip: boolean, hflip: boolean, bbox: ShapeFrame, m: Matrix): void {
        throw new Error("Method not implemented.");
    }
}