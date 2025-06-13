import { EL, elh, PathShapeView, ShapeView } from "../../../dataview";
import { innerShadowId, renderBorder } from "../effects";
import { objectId } from "../../../basic/objectid";
import { BlurType } from "../../../data";
import { ViewSVGRenderer } from "./view";
import { render as renderLineBorders } from "../effects/line_borders";

export class PathSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    bleach(el: EL) {
        if (el.elattr.fill && el.elattr.fill !== 'none' && !(el.elattr.fill as string).startsWith('url(#gradient')) {
            el.elattr.fill = '#FFF';
        }
        if (el.elattr.stroke && el.elattr.stroke !== 'none' && !(el.elattr.stroke as string).startsWith('url(#gradient')) {
            el.elattr.stroke = '#FFF';
        }
        if (Array.isArray(el.elchilds)) el.elchilds.forEach(el => this.bleach(el));
    }

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        const view = this.view as PathShapeView;

        const masked = view.masked;
        if (masked) {
            view.reset("g");
            masked.m_ctx.setDirty(masked);
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
        let borders = view.getBorder();
        let bordersEL: EL[];
        if (view.segments && ((view.segments.length === 1 && !view.segments[0].isClosed) || view.segments.length > 1)) {
            bordersEL = renderLineBorders(elh, view.data.style, borders, view.startMarkerType, view.endMarkerType, view.getPathStr(), view.data);
        } else bordersEL = renderBorder(elh, borders, view.frame, view.getPathStr(), view.radius, view.isCustomBorder);

        const filterId = `${objectId(view)}`;
        const shadows = this.renderShadows(filterId);

        let props = this.getProps();
        let children = [...fills, ...bordersEL];

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, view.getShadows());
            filter = `url(#shadow-outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", {filter}, children)];
        }

        const blurId = `blur-${objectId(view)}`;
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