/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { elh, ShapeView } from "../../../dataview";
import { innerShadowId } from "../effects";
import { objectId } from "../../../basic/objectid";
import { BlurType } from "../../../data";
import { ViewSVGRenderer } from "./view";
import { render as clippathR } from "../effects/clippath";

export class SymbolSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const view = this.view;
        if (!this.checkAndResetDirty()) return this.m_render_version;

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
        let childs = this.renderContents();
        const autoInfo = view.autoLayout;
        if (autoInfo && autoInfo.stackReverseZIndex) childs = childs.reverse();

        const filterId = `${objectId(view)}`;
        const shadows = this.renderShadows(filterId);

        let props = this.getProps();

        let children;
        if (view.frameMaskDisabled) {
            children = [...fills, ...borders, ...childs];
        } else {
            const id = "clip-symbol-" + objectId(view);
            const clip = clippathR(elh, id, view.getPathStr());
            children = [
                clip,
                elh("g", {"clip-path": "url(#" + id + ")"}, [...fills, ...childs]),
                ...borders
            ];
        }

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, view.getShadows());
            filter = `url(#shadow-outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", {filter}, children)];
        }

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