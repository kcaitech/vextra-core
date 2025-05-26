/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { EL, elh, ShapeView } from "../../../dataview";
import { IRenderer } from "../../basic";
import { innerShadowId, renderBlur, renderBorder, renderFills, renderShadows } from "../effects";
import { objectId } from "../../../basic/objectid";
import { BlurType, ShapeType, Transform } from "../../../data";
import { stroke } from "../../stroke";

export class ViewSVGRenderer extends IRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    protected createBoard(): EL[] {
        const view = this.view;
        const path = view.getPath().clone();
        const border = view.getBorder();
        const fill = view.getFills();
        if (border.strokePaints.length) path.addPath(stroke(view));
        return renderFills(elh, fill, view.frame, path.toSVGString());
    }

    protected m_mask_group: ShapeView[] | undefined;
    protected m_mask_transform: Transform | undefined;

    protected getMaskTransform() {
        const view = this.view;
        if (!view.mask) return;
        const parent = view.parent;
        if (!parent) return;
        const __children = parent.childs;
        let index = __children.findIndex(i => i.id === view.id);
        if (index === -1) return;
        const maskGroup: ShapeView[] = [view];
        this.m_mask_group = maskGroup;
        for (let i = index + 1; i < __children.length; i++) {
            const cur = __children[i];
            if (cur && !cur.mask) maskGroup.push(cur);
            else break;
        }
        let x = Infinity;
        let y = Infinity;

        maskGroup.forEach(s => {
            const box = s.boundingBox();
            if (box.x < x) x = box.x;
            if (box.y < y) y = box.y;
        });

        return this.m_mask_transform = new Transform(1, 0, x, 0, 1, y);
    }

    protected bleach(el: EL) {
        if (el.elattr.fill && el.elattr.fill !== 'none' && !(el.elattr.fill as string).startsWith('url(#gradient')) {
            el.elattr.fill = '#FFF';
        }
        if (el.elattr.stroke && el.elattr.stroke !== 'none' && !(el.elattr.stroke as string).startsWith('url(#gradient')) {
            el.elattr.stroke = '#FFF';
        }
        if (Array.isArray(el.elchilds)) el.elchilds.forEach(el => this.bleach(el));
    }

    get DOM(): EL {
        const fills = this.renderFills();
        const childs = this.renderContents();
        const borders = this.renderBorder();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur-${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        const contextSettings = this.view.style.contextSettings;
        const props: any = {};
        if (contextSettings) {
            if (contextSettings.opacity !== undefined) {
                props.opacity = contextSettings.opacity;
            }
            props.style = { 'mix-blend-mode': contextSettings.blenMode };
        }

        let children = [...fills, ...childs, ...borders];

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.view.getShadows());
            if (this.view.type === ShapeType.Rectangle || this.view.type === ShapeType.Oval) {
                if (inner_url.length) filter = `${inner_url.join(' ')}`
            } else {
                filter = `url(#shadow-outer-${filterId}) `;
                if (inner_url.length) filter += inner_url.join(' ');
            }
            children = [...shadows, elh("g", { filter }, children)];
        }

        if (blur.length) {
            let filter: string = '';
            if (this.view.blur?.type === BlurType.Gaussian) filter = `url(#${blurId})`;
            children = [...blur, elh('g', { filter }, children)];
        }

        return elh("g", props, children);
    }

    protected renderMaskContents() {
        const transform = this.m_mask_transform!.clone();
        const group = this.m_mask_group || [];
        if (group.length < 2) return [];
        const inverse = transform.inverse;
        const els: EL[] = [];
        for (let i = 1; i < group.length; i++) {
            const __s = group[i];
            if (!__s.isVisible) continue;
            const dom = (__s.m_renderer as ViewSVGRenderer).DOM;
            if (!dom.elattr['style']) {
                dom.elattr['style'] = {};
            }
            (dom.elattr as any)['style']['transform'] = __s.transform.clone().multi(inverse).toString();
            els.push(dom);
        }

        return els;
    }

    protected get transformStrFromMaskSpace() {
        if (!this.m_mask_transform) return;
        return this.view.transform
            .clone()
            .multi(this.m_mask_transform.inverse)
            .toString();
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

    renderMaskGroup() {
        const props = this.getProps();
        const transform = this.getMaskTransform();
        if (transform) {
            Object.assign(props.style, { transform: transform.toString() });
            const id = `mask-base-${objectId(this)}`;
            const __body_transform = this.transformStrFromMaskSpace;
            let content = this.createBoard();
            const __body = elh("g", { style: { transform: __body_transform } }, content);
            this.bleach(__body);
            content = [__body];
            const mask = elh('mask', { id }, content);
            const rely = elh('g', { mask: `url(#${id})` }, this.renderMaskContents());
            content = [mask, rely];
            this.view.reset("g", props, content);
        }
    }

    renderFills(): EL[] {
        return renderFills(elh, this.view.getFills(), this.view.frame, this.view.getPathStr());
    }

    renderBorder(): EL[] {
        let border = this.view.getBorder();
        return renderBorder(elh, border, this.view.frame, this.view.getPathStr(), this.view.radius, this.view.isCustomBorder);
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

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        const view = this.view;

        const masked = view.masked;
        if (masked) {
            view.reset("g");
            masked.render();
            return ++this.m_render_version;
        }

        if (!view.isVisible) {
            view.reset("g");
            return ++this.m_render_version;
        }

        if (view.mask) {
            this.renderMaskGroup();
            return ++this.m_render_version;
        }

        const fills = this.renderFills();
        const borders = this.renderBorder();
        let childs = this.renderContents();

        const filterId = `${objectId(view)}`;
        const shadows = this.renderShadows(filterId);

        let props = this.getProps();
        let children = [...fills, ...childs, ...borders];

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, view.getShadows());
            filter = `url(#shadow-outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", { filter }, children)];
        }

        const blurId = `blur-${objectId(view)}`;
        const blur = this.renderBlur(blurId);
        if (blur.length) {
            if (view.blur!.type === BlurType.Gaussian) {
                children = [...blur, elh('g', { filter: `url(#${blurId})` }, children)];
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
        const renderContents = this.renderContents;
        this.renderContents = () => this.view.m_children;
        const version = this.render();
        this.renderContents = renderContents;
        return version;
    }
}