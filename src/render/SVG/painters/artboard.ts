/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ArtboardView, elh, ShapeView } from "../../../dataview";
import { ViewSVGRenderer } from "./view";
import { objectId } from "../../../basic/objectid";
import { BlurType, ScrollBehavior, Transform } from "../../../data";
import { render as clippathR } from "../effects/clippath";
import { innerShadowId } from "../effects";

export class ArtboardSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const view = this.view as ArtboardView;
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
        const childs = this.renderContents();
        if (view.autoLayout && view.autoLayout.stackReverseZIndex) childs.reverse();
        const borders = this.renderBorder();

        const svgprops: any = {}; // ??? 很大的疑惑，可能不是这里的问题

        const filterId = `${objectId(view)}`;
        const shadows = this.renderShadows(filterId);

        const contextSettings = view.style.contextSettings;

        let props: any = { style: { transform: view.transform.toString() } };

        let children = [...fills, ...childs];

        if (view.innerTransform) {
            const innerEL = childs.map(c => {
                const s = c as ShapeView;
                const trans = new Transform();
                if (s.scrollBehavior === ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME && view.innerTransform) {
                    trans.trans(-view.innerTransform.translateX, -view.innerTransform.translateY);
                    return elh("g", { transform: trans.toString() }, [c]);
                } else if (s.scrollBehavior === ScrollBehavior.STICKYSCROLLS && view.innerTransform) {
                    if (s.relativeFrame.y + view.innerTransform.translateY < 0) {
                        trans.trans(0, -(s.relativeFrame.y + view.innerTransform.translateY));
                        return elh("g", { transform: trans.toString() }, [c]);
                    }
                }
                return c;
            })
            const child = elh("g", {
                id: view.id,
                transform: view.innerTransform.toString()
            }, innerEL);
            children = [...fills, child];
        }
        if (contextSettings) {
            props.opacity = contextSettings.opacity;
            props.style['mix-blend-mode'] = contextSettings.blenMode;
        }

        if (view.frameMaskDisabled) {
            svgprops['overflow'] = 'visible';
            children = [elh("svg", svgprops, [...fills, ...borders, ...childs])];
        } else {
            // 裁剪属性不能放在filter的外层
            const id = "clip-board-" + objectId(view);
            svgprops['clip-path'] = "url(#" + id + ")";
            const _svg_node = elh("svg", svgprops, [clippathR(elh, id, view.getPathStr()), ...children]);
            children = [_svg_node, ...borders];
        }

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, view.getShadows());
            filter = `url(#shadow-outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            props.filter = filter;
            children = [...shadows, ...children];
        }

        const blur = view.blur;
        if (blur) {
            const blurId = `blur-${objectId(view)}`;
            const blurEl = this.renderBlur(blurId);
            children = [...blurEl, ...children];
            if (blur.type === BlurType.Background) {
                if (props.opacity) {
                    svgprops.opacity = props.opacity;
                    delete props.opacity;
                }
                if (props.style?.['mix-blend-mode']) {
                    if (svgprops.style) svgprops.style['mix-blend-mode'] = props.style['mix-blend-mode'];
                    else svgprops.style = { 'mix-blend-mode': props.style['mix-blend-mode'] };
                    delete props.style['mix-blend-mode'];
                }
                svgprops['filter'] = (svgprops['filter'] ?? '') + `url(#${blurId})`;
            } else {
                props['filter'] = (props['filter'] ?? '') + `url(#${blurId})`;
            }
        }

        view.reset("g", props, children);

        return ++this.m_render_version;
    }

    asyncRender() {
        return this.render();
    }
}