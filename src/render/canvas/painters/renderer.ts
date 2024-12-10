import { ShapeView } from "../../../dataview";
import { IRenderer } from "../../basic";
import { render as renderFills } from "../effects/fill"
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
        const props: Props = {transform: this.view.transform.toArray()};
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
    }

    renderShadows() {
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
        return painter[type ?? "base"](this.view, this);
    }
}