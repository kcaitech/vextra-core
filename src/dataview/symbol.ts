import { GroupShapeView } from "./groupshape";
import { renderBorders, renderFills } from "../render";
import { EL, elh } from "./el";
import { CornerRadius, Shape, ShapeFrame, ShapeType, SymbolShape } from "../data/shape";
import { VarsContainer } from "./viewctx";
import { DataView, RootView } from "./view"
import { getShapeViewId } from "./basic";
import { BorderPosition, Page } from "../data";
import { ShapeView, updateFrame } from "./shape";

export class SymbolView extends GroupShapeView {
    get data() {
        return this.m_data as SymbolShape;
    }
    get cornerRadius(): CornerRadius | undefined {
        return (this.data).cornerRadius;
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
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.data);
    }

    protected layoutChild(child: Shape, idx: number, scale: { x: number, y: number } | undefined, varsContainer: VarsContainer | undefined, resue: Map<string, DataView>, rView: RootView | undefined) {
        let cdom: DataView | undefined = resue.get(child.id);
        varsContainer = [...(varsContainer || []), this.data as SymbolShape];
        const props = { data: child, scale, varsContainer, isVirtual: this.m_isVirtual };

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
    get guides() {
        return (this.m_data as Page).guides;
    }

    updateFrames() {

        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;
        if (changed) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }

        const borders = this.getBorders();
        let maxborder = 0;
        borders.forEach(b => {
            if (b.position === BorderPosition.Outer) {
                maxborder = Math.max(b.thickness, maxborder);
            }
            else if (b.position === BorderPosition.Center) {
                maxborder = Math.max(b.thickness / 2, maxborder);
            }
        })

        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - maxborder, this.frame.y - maxborder, this.frame.width + maxborder * 2, this.frame.height + maxborder * 2)) changed = true;

        const childouterbounds = this.m_children.map(c => (c as ShapeView)._p_outerFrame);
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
        const outerbounds = childouterbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        // update outer
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        // to parent frame
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