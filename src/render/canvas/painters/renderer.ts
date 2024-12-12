import { ArtboradView, ShapeView } from "../../../dataview";
import { IRenderer } from "../../basic";
import { render as renderFills } from "../effects/fill";
import { render as renderBorders } from "../effects/border";
import { render as renderShadows } from "../effects/shadow";

import { painter } from "./h";
import { border2path } from "../../../editor/utils/path";
import { ShapeType } from "../../../data";

export type Props = {
    transform: [number, number, number, number, number, number];
    opacity?: number;
    globalCompositeOperation?: string;
}

export class CanvasRenderer extends IRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    get ctx() {
        return this.view.canvasRenderingContext2D;
    }

    // 清除上次渲染产生的缓存
    private __clear_cache() {
        this.__path2D_cache = undefined;
        this.__props_cache = undefined;
    }

    private __path2D_cache: Path2D | undefined = undefined;

    private get path2D(): Path2D {
        return this.__path2D_cache ?? (this.__path2D_cache = new Path2D(this.view.getPath().toString()));
    }

    private __props_cache: Props | undefined = undefined;
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

    get props(): Props {
        return this.__props_cache ?? (this.__props_cache = this.getProps());
    }

    renderFills() {
        const fills = this.view.getFills();
        renderFills(this.getProps(), this.view.canvasRenderingContext2D, fills, this.path2D, this.view.size);
    }

    renderBorders() {
        renderBorders(this.view, this.getProps(), this.view.canvasRenderingContext2D, this.view.getBorders());
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

    clip(): Function | null {
        if ((this.view as ArtboradView).frameMaskDisabled) return null;
        this.ctx.save();
        this.ctx.transform(...this.props.transform);
        this.ctx.clip(this.path2D);
        this.ctx.resetTransform();
        return this.ctx.restore.bind(this.ctx);
    }

    render(type = "base"): number {
        // if (!this.checkAndResetDirty()) return this.m_render_version;
        this.view.layout();
        const ver = painter[type] ? painter[type](this.view, this) : painter["base"](this.view, this);
        this.__clear_cache();
        return ver;
    }
}