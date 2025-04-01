import { EL, elh, ShapeView } from "../../../dataview";
import { IRenderer } from "../../basic";
import { renderBlur, renderBorder, renderFills, renderShadows } from "../effects";
import { painter } from "./h";

export class SVGRenderer extends IRenderer {
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
}