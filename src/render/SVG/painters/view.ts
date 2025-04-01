import { EL, elh, ShapeView } from "../../../dataview";
import { IRenderer } from "../../basic";
import { innerShadowId, renderBlur, renderBorder, renderFills, renderShadows } from "../effects";
import { painter } from "./h";
import { objectId } from "../../../basic/objectid";
import { BlurType, ShapeType } from "../../../data";

export class ViewSVGRenderer extends IRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    getProps(): { [key: string]: string } & { style: any } {
        const props: any = {};
        const style: any = {};

        style['transform'] = this.view.transform.toString();

        const contextSettings = this.view.contextSettings;

        if (contextSettings) {
            if (contextSettings.opacity !== undefined) {
                props.opacity = contextSettings.opacity;
            }
            style['mix-blend-mode'] = contextSettings.blenMode;
        }

        props.style = style;

        return props;
    }

    renderFills(): EL[] {
        return renderFills(elh, this.view.getFills(), this.view.frame, this.view.getPathStr());
    }

    renderBorder(): EL[] {
        let border = this.view.getBorder();
        return renderBorder(elh, border, this.view.frame, this.view.getPathStr(), this.view.radius, this.view.isCustomBorder);
    }

    renderShadows(id: string): EL[] {
        const view = this.view;
        return renderShadows(elh, id, view.getShadows(), view.getPathStr(), view.frame, view.getBorder(), this.view.data, this.view.radius, view.blur);
    }

    renderBlur(id: string): EL[] {
        const view = this.view;
        if (!view.blur) return [];
        return renderBlur(elh, view.blur, id, view.frame, view.getFills(), view.getBorder(), view.getPathStr());
    }

    renderContents(): EL[] {
        const childs = this.view.m_children;
        childs.forEach((c) => c.render());
        return childs;
    }

    render(type = "base"): number {
        return painter[type] ? painter[type](this.view, this) : painter["base"](this.view, this);
    }
    asyncRender(type = "base") {
        const renderContents = this.renderContents;
        this.renderContents = () => this.view.m_children;
        const version = this.render(type);
        this.renderContents = renderContents;
        return version;
    }

    get DOM(): EL {
        const fills = this.renderFills();
        const childs = this.renderContents();
        const borders = this.renderBorder();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        const contextSettings = this.view.style.contextSettings;
        const props: any = {};
        if (contextSettings) {
            if (contextSettings.opacity !== undefined) {
                props.opacity = contextSettings.opacity;
            }
            props.style = { 'mix-blend-mode': contextSettings.blenMode };
        }

        let children = [...fills, ...childs, ...borders];

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.view.getShadows());
            if (this.view.type === ShapeType.Rectangle || this.view.type === ShapeType.Oval) {
                if (inner_url.length) filter = `${inner_url.join(' ')}`
            } else {
                filter = `url(#pd_outer-${filterId}) `;
                if (inner_url.length) filter += inner_url.join(' ');
            }
            children = [...shadows, elh("g", { filter }, children)];
        }

        if (blur.length) {
            let filter: string = '';
            if (this.view.blur?.type === BlurType.Gaussian) filter = `url(#${blurId})`;
            children = [...blur, elh('g', { filter }, children)];
        }

        return elh("g", props, children);
    }
}