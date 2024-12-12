import { ShapeView } from "../../../dataview";
import { IRenderer } from "../../basic";
import { render as renderFills } from "../effects/fill";
import { render as renderBorders } from "../effects/border";
import { render as renderShadows } from "../effects/shadow";

import { painter } from "./h";

export type Props = {
    transform: [number, number, number, number, number, number];
    opacity?: number;
    globalCompositeOperation?: string;
}

export class CanvasRenderer extends IRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    private getPath2D(): Path2D {
        return new Path2D(this.view.getPath().toString());
    }

    getProps(): Props {
        const transform = this.view.matrix2Root();
        const props: Props = {transform: transform.toArray()};
        const contextSettings = this.view.contextSettings;
        if (contextSettings) {
            if (contextSettings.opacity !== undefined) {
                props.opacity = contextSettings.opacity;
            }
            props.globalCompositeOperation = contextSettings.blenMode;
        }
        return props;
    }

    renderFills() {
        const fills = this.view.getFills();
        renderFills(this.getProps(), this.view.canvasRenderingContext2D, fills, this.getPath2D(), this.view.size);
    }

    renderBorders() {
        renderBorders(this.view, this.getProps(), this.view.canvasRenderingContext2D, this.view.getBorders(), this.view.size);
    }

    renderShadows() {
        return renderShadows(this.view.canvasRenderingContext2D, this.view.getShadows());
    }

    renderBlur() {
    }

    renderContents() {
        const childs = this.view.m_children;
        childs.forEach((c) => c.render());
    }

    checkAndResetDirty(): boolean {
        return this.view.m_ctx.removeDirty(this.view);
    }

    m_render_version: number = 0;

    render(type?: string): number {
        return painter["base"](this.view, this);
        // return painter[type ?? "base"](this.view, this);
    }
}