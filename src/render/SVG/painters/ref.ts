import { elh, ShapeView, SymbolRefView } from "../../../dataview";
import { ViewSVGRenderer } from "./view";
import { objectId } from "../../../basic/objectid";
import { render as clippathR } from "../effects/clippath";
import { innerShadowId } from "../effects";
import { BlurType } from "../../../data";

export class RefSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;
        const view = this.view as SymbolRefView;

        if (!view.isVisible) {
            view.reset("g");
            return ++this.m_render_version;
        }

        const fills = this.renderFills();
        const borders = this.renderBorder();
        let childs = this.renderContents();

        if (view.uniformScale) childs = [elh('g', {transform: `scale(${view.uniformScale})`}, childs)];

        const filterId = `${objectId(view)}`;
        const shadows = this.renderShadows(filterId);

        let props = this.getProps();

        let children;
        if (view.frameMaskDisabled) {
            children = [...fills, ...borders, ...childs];
        } else {
            const id = "clip-symbol-ref-" + objectId(view);
            const clip = clippathR(elh, id, view.getPathStr());
            children = [
                clip,
                elh("g", {"clip-path": "url(#" + id + ")"}, [...fills, ...childs]),
                ...borders
            ];
        }

        // 阴影
        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, view.getShadows());
            filter = `url(#pd_outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", {filter}, children)];
        }

        // 模糊
        const blurId = `blur_${objectId(view)}`;
        const blur = this.renderBlur(blurId);
        if (blur.length) {
            if (view.blur!.type === BlurType.Gaussian) {
                children = [...blur, elh('g', {filter: `url(#${blurId})`}, children)];
            } else {
                const __props: any = {};
                if (props.opacity) {
                    __props.opacity = props.opacity;
                    delete props.opacity;
                }
                if (props.style?.["mix-blend-mode"]) {
                    __props["mix-blend-mode"] = props.style["mix-blend-mode"];
                    delete props.style["mix-blend-mode"];
                }
                children = [...blur, elh('g', __props, children)];
            }
        }

        view.reset("g", props, children);

        return ++this.m_render_version;
    }

    asyncRender() {
        return this.render();
    }
}