import { OverrideType, Shape, SymbolRefShape, SymbolShape, SymbolUnionShape, VariableType } from "../data/classes";
import { GroupShapeView } from "./groupshape";
import { ShapeType } from "../data/classes";
import { DataView } from "./view";
import { isNoTransform } from "./shape";
import { RenderTransform } from "../render";

export class SymbolRefView extends GroupShapeView {

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
        const refframe = this.getFrame();
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
        const childs = this.getDataChilds();
        for (let i = 0; i < childs.length; i++) {
            const c = childs[i];
            const cdom = reuse.get(c.id);
            if (cdom) {
                reuse.delete(c.id);
                this.moveChild(cdom, i);
                const props = { data: c, transx, varsContainer };
                cdom.update(props);
            } else {
                const comsMap = this.m_ctx.comsMap;
                const Com = comsMap.get(c.type) || comsMap.get(ShapeType.Rectangle)!;
                const props = { data: c, transx, varsContainer };
                const ins = new Com(this.m_ctx, props) as DataView;
                ins.onCreate();

                this.addChild(ins, i);
            }
        }

        if (this.m_children.length > childs.length) {
            const count = this.m_children.length - childs.length;
            this.removeChilds(childs.length, count);
        }
    }

    onCreate(): void {
        super.onCreate();
        // build childs
        // todo

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

}