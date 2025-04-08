import { EL, elh, ShapeView, TextShapeView } from "../../../dataview";
import { innerShadowId } from "../effects";
import { objectId } from "../../../basic/objectid";
import { BlurType } from "../../../data";
import { ViewSVGRenderer } from "./view";
import { renderTextLayout } from "../effects/text";
import { stroke } from "../../stroke";

export class TextSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }
    protected createBoard(): EL[] {
        const view = this.view as TextShapeView;
        const path = view.getTextPath().clone();
        const border = view.getBorder();
        if (border.strokePaints.length) path.addPath(stroke(view));
        const layout = view.getLayout();
        return renderTextLayout(elh, layout, view.frame, view.blur);
    }
    bleach(el: EL) {
        if (el.elattr.fill) el.elattr.fill = '#FFF';
        if (el.elattr.stroke) el.elattr.stroke = '#FFF';

        // 漂白字体
        if (el.eltag === 'text') {
            if ((el.elattr?.style as any).fill) {
                (el.elattr?.style as any).fill = '#FFF'
            }
        }

        // 漂白阴影
        if (el.eltag === 'feColorMatrix' && el.elattr.result) {
            let values: any = el.elattr.values;
            if (values) values = values.split(' ');
            if (values[3]) values[3] = 1;
            if (values[8]) values[8] = 1;
            if (values[13]) values[13] = 1;
            el.elattr.values = values.join(' ');
        }

        if (Array.isArray(el.elchilds)) el.elchilds.forEach(el => this.bleach(el));
    }
    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;
        const view = this.view as TextShapeView;


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
        let childs = (() => {
            const layout = view.getLayout();
            return renderTextLayout(elh, layout, view.frame, view.blur);
        })();

        const filterId = `${objectId(view)}`;
        const shadows = this.renderShadows(filterId);

        let props = this.getProps();
        let children = [...fills, ...childs, ...borders];

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, view.getShadows());
            filter = `url(#shadow-outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", { filter }, children)];
        }

        const blurId = `blur-${objectId(view)}`;
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