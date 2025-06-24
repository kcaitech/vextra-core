/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeView, TextShapeView } from "../../../dataview";
import { IRenderer } from "../../basic";
import { render as renderFills } from "../effects/fill";
import { render as renderBorder } from "../effects/border";
import { render as renderShadows } from "../effects/shadow";
import { render as renderBlur } from "../effects/blur"

import { renderTextLayout } from "../effects/text";
import { stroke } from "../../stroke";

import { Path2D } from "../types";


export type Props = {
    transform: [number, number, number, number, number, number];
    opacity?: number;
    globalCompositeOperation?: GlobalCompositeOperation;
}

export class ViewCanvasRenderer extends IRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    get ctx() {
        return this.view.canvasRenderingContext2D;
    }

    // 清除上次渲染产生的缓存
    private __clear_cache() {
        this.__path_2D_cache = undefined;
        this.__props_cache = undefined;
        this.__flat_path_cache = undefined;
    }

    private __path_2D_cache: Path2D | undefined = undefined;

    private get path2D(): Path2D {
        return this.__path_2D_cache ?? (this.__path_2D_cache = new Path2D(this.view.getPath().toSVGString()));
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
        renderFills(this.props, this.view.canvasRenderingContext2D, fills, this.path2D, this.view.frame);
    }

    renderBorder() {
        renderBorder(this.view, this.props, this.view.canvasRenderingContext2D, this.view.getBorder(), this.path2D);
    }

    renderShadows(): Function | undefined {
        return renderShadows(this, this.view, this.props, this.view.canvasRenderingContext2D, this.view.getShadows(), this.view.getBorder(), this.view.getFills());
    }

    renderTextLayout() {
        const layout = (this.view as TextShapeView).getLayout();
        return renderTextLayout(this.props, this.view.canvasRenderingContext2D, layout, this.view as TextShapeView);
    }

    renderBlur(): Function | null {
        return renderBlur(this.view, this.props);
    }

    renderContents() {
        const childs = this.view.children;
        if (childs.length) {
            this.ctx.save();
            this.ctx.transform(...this.props.transform);
            childs.forEach((c) => c.render('Canvas'));
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
        if (this.view.getBorder().strokePaints.length) {
            const borderP = stroke(this.view);
            path.addPath(new Path2D(borderP.toString()));
        }
        const childs = this.view.children as ShapeView[];
        if (childs.length) {
            childs.forEach((c) => {
                const flat = (c.renderer as ViewCanvasRenderer).flat;
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
        if (this.view.frameMaskDisabled) return null;
        this.ctx.save();
        const ot = this.ctx.getTransform();
        this.ctx.transform(...this.props.transform);
        this.ctx.clip(this.path2D);
        this.ctx.setTransform(ot);
        return this.ctx.restore.bind(this.ctx);
    }

    render(): number {
        const ctx = this.view.canvasRenderingContext2D;
        ctx.save();
        if (this.props.opacity) ctx.globalAlpha = this.props.opacity;
        if (this.props.globalCompositeOperation) {
            ctx.globalCompositeOperation = this.props.globalCompositeOperation;
        }
        const blurEnd = this.renderBlur();
        const shadowEnd = this.renderShadows();
        this.renderFills();
        this.renderContents();
        this.renderBorder();
        shadowEnd && shadowEnd();
        blurEnd && blurEnd();
        ctx.restore();
        this.__clear_cache();
        return ++this.m_render_version;
    }

    asyncRender(): number {
        return this.render();
    }
}