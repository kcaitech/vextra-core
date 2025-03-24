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
        const fills = this.view.getFills();
        return renderFills(elh, fills, this.view.frame, this.view.getPathStr(), 'fill-' + this.view.id);
    }

    renderBorder(): EL[] {
        let borders = this.view.getBorder();
        return renderBorder(elh, borders, this.view.frame, this.view.getPathStr(), this.view.m_data, this.view.radius);
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

    render(type?: string): number {
        return painter[type ?? "base"](this.view, this);
    }
}