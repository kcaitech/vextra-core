import { elh, ShapeView } from "../../../dataview";
import { innerShadowId } from "../effects";
import { objectId } from "../../../basic/objectid";
import { BlurType } from "../../../data";
import { ViewSVGRenderer } from "./view";

export class BoolSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const view = this.view
        if (!this.checkAndResetDirty()) return this.m_render_version;

        const masked = view.masked;
        if (masked) {
            view.reset("g");
            masked.render();
            return ++this.m_render_version;
        }

        if (!view.isVisible) {
            view.reset("g");
            return ++this.m_render_version;
        }

        if (view.mask) {
            this.renderMaskGroup();
            return ++this.m_render_version;
        }

        const fills = this.renderFills();
        const borders = this.renderBorder();

        const filterId = `${objectId(view)}`;
        const shadows = this.renderShadows(filterId);

        let props = this.getProps();
        let children = [...fills, ...borders];

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, view.getShadows());
            filter = `url(#pd_outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", { filter }, children)];
        }

        const blurId = `blur_${objectId(view)}`;
        const blur = this.renderBlur(blurId);
        if (blur.length) {
            if (view.blur!.type === BlurType.Gaussian) {
                children = [...blur, elh('g', { filter: `url(#${blurId})` }, children)];
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