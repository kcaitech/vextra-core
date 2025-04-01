import { BoolShapeView, EL, elh, PathShapeView, ShapeView } from "../dataview";
import { stroke } from "./stroke";
import { renderFills } from "./SVG/effects";
import { Transform } from "../data";
import { objectId } from "../basic/objectid";

class MaskRenderer {
    constructor(protected view: PathShapeView | BoolShapeView) {
    }

    protected board():EL[] {
        const view = this.view;
        const path = view.getPath().clone();
        const border = view.getBorder();
        const fill = view.getFills();
        if (border.strokePaints.length) path.addPath(stroke(view));
        return renderFills(elh, fill, view.frame, path.toSVGString());
    }

    protected m_mask_group: ShapeView[] | undefined;
    protected m_mask_transform: Transform | undefined;

    protected getMaskTransform() {
        const view = this.view;
        if (!view.mask) return;
        const parent = view.parent;
        if (!parent) return;
        const __children = parent.childs;
        let index = __children.findIndex(i => i.id === view.id);
        if (index === -1) return;
        const maskGroup: ShapeView[] = [view];
        this.m_mask_group = maskGroup;
        for (let i = index + 1; i < __children.length; i++) {
            const cur = __children[i];
            if (cur && !cur.mask) maskGroup.push(cur);
            else break;
        }
        let x = Infinity;
        let y = Infinity;

        maskGroup.forEach(s => {
            const box = s.boundingBox();
            if (box.x < x) x = box.x;
            if (box.y < y) y = box.y;
        });

        return this.m_mask_transform = new Transform(1, 0, x, 0, 1, y);
    }

    protected bleach(el: EL) {

    }

    protected renderContents() {
        const transform = this.m_mask_transform!.clone();
        const group = this.m_mask_group || [];
        if (group.length < 2) return[];
        const inverse = transform.inverse;
        const els: EL[] = [];
        for (let i = 1; i < group.length; i++) {
            const __s = group[i];
            if (!__s.isVisible) continue;
            const dom = __s.m_renderer.DOM!;
            if (!(dom.elattr as any)['style']) {
                (dom.elattr as any)['style'] = {};
            }
            (dom.elattr as any)['style']['transform'] = (__s.transform.clone().multi(inverse)).toString();
            els.push(dom);
        }

        return els;
    }

    protected get transformStrFromMaskSpace() {
        if (!this.m_mask_transform) return;
        return this.view.transform
            .clone()
            .multi(this.m_mask_transform.inverse)
            .toString();
    }

    maskGroupRender() {
        const transform = this.getMaskTransform();
        if (transform) {
            // Object.assign(this.view.m_renderer.getProps().style, { transform: transform.toString() });
            // const id = `mask-base-${objectId(this)}`;
            // const __body_transform = this.transformStrFromMaskSpace;
            // let content = this.board();
            // const __body = elh("g", { style: { transform: __body_transform } }, content);
            // this.bleach(__body);
            // content = [__body];
            // const mask = elh('mask', { id }, content);
            // const rely = elh('g', { mask: `url(#${id})` }, this.renderContents());
            // content = [mask, rely];
            // this.view.reset("g", props, content);
        }
    }
}