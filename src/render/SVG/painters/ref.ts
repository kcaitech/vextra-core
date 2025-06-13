/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { EL, elh, ShapeView, SymbolRefView } from "../../../dataview";
import { ViewSVGRenderer } from "./view";
import { objectId } from "../../../basic/objectid";
import { render as clippathR } from "../effects/clippath";
import { innerShadowId, renderShadows, renderBorder, renderBlur } from "../effects";
import { BlurType, Shadow } from "../../../data";
import { importBlur, importBorder, importShadow } from "../../../data/baseimport";

export class RefSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    renderBorder(): EL[] {
        const view = this.view;
        let border = view.getBorder();
        if (view.uniformScale) {
            const scale = view.uniformScale;
            border = importBorder(border);
            border.sideSetting.thicknessTop *= scale;
            border.sideSetting.thicknessBottom *= scale;
            border.sideSetting.thicknessLeft *= scale;
            border.sideSetting.thicknessRight *= scale;
        }
        return renderBorder(elh, border, view.frame, view.getPathStr(), view.radius, view.isCustomBorder);
    }

    renderShadows(id: string): EL[] {
        const view = this.view;
        let shadows: Shadow[] = view.getShadows();
        if (view.uniformScale) {
            const scale = view.uniformScale;
            shadows = shadows.map(s => {
                const copy = importShadow(s);
                copy.offsetX *= scale;
                copy.offsetY *= scale;
                copy.blurRadius *= scale;
                copy.spread *= scale;
                return copy;
            })
        }
        return renderShadows(elh, id, shadows, view.getPathStr(), view.frame, view.getBorder(), view.data, view.radius, view.blur);
    }

    renderContents(): EL[] {
        const view = this.view;
        const childs = view.children;
        childs.forEach((c) => c.render('SVG'));

        if (view.uniformScale) {
            return [elh('g', { transform: `scale(${view.uniformScale})` }, childs)];
        } else {
            return childs;
        }
    }

    renderBlur(id: string): EL[] {
        const view = this.view;
        let blur = view.blur;
        if (!blur) return [];
        if (view.uniformScale) {
            blur = importBlur(blur);
            blur.saturation *= view.uniformScale;
        }
        return renderBlur(elh, blur, id, view.frame, view.getFills(), view.getBorder(), view.getPathStr());
    }

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;
        const view = this.view as SymbolRefView;

        const masked = view.masked;
        if (masked) {
            view.reset("g");
            masked.render('SVG');
            return ++this.m_render_version;
        }

        if (!view.isVisible) {
            view.reset("g");
            return ++this.m_render_version;
        }

        const fills = this.renderFills();
        const borders = this.renderBorder();
        const contents = this.renderContents();

        const filterId = `${objectId(view)}`;
        const shadows = this.renderShadows(filterId);

        const props = this.getProps();

        let children;
        if (view.frameMaskDisabled) {
            children = [...fills, ...borders, ...contents];
        } else {
            const id = "clip-symbol-ref-" + objectId(view);
            const clip = clippathR(elh, id, view.getPathStr());
            children = [
                clip,
                elh("g", { "clip-path": "url(#" + id + ")" }, [...fills, ...contents]),
                ...borders
            ];
        }

        // 阴影
        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, view.getShadows());
            filter = `url(#shadow-outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", {filter}, children)];
        }

        // 模糊
        const blurId = `blur-${objectId(view)}`;
        const blur = this.renderBlur(blurId);
        if (blur.length) {
            if (view.blur!.type === BlurType.Gaussian) {
                children = [...blur, elh('g', {filter: `url(#${blurId})`}, children)];
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