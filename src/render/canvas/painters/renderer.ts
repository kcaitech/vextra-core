import { ArtboardView, ShapeView, TextShapeView } from "../../../dataview";
import { IRenderer } from "../../basic";
import { render as renderFills } from "../effects/fill";
import { render as renderBorders } from "../effects/border";
import { render as renderShadows } from "../effects/shadow";
import { render as renderBlur } from "../effects/blur"

import { painter } from "./h";
import { renderTextLayout } from "../effects/text";
import { border2path } from "../../../dataview/border2path";

export type Props = {
    transform: [number, number, number, number, number, number];
    opacity?: number;
    globalCompositeOperation?: GlobalCompositeOperation;
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
        this.__flat_path_cache = undefined;
    }

    private __path2D_cache: Path2D | undefined = undefined;

    private get path2D(): Path2D {
        return this.__path2D_cache ?? (this.__path2D_cache = new Path2D(this.view.getOutLine().toString()));
    }

    private __props_cache: Props | undefined = undefined;
    getProps(): Props {
        const props: Props = { transform: this.view.transform.toArray() };
        const contextSettings = this.view.contextSettings;
        if (contextSettings) {
            if (contextSettings.opacity !== undefined) {
                props.opacity = contextSettings.opacity;
            }
            props.globalCompositeOperation = contextSettings.blenMode as GlobalCompositeOperation;
        }
        return props;
    }

    get props(): Props {
        return this.__props_cache ?? (this.__props_cache = this.getProps());
    }

    renderFills() {
        const fills = this.view.getFills();
        renderFills(this.props, this.view.canvasRenderingContext2D, fills, this.path2D, this.view.size);
    }

    renderBorders() {
        renderBorders(this.view, this.props, this.view.canvasRenderingContext2D, this.view.getBorders(), this.path2D);
    }

    renderShadows() {
        return renderShadows(this, this.view, this.props, this.view.canvasRenderingContext2D, this.view.getShadows(), this.view.getBorders(), this.view.getFills());
    }

    renderTextLayout() {
        const layout = (this.view as TextShapeView).getLayout();
        return renderTextLayout(this.props, this.view.canvasRenderingContext2D, layout, this.view as TextShapeView);
    }

    renderBlur() {
        return renderBlur(this.view, this.props);
    }

    renderContents() {
        const childs = this.view.m_children;
        if (childs.length) {
            this.ctx.save();
            this.ctx.transform(...this.props.transform);
            childs.forEach((c) => c.render());
            this.ctx.restore();
        }
    }

    private __flat_path_cache: Path2D | undefined;

    private getFlatPath(): Path2D {
        const path = new Path2D();
        if (this.view.getFills().length) {
            const fillP = this.path2D;
            path.addPath(fillP);
        }
        if (this.view.getBorders().strokePaints.length) {
            const borderP = border2path(this.view, this.view.getBorders());
            path.addPath(new Path2D(borderP.toString()));
        }
        const childs = this.view.m_children as ShapeView[];
        if (childs.length) {
            childs.forEach((c) => {
                const flat = (c.m_renderer as CanvasRenderer).flat;
                const m = c.matrix2Parent().toArray();
                path.addPath(flat, { a: m[0], b: m[1], c: m[2], d: m[3], e: m[4], f: m[5] });
            });
        }
        return path;
    }

    get flat(): Path2D {
        return this.__flat_path_cache ?? (this.__flat_path_cache = this.getFlatPath())
    }

    clip(): Function | null {
        if ((this.view as ArtboardView).frameMaskDisabled) return null;
        this.ctx.save();
        const ot = this.ctx.getTransform();
        this.ctx.transform(...this.props.transform);
        this.ctx.clip(this.path2D);
        this.ctx.setTransform(ot);
        return this.ctx.restore.bind(this.ctx);
    }

    render(type = "base"): number {
        this.view.layout();
        const ver = painter[type] ? painter[type](this.view, this) : painter["base"](this.view, this);
        this.__clear_cache();
        return ver;
    }
}