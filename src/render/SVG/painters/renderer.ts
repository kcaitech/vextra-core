import { EL, elh, ShapeView } from "../../../dataview";
import { IRenderer } from "../../basic";
import { renderBlur, renderBorders, renderFills, renderShadows } from "../effects";
import { importBorder } from "../../../data/baseimport";
import { exportBorder } from "../../../data/baseexport";
import { FillType, GradientType } from "../../../data";
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
        return renderFills(elh, fills, this.view.size, this.view.getPathStr());
    }

    renderBorders(): EL[] {
        let borders = this.view.getBorders();
        if (this.view.mask) {
            borders = borders.map(b => {
                const nb = importBorder(exportBorder(b));
                if (nb.fillType === FillType.Gradient && nb.gradient?.gradientType === GradientType.Angular) nb.fillType = FillType.SolidColor;
                return nb;
            })
        }
        return renderBorders(elh, borders, this.view.size, this.view.getPathStr(), this.view.m_data);
    }

    renderShadows(id: string): EL[] {
        const view = this.view;
        return renderShadows(elh, id, view.getShadows(), view.getPathStr(), view.frame, view.getFills(), view.getBorders(), view.m_data.type, view.blur);
    }

    renderBlur(id: string): EL[] {
        const view = this.view;
        if (!view.blur) return [];
        return renderBlur(elh, view.blur, id, view.frame, view.getFills(), view.getBorders(), view.getPathStr());
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