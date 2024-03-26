import { GroupShapeView } from "./groupshape";
import { renderBorders, renderFills } from "../render";
import { EL, elh } from "./el";
import { Shape, ShapeType, SymbolShape } from "../data/shape";
import { VarsContainer } from "./viewctx";
import { DataView, RootView } from "./view"
import { RenderTransform, getShapeViewId } from "./basic";

export class SymbolView extends GroupShapeView {
    get data() {
        return this.m_data as SymbolShape;
    }

    get variables() {
        return this.data.variables;
    }

    get isSymbolUnionShape() {
        return this.data.isSymbolUnionShape;
    }

    get symtags() {
        return this.data.symtags;
    }

    // fills
    protected renderFills(): EL[] {
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr());
    }
    // borders
    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr());
    }

    protected layoutChild(child: Shape, idx: number, transx: RenderTransform | undefined, varsContainer: VarsContainer | undefined, resue: Map<string, DataView>, rView: RootView | undefined) {
        let cdom: DataView | undefined = resue.get(child.id);
        varsContainer = [...(varsContainer || []), this.data as SymbolShape];
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

    // get points() {
    //     return (this.m_data as SymbolShape).points;
    // }
}