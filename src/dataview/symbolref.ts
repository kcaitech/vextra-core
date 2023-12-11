import { OverrideType, Shape, SymbolRefShape, SymbolShape, VariableType } from "../data/classes";
import { GroupShapeView } from "./groupshape";

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
                this.update({ data: this.m_data, transx: this.m_transx, varsContainer: this.m_varsContainer }, true);
            }
        }).catch((err) => {
            console.error(err);
        })

    }

    
}